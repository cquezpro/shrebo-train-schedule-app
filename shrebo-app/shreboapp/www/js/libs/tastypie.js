/**
 * tastypie specific overrides for the Backbone.sync and .ajax
 * calls. 
 */
define(['settings', 'underscore', 'backbone', 'libs/backbone-tastypie'], function(settings, _, $B, $BTastypie) {
	var backbone_sync = $B.sync;
	var backbone_ajax = $B.ajax;
	var overrides = {
		/**
		 * custom
		 *  Backbone.sync
		 */
		sync : function(method, model, options) {
			var model_url = (typeof model.url == 'function') ? model.url() : model.url;
			var model_query = (typeof model.query == 'function') ? model.query() : model.query;
			options.url = settings.apiUrl + model_url;
			options.url += model_query ? "?" + model_query : '';
			console.debug('tastypie.sync -- accessing ' + options.url);
			return backbone_sync(method, model, options);
		},
		/**
		 * tastypie overrides for the ajax to pass the
		 * required data
		 */
		ajax : function(request) {
			var username = app.session.auth.get('login');
			var password = app.session.auth.get('password');
			request = _.extend(request, this.ajaxOptions(request.method, request.data, 
				username, password));
			console.debug('tastypie.ajax -- requesting ' + JSON.stringify(request));
			console.debug('user/password' + username + '/' + password);
			return backbone_ajax(request);
		},
		/**
		 * tastypie options
		 */
		ajaxOptions : function(method, data, user, password) {
			console.debug('tastypie.tastypieOptions -- setting options for user ' + user);
			var options = {
				method : method,
				async : true,
				/*
				 * always stringify the JS object, otherwise it is transmitted
				 * as a urlncoded string
				 * 
				 * NOTE: Backbone already has stringified at this point, so
				 * no need to do so now
				 */
				//data : JSON.stringify(data),
				/* according to jQuery documentation set either accepts with a correct
				 * header, e.g. accepts = { text : "application/json" }
				 * or only use the dataType. see http://api.jquery.com/jQuery.ajax/
				 * Because shrebo API only returns JSON upon GET requests
				 * you have to set dataType = text for all other, otherwise
				 * jQuery will have a bad conversion error.
				 */
				//dataType : method == 'GET' ? 'json' : 'text',
				contentType : "application/json",
				/* you have to set procesData to false, otherwise jQuery transforms
				 * the JSON object into querystrings like this: ?username=xy&password=xy
				 * and this is not accepted by shrebo (it returns 400 BAD REQUEST)
				 */
				processData : false,
				crossDomain : true,
				xhrFields : {
					//withCredentials: true
				},
				beforeSend : function(xhr) {
					if ( typeof (user) != "undefined") {
						// this has to be Base64 encoded
						xhr.setRequestHeader("Authorization", "Basic " + window.btoa(user + ":" + password));
					}
				},
			};
			return options;
		},
	};
	// setup our sync functions
	$B.sync = overrides.sync;
	$B.ajax = overrides.ajax;
	$B.ajaxOptions = overrides.ajaxOptions;
	return overrides;
}); 