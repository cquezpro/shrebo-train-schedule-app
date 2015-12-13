define(['backbone', 'settings'], function($B, settings) {
	/**
	 * Payment is the commercial settling of an Order. 
	 */
	var Payment = $B.Model.extend({
		urlRoot : settings.shopApiUri + '/payment/',
		asFilter : 'payment',
		initialize : function(attributes, options) {
		},
	});
	var objects = $B.Collection.extend({
		model : Payment,
		url : settings.shopApiUri + '/payment/',
	});
	Payment.objects = objects;
	return Payment;
});
