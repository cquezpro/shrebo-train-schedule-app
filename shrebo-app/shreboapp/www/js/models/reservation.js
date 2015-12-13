define(['backbone', 'settings'], function($B, settings) {
	var Reservation = $B.Model.extend({
		urlRoot : settings.apiUri + '/reservation/',
		asFilter : 'reservation',
		defaults : {
			from_date : new Date(),
			to_date : new Date()
		},
		initialize : function(attributes, options) {
			// set the shareable id as the model
			// attribute, but keep the Backbone shareable instance
			// as a handy reference
			if (options && options.related) {
				if (options.related.shareable) {
					this.set('shareable', options.related.shareable.url());
					this.shareable = options.related.shareable;
				}
				if (options.related.user) {
					this.set('user', options.related.user.url());
					this.user = options.related.user;
				}
			}
		},
		// return attributes in JavaScript format
		parse : function(data, options) {
			// parse server response to convert
			// dates given as ISO strings (yyyy-mm-ddThh:mm)
			// into javascript objects
			data.from_date = new Date(data.from_date),
			data.to_date = new Date(data.to_date)
			if (_.isObject(data.shareable)) {
				var Shareable = require('models/shareable');
				this.shareable = new Shareable(data.shareable);
				data.shareable = data.shareable.resource_uri;
			};
			return data;
		},
		// business functions
		cancel : function() {
			this.set('status', Reservation.STATUS.CANCELLED);
		}
	});
	var objects = $B.Collection.extend({
		model : Reservation,
		url : settings.apiUri + '/reservation/',
	});
	Reservation.objects = objects;
	Reservation.STATUS = {
		REQUESTED : 0,
		CONFIRMED : 1,
		REJECTED : 2,
		COMPLETED : 3,
		PROGRESS : 4,
		CANCELLED : 9
	};
	return Reservation;
});
