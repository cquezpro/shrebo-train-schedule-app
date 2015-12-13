define(['backbone', 'settings'], function($B, settings) {
    var Result = $B.Model.extend({
        urlRoot : settings.pollsApiUri + '/result/',
    }); 
    var objects = $B.Collection.extend({
        model : Result,
        url : settings.apiUri + '/result/',
    });
        // use as 
    // var results = new Shareable.objects().fetch();
    // results.done(function() {...});
    Result.objects = objects;
    return Result;
});
