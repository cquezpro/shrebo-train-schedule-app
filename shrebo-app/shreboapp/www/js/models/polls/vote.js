define(['backbone', 'settings'], function($B, settings) {
    var Vote = $B.Model.extend({
        urlRoot : settings.pollsApiUri + '/vote/',
        url : function() {
            return this.urlRoot;
        },
        updateData : function(updates) {
            var data = this.get('data') || {};
            this.set('data', _.extend(data, updates));
        }
    });
    var objects = $B.Collection.extend({
        model : Vote,
        url : settings.apiUri + '/vote/',
    });
    Vote.objects = objects;
    return Vote;
});
