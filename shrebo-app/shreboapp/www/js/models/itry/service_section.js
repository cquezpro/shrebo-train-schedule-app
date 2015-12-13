define(['backbone', 'settings', 'tastypie'], function($B, settings, tastypie) {
    /**
     * ServiceSection represents a of stop in a service
     * 
     */
    var ServiceSection = $B.Model.extend({
        urlRoot : settings.itineraryApiUri + '/section/',
        asFilter : 'section',
    });
    var objects = $B.Collection.extend({
        model : ServiceSection,
        url : settings.itineraryApiUri + '/section/',
        // business function
    });
    ServiceSection.objects = objects;
    return ServiceSection;
});
