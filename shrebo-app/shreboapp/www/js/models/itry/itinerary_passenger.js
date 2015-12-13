define(['backbone', 'settings', 'util'], function($B, settings,
	util) {
	/**
	 * ItineraryPassenger is the user/profile model for itenaries. It provides lists of
	 * passengers given a ItenaryService key/object.
	 * 
	 * You should limit the list of passengers by giving a &service=pk query filter. This
	 * will return the list of passengers for this particular service. You can get a list
	 * of services using the ItineraryService model.
	 * 
	 * Each object returned will include the following attributes:
	 * 
	 * <pre>
	 * .first_name    first name
	 * .last_name     last name
	 * .pax_count     passenger count
	 * .tickets       a list of booking references (see ItineraryReservation)
	 * </pre>
	 */
	var ItineraryPassenger = $B.Model.extend({
		urlRoot : settings.itineraryApiUri + '/reservation/',
		asFilter : 'passenger',
		defaults : {
			'amount' : 0,
		}
	/**
	 * @memberOf ItineraryPassenger
	 */
	// business functions
	});
	var objects = $B.Collection.extend({
		model : ItineraryPassenger,
		url : settings.itineraryApiUri + '/passenger/',
		comparator : 'last_name',
		/**
		 * @memberOf
		 */
		asAlphabetDictionary : function() {
			var c = this;
			var dict = util.asAlphabetDictionary(this.toArray(), {
				sorted : true,
				// return the first letter as given by last name
				keyfn : function(v) {
					var name = v.get('last_name') || v.get('first_name') || v.get('full_name') || "*";
					return name.substring(0, 1).toUpperCase();
				},
				// return the full ItineraryPassenger object as the
				// value of each entry
				valuefn : function(v) {
					return v;
				}
			});
			return dict;
		}
	});
	ItineraryPassenger.objects = objects;
	return ItineraryPassenger;
});
