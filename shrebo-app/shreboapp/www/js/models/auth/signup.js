define(['backbone', 'settings'], function($B, settings) {
	var Signup = $B.Model.extend({
		urlRoot : settings.authApiUri + '/signup/',
		defaults : {
			username : null,
			email : null,
			password : null,
			apikey: null,
		},
	});
	return Signup;
});
