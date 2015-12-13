define(['backbone', 'util', 'models', 'templates', 'iscroll'], function($B, util, models, templates, IScroll) {
	var BookingListView = $B.View.extend({
		events : {
			"click .action-select" : "selectBooking",
			"click .action-cancel" : "cancelBooking",
			"click .action-infobox-close" : "closeInfobox",
		},
		// basic view interface
		initialize : function() {
			this.collection && this.collection.bind("change", this.collectionChanged, this);
		},
		render : function() {
			// render collection of bookings
			this.$el.empty();
			this.$el.append(util.render(templates.booking_list_html, {
				col : this.collection,
				view : this,
			}));
			// make list scrollable
			new IScroll("#bookings-wrapper", opt);
			document.addEventListener('touchmove', function(e) {
				e.preventDefault();
			}, false);
		},
		collectionChanged : function() {

		},
		close : function() {
			this.remove();
			this.unbind();
			this.collection && this.collection.unbind("change", this.modelChanged);
		},
		// functionality
		selectBooking : function(e) {
			// get the id of the selected shareable
			// note that this is the id of the model object
			// and not the id attribute (the id attribute
			// is the server-side pk, whereas the model
			// id is the resource URI).
			var target = $(e.currentTarget).closest("li");
			var sid = target.attr('data-id');
			console.debug('BookingListView click booking id=' + sid);
			var booking = this.collection.get(sid);
			// show infobox
			this.$("#info-img").attr("src", booking.shareable.get('picture_url'));
			this.$("#info-name").html(booking.shareable.get('label'));
			this.$("#info-place").html(booking.shareable.get('location_pickup'));
			this.$("#info-text").html(booking.shareable.get('description'));
			this.$("#infobox").css('display', 'block');
			//this.trigger('select_booking', booking);
		},
		cancelBooking : function(e) {
			// get the booking id
			var target = $(e.currentTarget).closest("li");
			var sid = target.attr('data-id');
			console.debug('BookingListView click cancel booking id=' + sid);
			var booking = this.collection.get(sid);
			var view = this;
			// get confirmation
			navigator.notification.confirm("Termin absagen?", function(r) {
				app.progress.show();
				if (r == 1) {
					// on confirmed, cancel
					booking.set('status', 9);
					// CANCELED
					var result = booking.save();
					result.done(function() {
						app.progress.hide();
						view.trigger('cancel_booking', booking);
					});
					result.fail(function() {
						app.progress.hide();
						navigator.notification.alert("error");
					})
				};
			}, booking.shareable.get('label'), ["Ja", "Nein"]);
		},
		closeInfobox : function(e) {
			this.$("#infobox").css('display', 'none');
		},
		// format time
		formatTime : function(event) {
			var from_date = event.get('from_date');
			// format minutes as two digits 3 => 03, 0 => 00, 03 = 03
			var min_txt = "0{0}".format([from_date.getMinutes()]);
			min_txt = min_txt.substring(min_txt.length - 2)
			return "{0}:{1}".format(from_date.getHours(), min_txt);
		},
	});
	return BookingListView;
});
