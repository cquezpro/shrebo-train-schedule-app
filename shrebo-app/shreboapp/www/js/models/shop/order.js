define(['backbone', 'settings', 'datejs'], function($B, settings, xDate) {
	/**
	 * Order implements the payment-side equivalent of a Reservation. While a Reservation
	 * represents the resource blocking and assignment, an Order represents the commercial
	 * value to the business.
	 * 
	 * Use this model to initiate the client-side order processing, using some
	 * PaymentProcessor.
	 * 
	 */
	var Order = $B.Model.extend({
		urlRoot : settings.shopApiUri + '/order/',
		asFilter : 'order',
		initialize : function(attributes, options) {
		},
		defaults : {
			shipping : 0, // shipping fee
			subtotal : 0, // the price of the good/service
			tax : 0, // tax according to local tax law
			amount : 0, // amount = sum(shipping + subtotal + tax)
			description : 'a sample order',
			currencyCode : 'CHF'
		},
		// return attributes in JavaScript format
		parse : function(data, options) {
			// parse server response to convert
			// dates given as ISO strings (yyyy-mm-ddThh:mm+00:00)
			// into javascript objects
			data.created = new Date(xDate.parse(data.created));
			data.paid = parseFloat(data.paid || 0);
			data.items_discount = parseFloat(data.items_discount || 0);
			data.total = parseFloat(data.total || 0);
			data.items_subtotal = parseFloat(data.items_subtotal || 0);
			data.item_discount = parseFloat(data.items_discount || 0);
			data.items_tax = parseFloat(data.items_tax || 0);
			data.shipping_tax = parseFloat(data.shipping_tax || 0);
			data.shipping_cost = parseFloat(data.shipping_cost || 0);
			return data;
		},
		/**
		 * checkout will call the payment processor and settle the order with a Payment
		 * This returns the $.Deferred of the processor that either resolves or rejects.
		 * See the PayPalProcessor for details. This assumes you have initialized the
		 * processor using the respective settings.paymentConfig.
		 * 
		 * @param processor
		 *            is the PayPalProcessor
		 */
		checkout : function(processor) {
			//FIXME call appropriate as...Order(). Need some way to 
			//know what type the payment processor is
			var result = processor.processOrder(this.asPaypalOrder());
			return result;
		},
		/**
		 * return order as a paypal order
		 */
		asPaypalOrder : function() {
		    var item = this.get('items')[0];
		    return {
				shipping : this.get('shipping_cost'),
				subtotal : this.get('items_subtotal'),
				tax : this.get('items_tax'),
				currencyCode : this.get('currency'),
				description : item['name'],
				amount: this.get('total'),
				intent : 'sale',
			};
		}
	});
	var objects = $B.Collection.extend({
		model : Order,
		url : settings.shopApiUri + '/order/',
	});
	Order.objects = objects;
	return Order;
});
