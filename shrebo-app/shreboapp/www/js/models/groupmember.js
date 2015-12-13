define(['backbone', 'settings'], function($B, settings) {
	var GroupMember = $B.Model.extend({
		urlRoot : settings.apiUri + '/groupmember/',
	});
	var objects = $B.Collection.extend({
		model : GroupMember,
		url : settings.apiUri + '/groupmember/',
		initialize : function() {
			this.filter('owner', function() {
				return window.app.session.auth.user.get('id');
			});
		}
	});
	// use as
	// var results = new GroupMember.objects().fetch();
	// results.done(function() {...});
	GroupMember.objects = objects;
	return GroupMember;
});
