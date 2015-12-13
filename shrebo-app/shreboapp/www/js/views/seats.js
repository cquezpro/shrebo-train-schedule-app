define(['backbone', 'util', 'templates', 'nicebuttons'], function($B, util, templates, nicebuttons) {
    /**
     * Seat selection
     * 
     * Displays the seat selection as given in the .availability property. This
     * must an ItineraryAvailability instance.
     */
    var SeatsView = $B.View.extend({
        events : {
            "click .action-select" : "select",
            "click .action-cancel" : "cancel",
        },
        /**
         * @memberOf SeatsView
         */
        initialize : function(options) {
            this.availability = options.availability;
            this.itinerary = options.availability.related.itinerary;
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.seats_html, {
                view : this,
                avail : this.getSectionsDisplay(),
            }));
            // initialize scroller
            this.scroller = new IScroll('#seat-select-scroller', {
                scrollbars : false,
                click : true,
                mouseWheel : true,
                keyBindings : true,
            });
            var view = this;
            this.$('input:radio').screwDefaultButtons({
                image : 'url("img/radioSmall.png")',
                width : 37,
                height : 37,
            });
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
         * cancel
         */
        cancel : function(e) {
          this.trigger('cancelled'); 
        },
        select : function(e) {
            var t = $(e.target);
            var code = t.closest('.section').data('code');
            console.debug('section selected {0}'.format([code]));
            var itrysection = this.availability.get('sections')[0];
            this.trigger('section_selected', itrysection.details[code]);
        },
        /**
         * convert ItineraryAvailability into a format convenient for display,
         * i.e.
         * 
         * <pre>
         * from 
         * .sections[{
         *   0 : {
         *     availability : {
         *        1 : 0.35,
         *        2 : 0.62,
         *        ...
         *     },
         *     details : {
         *        1: {
         *            paxclass : &quot;2&quot;,
         *            sequence : 1
         *        }
         *        ...    
         *     }
         * }]
         * </pre>
         * 
         * into an array of section objects:
         * 
         * <pre>
         *    [{ 
         *       pct : .35,
         *       label : 1, (or some transformed value)
         *       code : &quot;1&quot;, (actual section code)
         *       sequence : 1,
         *      }
         *      ...
         *    ]
         * </pre>
         */
        getSectionsDisplay : function() {
            var itrysection = this.availability.get('sections')[0];
            //FIXME get a copy since we are deleting _all_ !
            var availability = itrysection.availability;
            delete availability['_all_'];
            var details = itrysection.details;
            var items = _.map(availability, function(v, k) {
                return {
                    pct : v <= 1.0 ? v * 100.0 : v,
                    label : details[k].label || k,
                    code : k,
                    sequence : details[k].sequence,
                };
            });
            return items;
        },
        /**
         * return the color range (css class) according to pct valid css classes
         * are:
         * 
         * low => .red med => .yellow high => .green
         * 
         * TODO get range/color mapping from server
         */
        getRangeColor : function(s) {
            if (s.pct < 33) {
                return "red";
            }
            if (s.pct < 66) {
                return "yellow";
            }
            return "green";
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
    });
    return SeatsView;
});
