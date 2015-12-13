define(['backbone', 'settings', 'tastypie', 'datejs'], function($B, settings, tastypie, xDate) {
    /**
     * ItineraryStop represents a of stop in a service
     * 
     */
    var ItineraryAvailability = $B.Model.extend({
        urlRoot : settings.itineraryApiUri + '/availability/',
        url : function() {
            return '{0}{1}/'.format(this.urlRoot, encodeURIComponent(this
                .get('itinerary')));
        },
        query : function() {
            // FIXME use qryFilter
            return 'optimized={0}&counts={1}&paxclass={2}&paxcount={3}'
                .format([this.get('optimized'), this.get('counts'),
                    this.get('paxclass') || '', this.get('paxcount') || 1]);
        },
        asFilter : 'itinerary',
        /**
         * @memberOf ItineraryStop
         */
        parse : function(data, options) {
            // parse server response to convert
            // dates given as ISO strings (yyyy-mm-ddThh:mm+00:00)
            // into javascript objects
            data.departure = new Date(xDate.parse(data.departure_time));
            data.arrival = new Date(xDate.parse(data.arrival_time));
            return data;
        },
    });
    return ItineraryAvailability;
});
