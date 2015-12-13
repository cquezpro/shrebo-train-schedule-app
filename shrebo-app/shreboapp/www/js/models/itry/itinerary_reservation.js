define(['backbone', 'settings', 'datejs', 'tastypie'], function($B, settings, xDate, tastypie) {
	/**
	 * ItineraryReservation serves as the client-side booking API. Use it to create a new
	 * reservation by providing the following attributes:
	 * 
	 * .itinerary_ref the itinerary reference as retrieved from the Itinerary resource
	 * .pax_count: the number of passengers .section: the section code
	 * 
	 * Response will be 201 if the reservation was created ok. The Location header will
	 * contain the new reservation URI
	 */
	var ItineraryReservation = $B.Model.extend({
		urlRoot : settings.itineraryApiUri + '/reservation/',
		asFilter : 'reservation',
		defaults: {
			status: 0, // REQUESTED
		},
		/**
		 * @memberOf ItineraryReservation
		 */
		// return attributes in JavaScript format
		parse : function(data, options) {
			// parse server response to convert
			// dates given as ISO strings (yyyy-mm-ddThh:mm+00:00)
			// into javascript objects
			data.departure = new Date(xDate
				.parse(data.departure));
			data.arrival = new Date(xDate
				.parse(data.arrival));
			return data;
		},
		// business functions
		isCancelled : function() {
			return this.get('status') == ItineraryReservation.STATUS.CANCELLED;
		},
		isConfirmed: function() {
			return this.get('status') == ItineraryReservation.STATUS.CONFIRMED;
		},
		isRequested: function() {
			return this.get('status') == ItineraryReservation.STATUS.REQUESTED;
		},
		isRejected: function() {
			return this.get('status') == ItineraryReservation.STATUS.REJECTED;
		},
		isCompleted: function() {
			return this.get('status') == ItineraryReservation.STATUS.COMPLETED;
		},
		isInProgress: function() {
			return this.get('status') == ItineraryReservation.STATUS.PROGRESS;
		},
		cancel : function() {
			this.set('status', ItineraryReservation.STATUS.CANCELLED);
		},
		confirm: function() {
			this.set('status', ItineraryReservation.STATUS.CONFIRMED);
		},
		reject: function() {
			this.set('status', ItineraryReservation.STATUS.REJECTED);
		},
		complete: function() {
			this.set('status', ItineraryReservation.STATUS.COMPLETED);
		},
		inProgress: function() {
			this.set('status', ItineraryReservation.STATUS.PROGRESS);
		},
		requested: function() {
			this.set('status', ItineraryReservation.STATUS.REQUESTED);
		},
	});
	var objects = $B.Collection.extend({
		model : ItineraryReservation,
		url : settings.itineraryApiUri + '/reservation/',
	});
	ItineraryReservation.objects = objects;
	ItineraryReservation.STATUS = {
		REQUESTED : 0,
		CONFIRMED : 1,
		REJECTED : 2,
		COMPLETED : 3,
		PROGRESS: 4,
		CANCELLED : 9
	};
	return ItineraryReservation;
});
