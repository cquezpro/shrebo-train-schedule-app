define(['backbone', 'settings', 'tastypie', 'datejs'], function($B, settings, tastypie, xDate) {
    /**
     * ItineraryStop represents a of stop in a service
     * 
     */
    var ItineraryStop = $B.Model.extend({
        urlRoot : settings.itineraryApiUri + '/stop/',
        asFilter : 'stop',
        /**
         * @memberOf ItineraryStop
         */
        parse : function(data, options) {
            // parse server response to convert
            // dates given as ISO strings (yyyy-mm-ddThh:mm+00:00)
            // into javascript objects
            data.departure = new Date(xDate
                .parse(data.departure_time));
            data.arrival = new Date(xDate
                .parse(data.arrival_time));
            return data;
        },
    });
    var objects = $B.Collection.extend({
        model : ItineraryStop,
        url : settings.itineraryApiUri + '/stop/',
        // business function
    });
    ItineraryStop.objects = objects;
    return ItineraryStop;
});
