define(['backbone', 'settings'], function($B, settings) {
	var Shareable = $B.Model.extend({
		urlRoot : settings.apiUri + '/shareable/',
		/**
		 * retrieve a resized URL picture from
		 * cloudinary
		 */
		resizedPictureUrl : function(h, w)  {
			var url = this.get('picture_url');
			if(url) {
			  url = url.replace('/upload/', '/upload/h_{h},w_{w}/'.format({ h: h, w: w}));
			}
			return url;
		}
	}); 
	var objects = $B.Collection.extend({
		model : Shareable,
		url : settings.apiUri + '/shareable/',
	});
	var ShareableFinder = $B.Collection.extend({
		model : Shareable,
		url : settings.apiUri + '/shareable/search/',
		// query returns the query string for the API
		// call in the form term=value&term2=value2
		byTerm : function(term) {
			this.term = term;
			return this;
		},
		query : function() {
			return "q={0}".format([this.term]);
		}
	});
	// use as 
	// var results = new Shareable.objects().fetch();
	// results.done(function() {...});
	Shareable.objects = objects;
	// use as
	// var results = new Shareable.objects().search.byTerm('someterm').fetch();
	// results.done(function() { ...});
	objects.prototype.search = new ShareableFinder(); 
	return Shareable;
});
