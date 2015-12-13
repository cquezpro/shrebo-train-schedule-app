define(['backbone', 'settings', 'tastypie', 'datejs'], function($B, settings, tastypie, xDate) {
    /**
     * ItineraryService represents one service going from location A to B. It is
     * a query-only resource.
     * 
     * Provide a &permission=is_driver filter to list all services for a
     * particular driver. Once you have a service you can use it to retrieve the
     * passenger list (see ItineraryPassenger).
     */
    var ItineraryService = $B.Model.extend({
        urlRoot : settings.itineraryApiUri + '/service/',
        asFilter : 'service',
        /**
         * @memberOf ItineraryService
         */
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
        /**
         * convenience function to query stops for this service
         */
        getStops : function() {
            var service = this;
            var result = new $.Deferred();
            require(['models/itry/itinerary_stop'], function(ItineraryStop) {
               var stops = new ItineraryStop.objects();
               stops.qryFilter('service_key', service.get('service_key'));
               var stopsResult = stops.fetch();
               stopsResult.done(function() {
                   service.related.stops = stops;
                   result.resolve(stops);
               });
               stopsResult.fail(function() {
                   service.related.stops = null;
                   result.reject(stops);
               });
            });
            return result;
        },
        /**
         * convenience function to query the passengers for a particular
         * service. Will yield a collection of ItineraryPassenger objects.
         * 
         * @return a $.Deferred that will resolve to an ItineraryPassenger
         *         collection
         */
        passengers : function() {
            var service = this;
            var result = new $.Deferred();
            require(['models/itry/itinerary_passenger'], function(ItineraryPassenger) {
                var pax = new ItineraryPassenger.objects();
                pax.qryFilter(service);
                var paxResult = pax.fetch();
                paxResult.done(function() {
                    result.resolve(pax);
                });
                paxResult.fail(function() {
                    result.reject(pax);
                });
            });
            return result;
        }
    });
    var objects = $B.Collection.extend({
        model : ItineraryService,
        url : settings.itineraryApiUri + '/service/',
        // business function
        /**
         * query all services for the given user
         * 
         * @param user
         *            the User Object
         * @return a $.Deferred
         */
        userServices : function(user, with_itinerary) {
            var result = new $.Deferred();
            var that = this;
            // filter collection for user and permissoin
            this.clearQryFilter();
            this.qryFilter("future_only", 1);
            if(with_itinerary) {
                this.qryFilter("itinerary", 1);
            }
            // this.qryFilter("permission", "is_driver")
            qryResult = this.fetch();
            qryResult.done(function() {
                if (that.size() > 0) {
                    result.resolve(that);
                } else {
                    result.reject(null);
                }
            });
            qryResult.fail(function() {
                result.reject(null);
            });
            return result;
        },
        /**
         * query the "closest" service for the given user. The deferred will
         * resolve to the first ItineraryService applicable or null if a service
         * was not found.
         * 
         * @param user
         *            the User object
         * @return a $.Deferred object
         */
        currentService : function(user, limit) {
            var result = new $.Deferred();
            var that = this;
            // filter collection for user and permissoin
            this.clearQryFilter();
            this.qryFilter("itinerary", 1);
            this.qryFilter("permission", "is_driver")
            this.qryFilter("future_only", 1);
            if(limit) {
                this.qryFilter("limit", limit);
            }
            qryResult = this.fetch();
            qryResult.done(function() {
                if (that.size() > 0) {
                    result.resolve(that.at(0));
                } else {
                    result.reject(null);
                }
            });
            qryResult.fail(function() {
                result.reject(null);
            });
            return result;
        }
    });
    ItineraryService.objects = objects;
    return ItineraryService;
});
