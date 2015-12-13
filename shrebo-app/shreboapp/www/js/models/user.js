define(['backbone', 'settings'], function($B, settings) {
	var User = $B.Model.extend({
		urlRoot : settings.apiUri + '/user/',
		asFilter : 'user',
		isAnonymous : function() {
		    return this.get('username').toLowerCase().indexOf('anonymoususer') > -1;
		}
	});
	var objects = $B.Collection.extend({
		model : User,
		url : settings.apiUri + '/user/',
	});
	User.objects = objects;
	return User;
});
