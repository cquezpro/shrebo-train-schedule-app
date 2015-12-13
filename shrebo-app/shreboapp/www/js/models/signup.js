define(['backbone', 'settings'], function($B, settings) {
	var Signup = $B.Model.extend({
		urlRoot : settings.apiUri + '/signup/',
		defaults : {
			username : null,
			email : null,
			password : null,
			social : "shrebo"
		},
		toJSON : function() {
			return {
				username : this.get('username'),
				email : this.get('email'),
				// always encode the password before sending
				// this is not really secure but its better than cleartext
				password : btoa(this.get('password')),
				social : this.get('social')
			}
		}
	});
	return Signup;
});
