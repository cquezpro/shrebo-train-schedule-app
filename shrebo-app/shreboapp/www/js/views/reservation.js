define(['backbone', 'util', 'models', 'templates'], function($B, util, models, templates) {
	var ReservationView = $B.View.extend({
		events : {
			"click #sel_from_date" : "selectFromDate",
			"click #sel_to_date" : "selectToDate",
			"click .select-sector" : "selectSector",
			"click .action-pagefwd" : "pageForward",
			"click .action-pageback" : "pageBackward"
		},
		bookingEnabled : false,
		// basic view interface
		initialize : function() {
			if (this.model) {
				this.model.bind("change", this.modelChanged, this);
				this.setConnection(this.model.shareable);
			}
			
		},
		render : function() {
			this.$el.empty();
			this.$el.append(util.render(templates.reservation_html, {
				el : this.connection,
				sectors : this.sectors,
				view : this,
			}));
			var myScroll = new IScroll('#wrapper', {
				mouseWheel : true,
				click : false
			});
		},
		modelChanged : function() {

		},
		close : function() {
			this.remove();
			this.unbind();
			this.model.unbind("change", this.modelChanged);
		},
		// this view's functionality
		/**
		 * set a connection and recalculate the 
		 * sector percentages 
		 */
		setConnection : function(connection) {
			this.connection = connection;
			// calculate remaining capacity in percent per sector
			// this is used for formatting
			this.sectors = this.calculateSectorPcts();
		},
		/**
		 * Calculate the sectors percentages. Note that we
		 * receive the predicted OCCUPANCY not the predicted
		 * AVAILABILITY. Hence we take (1-predicted) to 
		 * calculate the availability
		 */
		calculateSectorPcts : function() {
			var predictions = this.connection.get('sectors')['2nd'];
			var sectors = {};
			for (var sector in predictions) {
				//sectors[sector] = predictions[sector] * 100;
				sectors[sector] = Math.max(20, (1 - predictions[sector]) * 100 * Math.random());
			};
			return sectors;
		},
		/**
		 * get sector color
		 */
		getSectorColor : function(sector) {
			var pct = this.sectors[sector];
			if (pct <= 30) {
				return 'red_bar';
			}
			if (pct <= 50) {
				return 'yellow_bar';
			}
			return 'green_bar';
		},
		/**
		 * select a sector
		 */
		selectSector : function(e) {
			var target = $(e.target);
			this.$(".select-sector").parent().removeClass('selected');
			this.$(target).parent().addClass('selected');
			$('#pointsmodal').modal('show');
			this.trigger('sector_selected');
			/* FIXME look at iBeacon enablement or use some other timer
			setTimeout(function() {
				$('#feedbackmodal').modal('show');
			}, 10000);
			*/
		},
		/**
		 * page through collections
		 */
		pageForward : function() {
			var i = this.collection.indexOf(this.connection);
			i = (i + 1) % this.collection.length;
			this.setConnection(this.collection.at(i));
			this.render();
		},
		pageBackward : function() {
			var i = this.collection.indexOf(this.connection);
			i = i > 0 ? (i - 1) : this.collection.length - 1;
			this.setConnection(this.collection.at(i));
			this.render();
		},
		/**
		 * create a reservation
		 */
		book : function() {
			// only allow booking if enabled
			if (!this.bookingEnabled) {
				return;
			}
			// clone the model for save
			// for some reason the change
			// event that gets triggered
			// removes the mobiscroller and causes
			// a problem once the call returns
			// model.off() did not resolve the problem
			// hence we create a new model and save
			// it.
			var saveModel = new models.Reservation(this.model.attributes);
			var resp = saveModel.save();
			var view = this;
			if (resp) {
				resp.done(function() {
					view.trigger('booking_success', saveModel);
				});
				resp.fail(function(xhr, status, error) {
					view.trigger('booking_failure', reservation, status, xhr);
				});
			}
		}
	});
	return ReservationView;
});
