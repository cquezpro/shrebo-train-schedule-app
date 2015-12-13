define(['backbone', 'settings'], function($B, settings) {
	/**
	 * UserAddress. This provides access to an address that the user
	 * has specified
	 */
	var UserAddress = $B.Model.extend({
		urlRoot : settings.authApiUri + '/address/',
	});
	var objects = $B.Collection.extend({
		model : UserAddress,
		url : settings.authApiUri  + '/address/',
		initialize : function() {
			this.qryFilter('user', function() {
				return window.app.session.auth.user.get('id');
			});
		}
	});
	UserAddress.objects = objects;
	return UserAddress;
});
