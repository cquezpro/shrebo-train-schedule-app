define(['backbone', 'settings'], function($B, settings) {
    /**
     * GeoCode. This provides the itinerary booking geocode search API viable
     * for use with the jquery.autocomplete component.
     */
    var GeoCode = $B.Model.extend({
        urlRoot : settings.itineraryApiUri + '/geocode/',
    });
    var objects = $B.Collection.extend({
        model : GeoCode,
        url : settings.itineraryApiUri + '/geocode/',
        _cache : {},
        /**
         * helper function to retrieve suggestions and return to
         * jquery.autocomplete in suggestions
         * 
         * ('#autocomplete').autocomplete({ lookup : GeoCode.objects.lookup,
         * onSelect : function(geocode) { alert('You selected ' +
         * geocode.get('normalized'); }, });
         * 
         * This method has cache support built-in. It will cache a list of all
         * suggestions by their first
         */
        lookup : function(q, autocomplete) {
            var normalized = q.toLowerCase();
            var c = normalized.substring(0, 3);
            var cached = this._cache[c];
            var that = this;
            if (cached) {
                autocomplete(this._filterSuggestions(cached, normalized));
            } else {
                this._getSuggestions(q, function(suggestions) {
                    that._cache[c] = suggestions;
                    autocomplete(that
                        ._filterSuggestions(suggestions, normalized));
                });
            }
        },
        /**
         * query server for a list of matches on the first character of the
         * search string q. This returns a list of suggestions according to
         * autocomplete.jquery as an array of objects: [{ value: ..., data:
         * ...}, ...] Note that this array is only filtered for the first
         * character and needs to be processed by _suggestionSubset to transform
         * it into the actual suggestion object required by autocomplete.
         */
        _getSuggestions : function(q, callback) {
            this.clearQryFilter();
            this.qryFilter('q', q);
            this.qryFilter('limit', 100);
            var result = this.fetch();
            var that = this;
            result.done(function(data) {
                var suggestions = that.map(function(place) {
                    return {
                        value : '{0}, {1}'.format([
                            place.get('timetable_display'),
                            place.get('station_sign')]),
                        data : place
                    };
                });
                callback(suggestions);
            });
        },
        /**
         * get the in list that matches subset that matches the q string
         * (ignoring case). returns the result prepared for autocomplete.jquery
         * as a suggestion object { suggestions : [{ value: ..., data: ...},
         * ...] }
         */
        _filterSuggestions : function(suggestions, q) {
            // filter, ignoring case
            var filtered = _.filter(suggestions, function(item) {
                // normalized according to the same rules as on server
                var qn = q.toLowerCase().normalise();
                return item['data'].get('normalized').search(new RegExp(qn, "i")) > -1;
            });
            // sort and make unique, return the result
            return {
                suggestions : _.uniq(filtered)
            };
        },
        /**
         * clear the cache
         */
        clearCache : function() {
            console.debug('cleared suggestions cache');
            this._cache = {};
        },
    });
    GeoCode.objects = objects;
    return GeoCode;
});
