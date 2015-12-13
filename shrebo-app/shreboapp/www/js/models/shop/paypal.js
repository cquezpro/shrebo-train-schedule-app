define(
	['backbone', 'underscore', 'settings', 'jquery', 'paypal_mobile'],
	function($B, _, settings) {
		/**
		 * PayPal is the payment processor for checkouts using PayPal. It encapsulates the
		 * payment processor's flow and specific objects and returns a $.Deferred for easy
		 * processing by the client.
		 * 
		 * Use as follows:
		 * 
		 * <pre>
		 * var processor = PayPalProcessor({
		 * 	clientIds : {
		 * 		'production' : 'id',
		 * 		'sandbox' : 'id',
		 * 	},
		 *  config : {
		 *      'merchantName : 'id',
		 *      'merchantPrivacyPolicyURL' : 'url',
		 *      'merchantUserAgreementURL' : 'url',
		 *  },
		 *  environment : 'production' | 'sandbox';
		 * });
		 * var results = processor.processOrder({
		 *    shipping : float,
		 *    subtotal: float,
		 *    tax: float,
		 *    currencyCode: string,
		 *    description: string,
		 *    intent: 'authorize' | 'sale' | 'order', (defaults to 'sale')
		 * });
		 * results.done(function(...) {});
		 * results.fail(function(...) {});
		 * </pre>
		 * 
		 * Note that 'production' and 'sandbox' are translated to
		 * 'PayPalEnvironmentProduction' and 'PayPalEnvironmentSandbox' respectively by
		 * this implementation.
		 */
		var PayPalProcessor = function(options) {
			return this.initialize(options);
		};
		_
			.extend(
				PayPalProcessor.prototype,
				{
					/**
					 * @memberOf PayPalProcessor
					 */
					initialize : function(options) {
						options.clientIds = options.clientIds || {};
						this.clientIds = {
							'PayPalEnvironmentProduction' : options.clientIds.production
								|| 'unknown-production-id-invalid',
							'PayPalEnvironmentSandbox' : options.clientIds.sandbox
								|| 'unknown-sandbox-id-invalid',
						};
						this.config = options.config
							|| {
								merchantName : 'unknown-merchant-invalid',
								merchantPrivacyPolicyURL : 'https://invalid.address.com/policy',
								merchantUserAgreementURL : 'https://invalid.address.com/agreement',
							};
						this.environment = 'production' == options.environment
							? 'PayPalEnvironmentProduction'
							: 'PayPalEnvironmentSandbox';
					},
					/**
					 * take an Order object and send it through the paypal process flow.
					 * Expects an order object that contains:
					 * 
					 * <pre>
					 * {
					 * 	shipping: float,
					 *  subtotal: float,
					 *  tax: float,
					 *  amount: float,
					 *  currencyCode: string,
					 *  description: string,
					 *  intent: 'authorize' | 'sale' | 'order', (defaults to 'sale')
					 * }
					 * </pre>
					 * 
					 * The $.Deferred returned by this function either rejects or resolves
					 * as follows:
					 * 
					 * <pre>
					 * .done({
					 *   authorization: &lt;paypal authorization&gt;,
					 *   order: order instanced as passed in
					 * });
					 * .fail({
					 *   results: results,
					 *   order: order instance as passed in   
					 * });
					 * </pre>
					 * 
					 * @param order
					 *            the Order instance. Must contain all required fields for
					 *            Paypal processing
					 * @return a $.Deferred that will succeed or fail depending on the
					 *         result of PayPal's checkout flow
					 */
					processOrder : function(order) {
						// create the deferred object for clients to use
						this.results = $.Deferred();
						// prepare payment and configuration
						var detail = new PayPalPaymentDetails(
							String(order.subtotal), String(order.shipping),
							String(order.tax));
						this.payment = new PayPalPayment(String(order.amount),
							order.currencyCode, order.description, order.intent
								|| "sale", detail);
						this.paymentConfig = PayPalConfiguration(this.config);
						// start flow
						var processor = this;
						PayPalMobile.init(this.clientIds, function() {
							// make sure we bind "this" correctly" when
							// calling subsequent methods
							processor.onInit();
						});
						return this.results;
					},
					/**
					 * PayPalMobile callbacks
					 */
					onInit : function() {
						var processor = this;
						PayPalMobile.prepareToRender(this.environment,
							this.paymentConfig, function() {
								processor.onRender();
							});
					},
					onRender : function() {
						// make sure we bind "this" correctly" when
						// calling subsequent methods
						var processor = this;
						PayPalMobile.renderSinglePaymentUI(this.payment,
							function(authorization) {
								console.debug("paypal auth: " + authorization);
								processor.onSuccess(authorization);
							}, function(result) {
								console.debug(result);
								processor.onCancel(result);
							});
					},
					onSuccess : function(authorization) {
						var processor = this;
						this.results.resolve({
							authorization : authorization,
							order : processor.order
						});
					},
					onCancel : function(result) {
						var processor = this;
						this.results.reject({
							result : result,
							order : processor.order
						});
					}
				});
		return PayPalProcessor;
	});
