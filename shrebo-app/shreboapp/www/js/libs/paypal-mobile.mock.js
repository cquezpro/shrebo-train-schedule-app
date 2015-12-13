define([],
	/**
	 * a PayPalMobile mock for web apps and testing
	 * 
	 * Use as follows:
	 * 
	 * <pre>
	 * 1-var detail = new PayPalPaymentDetails(shipping, total, tax);
	 * 2-var payment = new PayPalPayment(amount, currency, description, intent, detail); 
	 * 3-PayPalMobile.init(clientIDs, onInit);
	 * 4-var config = PayPalConfiguration(options); // see method below
	 * 5-in onInit, call PayPalMobile.prepareToRender(environment, config, onRender);
	 * 6-in onRender, call PayPalMobile.renderSinglePaymentUI(payment, onSuccess, onCancel);
	 * </pre>
	 */
	function() { //
		console.debug('*** paypal is mocked ***');
		var PayPalMobileMock = {
			/**
			 * <pre>
			 * if (PayPalMobile.isMock) {
			 * 	PayPalMobile.mock({
			 * 		success : true,
			 * 		authorization : {},
			 * 	});
			 * }
			 * </pre>
			 */
			isMock : true,
			mock : function(config) {
				this.config = config || {
					success : true,
					authorization : { auth_code : 'paypal-mock-sandbox-auth'},
					cancelResult : { reason: 'paypal-mock-cancel'},
				};
			},
			/**
			 * <pre>
			 * clientIDs = {
			 * 	'PayPalEnvironmentProduction' : 'YOUR_PRODUCTION_CLIENT_ID',
			 * 	'PayPalEnvironmentSandbox' : 'YOUR_SANDBOX_CLIENT_ID';
			 * };
			 * </pre>
			 * 
			 * @param clientIDs
			 *            array of client ids
			 * @param onPaypalInit
			 *            function(), from here call prepareToRender
			 * 
			 * @memberOf PayPalMobileMock
			 */
			init : function(clientIDs, onPaypalInit) {
				onPaypalInit();
			},
			/**
			 * @param onAuthorization
			 *            callback, function(authorization)
			 * @param onCancel
			 *            callback, function(result)
			 */
			renderSinglePaymentUI : function(payment, onAuthorization, onCancel) {
				var mock = this;
				var confirmCallback = function(button) {
					if (button == 1) {
						onAuthorization(mock.config.authorization);
					} else {
						onCancel(mock.config.cancelResult);
					}
				};
				var message = "Paypal Simulation UI<br>Amount: {0}<br>Text: {1}"
					.format([payment.amount, payment.description]);
				navigator.notification.confirm(message, confirmCallback,
					"simulation payment", "success,failure");
			},
			/**
			 * @param onAuthorization
			 *            callback, function(authorization)
			 * @param onCancel
			 *            callback, function(result)
			 */
			renderFuturePaymentUI : function(onAuthorization, onCancel) {
				if (this.config.success) {
					onAuthorization(this.config.authorization);
				} else {
					onCancel(this.config.cancelResult);
				}
			},
			/**
			 * @param attributes
			 *            array of attributes requested e.g. ["profile", "email", "phone",
			 *            "address", "futurepayments", "paypalattributes"]
			 * @param onAuthorization
			 *            callback, function(authorization)
			 * @param onCancel
			 *            callback, function(result)
			 */
			renderProfileSharingUI : function(attributes, onAuthorization,
				onCancel) {
				if (this.config.success) {
					onAuthorization(this.config.authorization);
				} else {
					onCancel(this.config.cancelResult);
				}
			},
			/**
			 * @param environment
			 *            e.g. "PayPalEnvironmentSandbox", "PayPalEnvironmentProduction"
			 * @param configuration
			 *            a PaypalConfiguration
			 * @param onPrepareRender
			 *            callback for when paypal is ready, from this callback call the
			 *            renderXXXPayment methods
			 */
			prepareToRender : function(environment, configuration,
				onPrepareRender) {
				onPrepareRender();
			},
		}
		/**
		 * @see http://paypal.github.io/PayPal-Android-SDK/com/paypal/android/sdk/payments/PayPalPaymentDetails.html
		 */
		var PayPalPaymentDetails = function(subtotal, shipping, tax) {
			this.shipping = shipping;
			this.subtotal = subtotal;
			this.tax = tax;
		};
		/**
		 * @param amount
		 *            float
		 * @param currencyCode
		 *            string
		 * @param description
		 *            string
		 * @param intent
		 *            string, "sale" | "authorize" | "order"
		 * 
		 * @see http://paypal.github.io/PayPal-Android-SDK/com/paypal/android/sdk/payments/PayPalPayment.html
		 */
		var PayPalPayment = function(amount, currencyCode, description, intent,
			detail) {
			this.amount = amount;
			this.currencyCode = currencyCode;
			this.description = description;
			this.paymentIntent = intent;
			this.detail = detail;
		};
		/**
		 * <pre>
		 * options = {
		 * 	merchantName : 'My test shop'
		 * 	merchantPrivacyPolicyURL : 'https://mytestshop.com/policy',
		 * 	merchantUserAgreementURL : 'quot;https://mytestshop.com/agreement',
		 * } &lt; pre&gt;
		 * 
		 */
		var PayPalConfiguration = function(options) {
			this.config = options || {
				merchantName : 'mockmerchant',
				merchantPrivacyPolicyURL : "https://mytestshop.com/policy",
				merchantUserAgreementURL : "https://mytestshop.com/agreement",
			};
		};
		/* install paypal objects */
		PayPalMobileMock.mock();
		window.PayPalMobile = PayPalMobileMock;
		window.PayPalPaymentDetails = PayPalPaymentDetails;
		window.PayPalPayment = PayPalPayment;
		window.PayPalConfiguration = PayPalConfiguration;
	});