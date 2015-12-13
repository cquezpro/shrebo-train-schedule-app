define(['backbone', 'settings', 'datejs', 'moment',
    'models/itry/itinerary_reservation', 'models/itry/itinerary_availability'], function($B, settings, xDate, moment, Reservation, Availability) {
    /**
     * Itinerary provides a model to deal with the /itinerary API. It offers to
     * query itineraries by setting the origin and destination filters, and
     * optionally add departure and arrival filters.
     * 
     * <pre>
     * Example:
     *    var itry = new Itinerary.objects();
     *    itry.qryFilter('origin', 'Zuerich');
     *    itry.qryFilter('destination', 'Hamburg');
     *    itry.qryFilter('departure', '2014-10-31T08:00');
     *    var results = itry.fetch();
     *    ...
     * </pre>
     */
    var Itinerary = $B.Model
        .extend({
            urlRoot : settings.itineraryApiUri + '/itinerary/',
            url : function() {
                var ref = this.get('ref');
                var uri = '';
                if (ref) {
                    uri = '{0}{1}/'.format([this.urlRoot,
                        encodeURIComponent(ref)]);
                } else {
                    uri = '{0}?{1}'.format([this.urlRoot, this.query()]);
                }
                return uri;
            },
            asFilter : 'itinerary',
            // return attributes in JavaScript format
            /**
             * @memberOf Itinerary
             */
            parse : function(data, options) {
                // parse server response to convert
                // dates given as ISO strings (yyyy-mm-ddThh:mm)
                // into javascript objects
                data.origin.departure = new Date(xDate
                    .parse(data.origin.departure));
                data.destination.arrival = new Date(xDate
                    .parse(data.destination.arrival));
                return data;
            },
            /**
             * return the time format for display given a connection. This
             * renders the departure and arrival attributes of a connection into
             * HH:MM-HH.MM format
             */
            getTimeDisplay : function() {
                var dept_dt = this.get('origin').departure;
                var arr_dt = this.get('arrival').arrival;
                dept_txt = dept_dt.toTimeString().substring(0, 5);
                arr_txt = arr_dt.toTimeString().substring(0, 5);
                return '{0}-{1}'.format([dept_txt, arr_txt]);
            },
            /**
             * return the origin-destination cities as a string
             * 
             * @returns "origin-destination"
             */
            getJourneyDisplay : function() {
                var origin = this.get('origin');
                var destination = this.get('destination');
                var origin_city = origin.info.timetable_city;
                var destination_city = destination.timetable_city;
                return "{0}-{1}".format([origin_city, destination_city]);
            },
            /**
             * backwards compatibility FIXME remove once client code refactored
             */
            availability : function(context) {
                console
                    .debug('FIXME Itinerary.availability is deprecated in {0}'
                        .format([arguments.callee.caller.toString()]));
                return this.getAvailability(context);
            },
            /**
             * return the availability
             */
            getAvailability : function(context) {
                context = context || {};
                var result = $.Deferred();
                var avail = new Availability({
                    itinerary : this.get('ref'),
                    optimized : context.optimized || 0,
                    counts : context.counts || 0,
                    paxclass : this.get('paxclass'),
                    paxcount: this.get('paxcount'),
                });
                var itry = this;
                avail.fetch().done(function() {
                    avail.related.itinerary = itry;
                    itry.related.availability = avail;
                    result.resolve(avail);
                });
                return result;
            },
            /**
             * book an itinerary. The $.Deferred that is returned provides the
             * following objects:
             * 
             * var deferred = itinerary.book(...);
             * deferred.done(function(reservation) ...);
             * deferred.fail(function(itinerary) ...);
             * 
             * As additional parameters both done and fail get the parameters as
             * the jqXHR done() and fail() callbacks would.
             * 
             * @see http://api.jquery.com/jquery.ajax/
             * 
             * The reservation is an instance of Itinerary, the itinerary is the
             * model that .book() was used with.
             * 
             * @param pax_count
             *            the number of passengers
             * @param section
             *            the section code (or section URI)
             * @return $.Deferred
             */
            book : function(options) {
                var pax_count = options.pax_count || 1;
                var section = options.section || '';
                var booking_col = options.booking_col || '';
                var data = {
                    'itinerary_ref' : this.get('ref'),
                    'pax_count' : pax_count,
                    'section' : section,
                    'booking_col' : booking_col,
                };
                /*
                 * // only pass a collation if there is one if(booking_col) {
                 * data['booking_col'] = booking_col; }
                 */
                var reservation = new Reservation(data);
                // get the xhr from save, and create a deferred
                // to return
                var save_result = reservation.save();
                var book_result = new $.Deferred();
                var model = this;
                save_result.done(function(data, status, xhr) {
                    book_result.resolve(reservation);
                });
                save_result.fail(function(xhr, status, error) {
                    book_result.reject([model, xhr, status, error]);
                });
                return book_result;
            }
        });
    var objects = $B.Collection
        .extend({
            model : Itinerary,
            url : settings.itineraryApiUri + '/itinerary/',
            /**
             * @memberOf objects
             * 
             * find itineraries
             * 
             * Use as follows:
             * 
             * <pre>
             * var options = {
             *      origin : 'origin string' or 'lat,lon',
             *      destination : 'destination string or 'lat,lon',
             *      departure : date,
             *      pax_count : 1,
             *      byname : 1 (default) or 0 (use lat, long)
             * }
             * var results = new Itinerary.objects().findSchedule(options);
             * results.done(function(itineraries) {
             *     // itineraries is a Collection of Itinerary objects
             * });
             * results.fail(function(error) {
             *     // error handling
             * });
             * </pre>
             * 
             * TO journeys pass .origin, .destination, .departure, .pax_count
             * 
             * TO/RETURN journeys pass .arrival in addition
             * 
             * @param options
             *            options with above attributes
             * @return a $.Deferred that will be resolved with the collection of
             *         itineraries. Each itinerary has an attribute .journey ==
             *         'to' | 'return'
             */
            findSchedule : function(options) {
                var final_results = $.Deferred();
                var origin = options.origin;
                var dest = options.destination;
                var departure = options.departure || '';
                var arrival = options.arrival || '';
                //FIXME server must pass this information back to us
                //as a property of the itinerary
                this.paxcount = options.paxcount || 1;
                this.paxclass = options.paxclass || '';
                var byname = options.byname == undefined ? 1 : options.byname;
                var collection = this;
                // -- TO
                var itriesTo = this
                    .buildItineraryQuery(origin, dest, departure, null, byname, false, 
                        this.paxclass, this.paxcount);
                var resultsTo = itriesTo.fetch();
                // -- RETURN
                var resultsReturn = null;
                var itriesReturn = null;
                if (arrival) {
                    arrival = new Date(moment(arrival).subtract(1, 'days'));
                    itriesReturn = this
                        .buildItineraryQuery(dest, origin, arrival, null, byname, true);
                    resultsReturn = itriesReturn.fetch();
                } else {
                    // make sure itriesReturn is an empty collection in case
                    // of no return -- makes downstream processing easier, see
                    // below
                    itriesReturn = new Itinerary.objects();
                }
                // process results
                var results = resultsReturn
                    ? $.when(resultsTo, resultsReturn)
                    : resultsTo;
                var self = this;
                results.done(function() {
                    // collect to/return itries into one, trigger results
                    itriesTo.each(function(itenary) {
                        itenary.set('journey', 'to');
                        //TODO refactor once server returns these attributes
                        itenary.set('paxclass', self.paxclass);
                        itenary.set('paxcount', self.paxcount);
                    });
                    itriesReturn.each(function(itenary) {
                        itenary.set('journey', 'return');
                        //TODO refactor once server returns these attributes
                        itenary.set('paxclass', self.paxclass);
                        itenary.set('paxcount', self.paxcount);
                    });
                    collection.reset(itriesTo.models);
                    collection.add(itriesReturn.models, {
                        merge : true
                    });
                    // call back
                    final_results.resolve(collection);
                });
                results.fail(function(error) {
                    final_results.reject(error);
                });
                return final_results;
            },
            /**
             * build the itinerary query going from origin to destination within
             * a particular time frame.
             * 
             * @return a ItineraryCollection
             */
            buildItineraryQuery : function(origin, dest, departure, arrival, byname, isReturn, paxclass, paxcount) {
                // create an empty itinerary collection
                var itries = this.clone();
                itries.reset();
                // setup query parameters
                itries.clearQryFilter();
                itries.qryFilter('origin', origin);
                itries.qryFilter('destination', dest);
                itries.qryFilter('departure', departure || '');
                itries.qryFilter('arrival', arrival || '');
                itries.qryFilter('byname', byname == undefined ? 1 : byname);
                itries.qryFilter('paxclass', paxclass);
                itries.qryFilter('paxcount', paxcount || 1);
                return itries;
            },
        });
    Itinerary.objects = objects;
    return Itinerary;
});
