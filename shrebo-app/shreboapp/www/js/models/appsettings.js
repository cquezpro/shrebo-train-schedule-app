define(['backbone', 'settings'], function($B, settings) {
    var AppPing = $B.Model.extend({
        urlRoot : settings.apiUri + '/client/ping/',
    });
    var AppSettings = $B.Model.extend({
        urlRoot : settings.apiUri + '/client/settings/',
        url : function() {
            return '{0}{1}/'.format([this.urlRoot], this.buildid);
        },
        ping : function() {
            return new AppPing().fetch();
        },
    });
    return AppSettings;
});
