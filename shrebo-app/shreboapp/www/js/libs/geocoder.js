define(['jquery', 'underscore'], function($, _) {
    var GeoCoder = function(options) {
        this.initialize(options);
    };
    _.extend(GeoCoder.prototype, {
        reverseUrl : 'http://open.mapquestapi.com/nominatim/v1/reverse.php?'
            + 'format=json&lat={lat}&lon={lon}',
        /**
         * @memberOf GeoCoder
         */
        initialize : function(options) {
        },
        reverse : function(lat, lon) {
            var query = {
                lat : lat,
                lon : lon
            };
            var results = $.ajax(this.reverseUrl.format(query));
            return results;
        },
    });
    return GeoCoder;
});