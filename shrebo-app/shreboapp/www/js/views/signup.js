define(['backbone', 'util', 'scrollto', 'iscroll', 'text!templates/signup.html'], function($B, util, scrollto, iscroll, signup_html) {
    var SignupView = $B.View.extend({
        events : {
            "click .action-signup" : "signup",
            "focus :input" : 'focusin',
            "focusout :input" : 'focusout',
        },
        initialize : function() {
            if (this.collection) {
                this.collection.bind("change", this.modelChanged, this);
            }
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(signup_html, {
                col : this.collection
            }));
            // add scrolling support
            this.scroller = new iscroll('#signup-scroller');
            if(app.settings.variant == 'staff') {
                this.$('.only-customer').hide();
            }
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
         * Signup the user according to the form
         */
        signup : function() {
            app.progress.show();
            util.hideKeyboard();
            // generate a random password
            var password = util.uuid();
            // generate a user
            var name = this.$("#name").val();
            var first_name = _.first(name.split(" "));
            var last_name = _.last(name.split(" "));
            var email = this.$("#email").val();
            var username = this.$("#email").val();
            if((app.settings.variant != "staff" && name == '') || username == '') {
                app.progress.hide();
                this.$("#email,#name").addClass('glowing-border');
               return; 
            }
            this.$("#email,#name").removeClass('glowing-border');
            this.model.set('username', username);
            this.model.set('email', email);
            this.model.set('first_name', first_name);
            this.model.set('last_name', last_name);
            this.model.set('password', password);
            if (app.settings.variant == 'staff') {
                // no signup required, go straight to login
                // FIXME need to refactor this to signup/login modes
                if (!email.trim()) {
                    return
                } else {
                    this.trigger('signup_failed', this.model);
                }
            }
            // perform the signup
            var result = this.model.save();
            var view = this;
            // work on results
            result.done(function() {
                // at this point the password will be scrambled
                // because the server does not transmit passwords
                // back, so we have to pass it on here
                app.progress.hide();
                view.trigger('signup_success', view.model, password);
            });
            result.fail(function() {
                app.progress.hide();
                view.trigger('signup_failed', view.model);
            });
        },
        // android scroll up on keyboard support
        focusin : function(e) {
            if (device.platform.match(/Android/) == undefined)
                return;
            $(".login_logo_box").hide();
        },
        focusout : function(e) {
            if (device.platform.match(/Android/) == undefined)
                return;
            $(".login_logo_box").show();
        }
    });
    return SignupView;
});
