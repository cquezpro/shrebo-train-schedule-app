define(['backbone', 'util', 'models', 'templates', 'iscroll'], function($B,
	util, models, templates, IScroll) {
	var ConfirmDialog = $B.View.extend({
		events : {
			"click .action-button" : "buttonPressed",
		},
		// basic view interface
		/**
		 * @memberOf ConfirmDialog
		 */
		initialize : function(options) {
			options = options || {};
			// nothing to do
			this.title = options.title || 'Confirm';
			this.text = options.text || '';
			this.buttonLabels = options.buttonLabels ? options.buttonLabels
				.split(',') : ['Yes', 'No'];
		},
		render : function() {
			// render collection of bookings
			this.$el.append(util.render(templates.confirm_dialog_html, {
				view : this,
			}));
		},
		collectionChanged : function() {
		},
		close : function() {
			this.unbind();
			this.remove();
		},
		show : function() {
			this.$el.show();
			this.$("#confirmdialog").addClass("in");
		},
		hide : function() {
			this.$el.hide();
			this.$("#confirmdialog").removeClass("in");
		},
		// functionality
		/**
		 * we return according to Phonegap's notification.confirm, i.e.
		 * 1-indexed number of button in options.buttonLabels
		 * 
		 * @see http://cordova.apache.org/docs/en/2.5.0/cordova_notification_notification.md.html
		 */
		buttonPressed : function(e) {
			var target = $(e.target);
			var buttonId = parseInt(target.attr('data-id'));
			this.trigger('button-pressed', buttonId + 1);
		}
	});
	return ConfirmDialog;
});
