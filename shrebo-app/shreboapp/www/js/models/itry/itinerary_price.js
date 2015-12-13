define(['backbone', 'settings', 'datejs'], function($B, settings, xDate) {
	/**
	 * ItineraryPrice is the pricing model. It provides a price result given an itinerary
	 * reference
	 * 
	 * <pre>
	 * Example:
	 *    var price = new ItineraryPrice({
	 *        ref : 'itinerary-reference',
	 *        pax_count : int,
	 *        pax_class : 'code',
	 *        section: 'code',
	 *    });
	 *    result = price.fetch();
	 *    =&gt; 
	 *    {'amount': 5.0, 
	 *     'currency': 'CHF', 
	 *     'ref': 'BZYWDGK8R', 
	 *     'resource_uri': 
	 *     '/api/v1/coach/price/BZYWDGK8R/', 
	 *     'success': true
	 *    }
	 * </pre>
	 */
	var ItineraryPrice = $B.Model.extend({
		urlRoot : settings.itineraryApiUri + '/price/',
		asFilter : 'itinerary',
		initialize : function(options) {
			this.set('ref', options.ref || '');
			this.qryFilter('pax_count', options.pax_count || 1);
			this.qryFilter('section', options.section || '');
			this.qryFilter('pax_class', options.pax_class || '');
		},
		url : function() {
			return this.urlRoot + this.get('ref') + '/';
		},
		parse : function(data) {
		    data.amount = data.amount || '?';
		    data.currency = data.currency || '';
		    return data
		},
	});
	return ItineraryPrice;
});
