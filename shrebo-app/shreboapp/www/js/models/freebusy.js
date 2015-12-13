define(['backbone', 'util', 'settings'], function($B, util, settings) {
	// actual events -- this is in effect a partial Reservation
	var FreeBusyEvent = $B.Model.extend({
		urlRoot : function() {
			var fromDate_iso = util.dateISO(this.fromDate);
			var toDate_iso = util.dateISO(this.toDate);
			return settings.apiUri + '/freeBusy/{0}/{1}/{2}/'.format(this.shareable_id, fromDate_iso, toDate_iso);
		},
		defaults : {
			from_date : null,
			to_date : null,
			resource_url : null,
			shareable : null,
		},
		// parse server response
		parse : function(data, option) {
			var obj = {
				from_date : new Date(data.from_date),
				to_date : new Date(data.to_date)
			}
			return obj;
		}
	});
	// the FreeBusy model. A convenience class to
	// make it easy to query availabilities
	var FreeBusy = $B.Model.extend({
		urlRoot : settings.apiUri + '/freeBusy/',
	});
	/**
	 * Call checkAvailability to query all blocked times between fromDate and
	 * toDate for a particluar shareable
	 *
	 * @param shareable  the Shareable model instance to query for
	 * @param fromDate   the from Date instance (datetime)
	 * @param toDate     the to Date instance (datetime)
	 * @return jQuery XHR object, use .success, .fail, .done, .always to
	 * process response
	 */
	FreeBusy.checkAvailability = function(shareable, fromDate, toDate) {
		/**
		 * check availability
		 */
		// query the freebusy collection
		var objects = new FreeBusy.objects();
		objects.shareable = shareable;
		objects.fromDate = fromDate;
		objects.toDate = toDate;
		objects.response = objects.fetch();
		return objects;
	};
	var objects = $B.Collection.extend({
		//
		model : FreeBusyEvent,
		// query parameters
		fromDate : null,
		toDate : null,
		shareable : null,
		// result
		available : null,
		// the url depends on the query parameters
		url : function() {
			var fromDate_iso = util.dateISO(this.fromDate);
			var toDate_iso = util.dateISO(this.toDate);
			return settings.apiUri + '/freeBusy/{0}/{1}/{2}/'.format(this.shareable.get('id'), fromDate_iso, toDate_iso);
		},
		// parse response
		parse : function(data, option) {
			this.available = data.available;
			// we get an array in data.events:
			// [
			//  {
			//   from_date: "2014-08-06T18:00:00"
			//   resource_url: "/api/v1/reservation/67/"
			//   shareable: "/api/v1/reservation/14/"
			//   to_date: "2014-08-07T18:00:00"
			//  },
			//  ...
			// ]
			return data.events;
		}
	});
	// install class variables, methods
	FreeBusy.objects = objects;
	return FreeBusy;
});
