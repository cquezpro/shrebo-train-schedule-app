define(['backbone', 'util', 'templates', 'moment', 'iscroll', ], //
function($B, util, templates, moment, IScroll) {
    /**
     * this view requires that the collection's elements (Itinerary models) are
     * marked with attribute "journey". The view creates two temporary
     * collections, one for each of journey == "to", "return". This is to enable
     * selection of two journeys which are then returned in a new collection
     * using the itinerary_selected event. Note that this is extensible, i.e. we
     * could allow the selection of more than one journey in each of to/from
     * directions. Currently, only one selection is possible.
     * 
     * @param collection
     *            the collection of from/to journeys (itinerary)
     * @trigger itenary_selected upon click .action-book the selected itinerary
     *          is returned as a collection of two journeys, one for each
     *          to/return
     */
    var SearchResultsView = $B.View
        .extend({
            events : {
                // "click .list-row": "selectShareable",
                "click .action-book" : "book",
                "click .action-detail" : "selectDetail",
                "click .action-select-itinerary" : "selectItinerary",
                "click .action-select-origin" : "selectOrigin",
                "click .action-select-destination" : "selectDestination",
                "click .action-cancel" : "cancelSelection",
                "mouseover .line_row" : "hoverResult",
            },
            /**
             * @memberOf SearchResultsView
             */
            initialize : function(options) {
                // create two collections for 'to' and 'return' models
                // makes it easier to iterate for display
                this.collection_to = new $B.Collection(options.collection
                    .where({
                        'journey' : 'to'
                    }));
                this.collection_return = new $B.Collection(options.collection
                    .where({
                        'journey' : 'return'
                    }));
                // the selections go here
                this._selectedOrigin = null;
                this._selectedDestination = null;
            },
            render : function() {
                this.$el.empty();
                this.$el.append(util.render(templates.search_results_html, {
                    colto : this.collection_to,
                    colreturn : this.collection_return,
                    view : this
                }));
                // initialize scroller
                this.scroller = new IScroll('#search-results-scroller', {
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
                // initialise date time
                var today = new Date();
                $("#date_txt").val("{dd}.{mm}.{yy}".format({
                    dd : today.getDate(),
                    mm : today.getMonth() + 1,
                    yy : today.getFullYear()
                }));
                $("#time_txt").val(today.toTimeString().substring(0, 5));
                // initialise display of origin destinations
                $("h1.origin-destination").hide();
                this.getAvailabilities();
            },
            /**
             * partial renderer
             * 
             * called by getAvailabilities per each itinerary
             */
            renderAvailability : function(itry, avail) {
                var view = this;
                // sector label
                var recEl = view.$('.recommendation[data-ref="{0}"]'
                    .format([avail.get('itinerary') || '']));
                // occupation as icons
                var occEl = view.$('.occupation[data-ref="{0}"]'.format([avail
                    .get('itinerary')
                    || '']));
                var itrysection = avail.get('sections')[0];
                var pax_class = '';
                if (itrysection) {
                    var recommended = itrysection.recommended;
                    paxclass = '{0}.'
                        .format([itrysection.details[recommended].paxclass])
                    // store the recommendation in the itinerary
                    // section code
                    itry
                        .set('booking_section', itrysection.details[recommended]);
                    // render recommended section
                    recEl.find('.recommend_txt').html('Sektor <b>{0}</b>'
                        .format([itrysection.details[recommended].label]));
                    if (recommended == '*') {
                        el.find('.info_txt').html('andere Verbindung');
                    }
                    // render occupation level as icons
                    // note we transform from availability to occupation
                    // availability = % of seats available (e.g. 40%)
                    // occupation = number of people in % of #seats (e.g. 60%)
                    var occ = Math
                        .abs(parseFloat(itrysection.availability[recommended]) - 1.0);
                    occEl.html('{0}<span>{1}</span>'.format([
                        view.getOccupationIcons(occ), paxclass]));
                } else {
                    // no recommendation, store as any section
                    itry.set('booking_section', '*');
                    // show the train occupation instead
                    var occ = Math
                        .abs(parseFloat(itrysection.availability['_all_']) - 1.0);
                    occEl.html('{0}<span>{1}</span>'.format([
                        view.getOccupationIcons(occ), paxclass]));
                }
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
             * transform from an occupation level to icons
             * 
             * @param level
             *            occupation level in percent
             */
            getOccupationIcons : function(level) {
                var indicator = '';
                var color = '';
                switch (true) {
                    case level < 0.5 :
                        indicator = '*';
                        color = 'green';
                        break;
                    case level < 0.8 :
                        indicator = '**';
                        color = 'orange';
                        break;
                    default :
                        indicator = '***';
                        color = 'rgb(193, 28, 28)';
                }
                var oneperson = '<i class="fa fa-male" style="color:{0};"></i>'
                    .format([color]);
                indicator = indicator.replace(/\*/g, oneperson);
                return indicator;
            },
            getOperator : function(c) {
                return c.get('operator') || 'bbookers';
            },
            getDurationDisplay : function(c) {
                var origin = c.get('origin');
                var dest = c.get('destination');
                var diff = moment(dest.arrival)
                    .diff(origin.departure, 'minutes');
                var hours = Math.floor(diff / 60);
                var minutes = diff - hours * 60;
                return '{0}:{1}'.format([hours, minutes]);
            },
            getTimeDisplay : function(connection) {
                return connection.getTimeDisplay();
            },
            getDeptHour : function(c) {
                var time = c.get('origin').departure;
                return (moment(time).format("HH:mm"));
            },
            getArrivalHour : function(c) {
                var time = c.get('destination').arrival;
                return (moment(time).format("HH:mm"));
            },
            getDeptDate : function(c) {
                var date = c.get('origin').departure;
                return (moment(date).format('DD.MM'));
            },
            getArrivalDate : function(c) {
                var date = c.get('destination').departure;
                return (moment(date).format('DD.MM'));
            },
            getDeptCity : function(c) {
                return (c.get('origin').info.timetable_city);
            },
            getArrivalCity : function(c) {
                return (c.get('destination').info.timetable_city);
            },
            getPaxInfo : function(c) {
                // return(c.get('paxinfo').display_name);
                return '1 Adults';
            },
            getDeptLocation : function(c) {
                return (c.get('origin').info.station_sign);
            },
            getArrivalLocation : function(c) {
                return (c.get('destination').info.station_sign);
            },
            getPlatform : function(c) {
                return (c.get('origin').info.platform);
            },
            getTravelTime : function(c) {
                return (c.get('duration'));
            },
            getSectionCount : function(c) {
                return (c.get('sections').length);
            },
            isRecommended : function(c) {
                return false;
            },
            /**
             * return True if item i in col is not the same date as the previous
             * item. This assumes that items are sorted by date
             * 
             * using this in the template decide whether two or more items go
             * into the same date group.
             */
            nextDateGroup : function(col, i) {
                if (i <= 0) {
                    return true;
                }
                var prev = col.at(i - 1).get('origin').departure.getDay();
                var cur = col.at(i).get('origin').departure.getDay();
                return prev != cur;
            },
            getDepartureDate : function(c) {
                return moment(c.get('origin').departure).format('DD.MM.YYYY');
            },
            /**
             * select a itinerary (itinerary)
             */
            selectItinerary : function(e) {
                // get the selection
                var target = $(e.currentTarget);
                var cid = target.attr('data-id');
                console.debug('SearchView click itenary id=' + cid);
                this._itinerary = this.collection.get(cid);
                var itries = new $B.Collection([this._itinerary]);
                this.trigger('itinerary_selected', itries);
            },
            /**
             * select Origin and adjust display
             * 
             * @param e
             */
            selectOrigin : function(e) {
                // get the selection
                var target = $(e.currentTarget);
                var cid = target.attr('data-id');
                console.debug('SearchView click origin itenary id=' + cid);
                // remove all selections
                this.$("area_txt.origin > .selected").removeClass('selected');
                this._selectedOrigin = null;
                // add new selection, hide all others (or show all if
                // no selection active)
                target.toggleClass('selected');
                if (target.hasClass('selected')) {
                    this.$(".origin > .line_row").not(".selected").hide();
                    this._selectedOrigin = this.collection.get(cid);
                } else {
                    this.$(".origin > .line_row").show();
                }
                // finally adjust the total display
                this.totalDisplay();
            },
            /**
             * fetch itineraries' availabilities and render the respective
             * section recommendation
             */
            getAvailabilities : function() {
                var view = this;
                var first = true;
                var queries = [];
                var best_perday = {};
                this.collection_to.each(function(itry) {
                    queries.push(itry.availability({
                        optimized : 1
                    }).done(function(avail) {
                        // render people icons
                        view.renderAvailability(itry, avail);
                        // calculate best option per day
                        // FIXME move to server so that we can
                        // e.g. query for N itineraries and get back
                        // the best option marked already
                        var day = itry.get('origin').departure.getDay();
                        var section = avail.get('sections')[0];
                        var recommend = section.recommended;
                        var occ = parseFloat(section.availability[recommend]);
                        if (best_perday[day]
                            && best_perday[day].availability > occ) {
                            // we have the best already
                        } else {
                            best_perday[day] = {
                                availability : occ,
                                cid : itry.cid,
                            }
                        }
                    }));
                });
                var view = this;
                // highlight best row per day
                $.when.apply($, queries).done(function() {
                    _
                        .each(best_perday, function(day) {
                            view.$('.connection-row[data-id={0}]'
                                .format([day.cid])).addClass('active');
                                //.find('.info_txt').html('Empfehlung');
                        });
                })
            },

            /**
             * get itineraries' reference
             */
            getReference : function(c) {
                return c.get('ref');
            },
            /**
             * select detail
             */
            selectDetail : function(e) {
                var target = this.$(e.target).closest('.connection-row');
                var cid = target.attr('data-id');
                console.debug('select detail itinerary id=' + cid);
                var itinerary = this.collection.get(cid);
                this.trigger('itinerary_detail', itinerary);
            },
            /**
             * select destination and adjust display
             * 
             * @param e
             */
            selectDestination : function(e) {
                // get the selection
                var target = $(e.currentTarget);
                var cid = target.attr('data-id');
                console.debug('SearchView click destination itenary id=' + cid);
                // remove all selections
                this.$("area_txt.destination > .selected")
                    .removeClass('selected');
                this._selectedDestination = null;
                // add new selection, hide all others
                target.toggleClass('selected');
                if (target.hasClass('selected')) {
                    this.$(".destination > .line_row").not(".selected").hide();
                    this._selectedDestination = this.collection.get(cid);
                } else {
                    this.$(".destination > .line_row").show();
                }
                // finally adjust the total display
                this.totalDisplay();
            },
            /**
             * remove any selection and total display
             * 
             * @param e
             */
            cancelSelection : function(e) {
                this._selectedDestination = null;
                this._selectedOrigin = null;
                this.$(".destination > .line_row").show()
                    .removeClass('selected');
                this.$(".origin > .line_row").show().removeClass('selected');
                this.totalDisplay();
                this.scroller.scrollTo(0, 0);
            },
            /**
             * if both origin and destinations were selected, show the totals
             */
            totalDisplay : function() {
                if (this.selectionValid()) {
                    // a valid selection was made, show total box
                    this.$(".booking_box").show();
                    this.$("h1.in").hide();
                    this.$("h1.out").hide();
                    this.$("h1.origin-destination").show();
                } else {
                    this.$(".booking_box").hide();
                    this.$("h1.origin-destination").hide();
                    this.$("h1.in").show();
                    this.$("h1.out").show();
                }
                var view = this;
                setTimeout(function() {
                    view.scroller.refresh();
                    // view.scroller.scrollTo(0, -500, 500, false);
                }, 750);
            },
            /**
             * return true if any of these conditions holds 1. to and return
             * journeys are available: select one each 2. only to journey is
             * available: select one
             */
            selectionValid : function() {
                // case 1: to and return journey are available.
                if (this.collection_to.size() > 0
                    && this.collection_return.size() > 0) {
                    return this._selectedDestination && this._selectedOrigin;
                } else {
                    // case 2: only to journey available
                    return this._selectedOrigin;
                }
            },
            /**
             * perform booking
             */
            book : function() {
                console.debug('book button pressed');
                var selection = new $B.Collection([this._selectedDestination,
                    this._selectedOrigin]);
                this.trigger('itinerary_selected', selection);
            },
            /**
             * this applies a hover effect on mouse devices
             * 
             * Why not just use good'ol :hover style in css? a) you can't have a
             * reliable media query for non-touch devices
             * http://stackoverflow.com/questions/11387805/media-query-to-detect-if-device-is-touchscreen
             * b) you can't easily undo a :hover style in javascript
             * http://stackoverflow.com/questions/2754546/can-i-disable-a-css-hover-effect-via-javascript =>
             * the sane method seems to be to avoid :hover styles in the first
             * place, but simulate it for mouse devices using a mouseover
             * device. TODO refactor hover simulation into util for re-use
             * elsewhere
             */
            hoverResult : function(e) {
                $('.line_row').removeClass('selected');
                $(e.target).addClass('selected');
            }
        });
    return SearchResultsView;
});
