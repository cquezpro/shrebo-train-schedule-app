define(['backbone', 'util', 'models', 'templates', 'iscroll'], function($B, util, models, templates, IScroll) {
    /**
     * A modal password dialog.
     */
    var PasswordDialog = $B.View.extend({
        events : {
            "click .action-ok" : "actionOK",
            "click .action-cancel" : "actionCancel",
            "click .action-reset" : "actionReset",
        },
        // basic view interface
        initialize : function(options) {
            options = options || {};
            // nothing to do
            this.title = options.title || 'Confirm';
            this.text = options.text || '';
            this.linkText = options.linkText;
            this.buttonLabels = options.buttonLabels || ['Cancel', 'Reset', 'OK'];
        },
        render : function() {
            // render collection of bookings
            this.$el.append(util.render(templates.password_dialog_html, {
                view : this,
            }));
        },
        collectionChanged : function() {
        },
        close : function() {
            this.remove();
            this.unbind();
        },
        show : function() {
            this.$("#passworddialog").addClass("in");
        },
        hide : function() {
            this.$("#passworddialog").removeClass("in");
        },
        /**
         * return text with reset link
         * 
         */
        getText : function() {
            // expect "some text {link}", where {link} is
            // replaced by the actual link
            return this.text.format({
                link : this.getResetLink()
            });
        },
        /**
         * generate the reset link.
         * 
         * returns <a> that has linkText in it
         */
        getResetLink : function() {
            return '<a href="#" class="action-reset">{0}</a>'.format([this.linkText]);
        },
        // functionality
        actionOK : function() {
            var password = this.$("#passwordtext").val();
            this.trigger('actionOk', password);
        },
        actionCancel : function() {
            this.trigger('actionCancel');
        },
        actionReset : function() {
            this.trigger('actionReset');
        }
    });
    return PasswordDialog;
});
