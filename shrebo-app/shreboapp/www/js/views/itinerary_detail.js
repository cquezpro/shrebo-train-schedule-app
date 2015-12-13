define(['backbone', 'util', 'templates', 'moment', 'iscroll', 'momentduration'], function($B, util, templates, moment, IScroll) {
    /**
     * ItineraryDetail
     */
    var ItineraryDetailView = $B.View.extend({
        events : {
            // "click .list-row": "selectShareable",
            "click .row" : "selectShareable",
            "click .action-seats" : "selectSeats",
            "click .action-select-itinerary" : "selectItinerary",
        },
        /**
         * @memberOf ItineraryDetailView
         */
        initialize : function(options) {
            this.stops = options.stops;
            this.itinerary = options.itinerary;
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.itinerary_detail_html, {
                view : this,
                stops : this.stops,
                itinerary : this.itinerary,
            }));
            // initialize scroller
            this.scroller = new IScroll('#itinerary-detail-scroller', {
                scrollbars : false,
                click : true,
                mouseWheel : true,
                keyBindings : true,
            });
            var view = this;
            setTimeout(function() {
                view.scroller.refresh();
                // view.scroller.scrollTo(0, -500, 500, false);
            }, 500);
            this.scroller.on('scrollStart', function() {
                console.debug('scrollStart');
                // view.scroller.refresh();
                // view.scroller.scrollTo(0, -500, 500, false);
            });
        },
        modelChanged : function() {

        },
        close : function() {
            this.remove();
            this.unbind();
            if (this.collection) {
                this.collection.unbind("change", this.modelChanged);
            }
        },
        // functionality
        /**
         * display functions
         */
        getDurationDisplay : function() {
            var c = this.itinerary;
            var origin = c.get('origin');
            var dest = c.get('destination');
            var diff = moment(dest.arrival).diff(origin.departure, 'minutes');
            return moment.duration(diff, 'minutes').format('h:mm', 0, {
                trim : false
            });
        },
        getStartPlatform : function() {
            // FIXME also get station platform
            return this.itinerary.get('origin').info.platform;
        },
        getStopPlatform : function(s) {
            // FIXME get platform not section
            return this.itinerary.get('origin').info.platform;
        },
        getBookingSection: function(s) {
            // FIXME get platform not section
            return this.itinerary.get('booking_section').label;
        },
        getJourneyDisplay : function() {
            var origin = this.itinerary.get('origin');
            var dest = this.itinerary.get('destination');
            return '{0} - {1}'.format([origin.info.timetable_city,
                dest.info.timetable_city])
        },
        getDateTimeDisplay : function() {
            var origin = this.itinerary.get('origin');
            var dest = this.itinerary.get('destination');
            return '{0} - {1}'.format([
                moment(origin.departure).format('HH.mm'),
                moment(dest.arrival).format('HH.mm')]);
        },
        getStopTime : function(s) {
            var time = s.get('departure_time');
            if (!time) {
                time = s.get('arrival_time');
            }
            return (moment(time).format("HH:mm"));
        },
        getStopSign : function(s) {
            return s.get('timetable_display');
        },
        selectSeats : function(e) {
            console.debug('trigger select_seats');
            this.trigger('select_seats', this.itinerary);
        },
        selectItinerary : function(e) {
            console.debug('confirm selection');
            this.trigger('itinerary_selected', this.itinerary);
        },
    });
    return ItineraryDetailView;
});
