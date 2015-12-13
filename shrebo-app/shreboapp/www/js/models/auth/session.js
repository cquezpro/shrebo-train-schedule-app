define(['backbone', 'settings', 'models/user'], function($B, settings, User) {
	/**
	 * Authentication object. This provides login and
	 * logout functionality in such a way that
	 *
	 * (1) a successful login will automatically fetch
	 *     the User instance associated with the user
	 *     and have it handy as auth.user
	 * (2) a failed login will rest the User instancde
	 *     and set auth.user to null
	 */
	var Session = $B.Model.extend({
		urlRoot : settings.authApiUri + '/session/',
		/**
		 * return the login or logout url, use: 
		 * 
		 * .save(), POST => login 
		 * .destroy() DELETE => logout 
		 */
		url : function() {
			return '{0}'.format([this.urlRoot]);
		},
		// always consider this a new object (we don't want to
		// call PUT, only POST)
		isNew : function() {
			return this.should_return_new;
		},
		// model properties for processing (not data
		// attributes)
		// -- success indicates success or failure
		// -- action the current action to be taken
		// -- user the User instance after login
		success : false,
		should_return_new : true,
		user : null,
		authenticated : false,
		defaults : {
			username : null,
			password : null,
			resource_uri : null,
			success : false,
		},
		/**
		 * login for username and password. check
		 * for success like this:
		 * var auth = new models.Session();
		 * auth.logout().always(function() {
		 * 	if(auth.get('success')) {
		 * 	  // success
		 *  } else {
		 * 	  // fail
		 *  }
		 * });
		 * @param {Object} username
		 * @param {Object} password
		 * @return jqXHR promise
		 */
		login : function(username, password) {
		    this.should_return_new = true;
			this.set('login', username); // required for server API
			this.set('username', username); // client compatibility
			this.set('password', password);
			var login_result = this.save();
			var model = this;
			// create a new deferred chain for the login and get user calls
			var result = $.Deferred();
			// process success of login this entails fetching the associated
			// User instance and then resolving our result promise to the client
			login_result.done(function(data) {
				// fetch the user associated with the
				// login
				model.success = true;
				var user = new User({
					resource_uri : data.user
				});
				model.user = null;
				var user_result = user.fetch();
				user_result.done(function() {
					model.user = user;
					model.authenticated = true;
					result.resolve(user);
				});
				user_result.fail(function() {
					// logout
				    model.logout();
					result.reject();
				});
			});
			// process failure of login
			login_result.fail(function() {
				model.user = null;
				model.success = false;
				result.reject();
			});
			// return the promise for the client
			// .done() will only run once the
			// User instance has been created.
			return result.promise();
		},
		/**
		 * logout for username and password. check
		 * for success like this:
		 * var auth = new models.Auth();
		 * auth.logout().always(function() {
		 * 	if(auth.get('success')) {
		 * 	  // success
		 *  } else {
		 * 	  // fail
		 *  }
		 * });
		 * @return jqXHR promise
		 */
		logout : function() {
			// force destroy to return jqXHR
			this.should_return_new = false;
            this.authenticated = false;
			var result = this.destroy();
			result.done(function() {
				this.success = true;
			});
			result.fail(function() {
				this.success = false;
			});
			result.always(function() {
				this.user = null;
			});
			return result;
		},
		isAuthenticated : function() {
		    return this.authenticated;
		}
	});
	return Session;
});
