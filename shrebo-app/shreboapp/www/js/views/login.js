define(['backbone', 'util', 'text!templates/login.html'], function($B, util, login_html) {
	var LoginView = $B.View.extend({
		events : {
			"click #action-login" : "login",
		},
		initialize : function() {
			if (this.collection) {
				this.collection.bind("change", this.modelChanged, this);
			}
		},
		render : function() {
			this.$el.empty();
			this.$el.append(util.render(login_html, { col : this.collection }));
			//this.iscroll = new IScroll('#wrapper', { mouseWheel: true, click: true });
		},
		modelChanged : function() {

		},
		close : function() {
			this.remove();
			this.unbind();
			if (this.collection) {
				this.collection.unbind("change", this.modelChanged);
			}
		},
		// functionality
		/**
		 * login the user according to the form 
		 */
		login : function () {
			var result = this.model.login(this.$("#username").val(), this.$("#password").val());
			var view = this;
			result.done(function() {
				view.trigger('login_success', view.model.user);
			});
			result.fail(function() {
				view.trigger('login_failed', view.model.user);
			});
		}
	});
	return LoginView;
});
