define(['backbone', 'settings', 'models/auth/address'], function($B, settings,
	UserAddress) {
	/**
	 * UserProfile. This provides access to the user's profile as a whole. Note that its
	 * address collection needs to be updated through the
	 */
	var UserProfile = $B.Model.extend({
		urlRoot : settings.authApiUri + '/user/',
		getDetails : function() {
			return this.get('profile');
		},
		initialize : function(options) {
			this._addressList = {};
			this._super = $B.Model.prototype;
		},
		/**
		 * get the specified address from the list of addresses. returns the same
		 * UserAddress for the same role.
		 * 
		 * @param role
		 *            defaults to role profile
		 */
		getAddress : function(role) {
			role = role || 'profile';
			// cached?
			if (this._addressList[role]) {
				return this._addressList[role];
			}
			// get profile address
			var addresses = _.filter(this.getDetails().address, function(
				address) {
				return address['role'] == role;
			});
			// create UserAddress objects
			this._addressList[role] = _.map(addresses, function(a) {
				return new UserAddress(a);
			})[0];
			// cache it for further reference
			return this._addressList[role];
		},
		/**
		 * save addresses seperately as they can't be updated
		 * through the UserProfile resource directly.
		 */
		save : function(attributes, options) {
			_.each(this._addressList, function(address) {
				address.save();
			});
			this._super.save.call(this, attributes, options);
		},
	});
	var objects = $B.Collection.extend({
		model : UserProfile,
		url : settings.authApiUri + '/user/',
		initialize : function() {
			this.qryFilter('user', function() {
				return window.app.session.auth.user.get('id');
			});
		}
	});
	UserProfile.objects = objects;
	return UserProfile;
});
