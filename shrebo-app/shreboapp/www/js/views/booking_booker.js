define(['backbone', 'util', 'models', 'templates'], function($B, util, models, templates) {
	var BookingBookerView = $B.View.extend({
		events : {
			'click #cancel_btn' : 'cancelBooking' 
		},
		// basic view interface
		initialize : function() {
			if (this.model) {
				this.model.bind("change", this.modelChanged, this);
			}
		},
		render : function() {
			this.$el.empty();
			this.$el.append(util.render(templates.booking_booker_html, {
				model : this.model
			}));
		},
		modelChanged : function() {
	       console.trace('BookingBookerView.modelChanged - model has changed');
		},
		close : function() {
			this.remove();
			this.unbind();
			this.model.unbind("change", this.modelChanged);
		},
		// view functions
		cancelBooking : function() {
			console.trace('BookingBookingView.cancelBooking triggered');
			// cancel the booking
			var booking = this.model;
			booking.cancel();
			// save and report result
			var result = booking.save();
			result.done(function() {
				console.trace('BookingBookerView.cancelBooking.save success');
			});
			result.fail(function() {
				console.trace('BookingBookerView.cancelBooking.save fail');
			});
		}
	});
	return BookingBookerView;
});
