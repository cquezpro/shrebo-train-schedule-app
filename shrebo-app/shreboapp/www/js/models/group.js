define(['backbone', 'settings'], function($B, settings) {
	var Group = $B.Model.extend({
		urlRoot : settings.apiUri + '/sharegroup/',
		asFilter : 'sharegroup',
	});
	var objects = $B.Collection.extend({
		model : Group,
		url : settings.apiUri + '/sharegroup/',
		initialize : function() {
			this.qryFilter('owner', function() {
				return window.app.session.auth.user.get('id');
			});
		}
	});
	// use as
	// var results = new Group.objects().fetch();
	// results.done(function() {...});
	Group.objects = objects;
	return Group;
});
