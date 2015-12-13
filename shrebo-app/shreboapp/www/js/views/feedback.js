define(['backbone', 'util', 'templates', 'nicebuttons'], function($B, util, templates) {
    /**
     * Display a poll view for feedback
     * 
     * @param model
     *            the Poll model
     */
    var FeedbackView = $B.View.extend({
        events : {
            "click" : "select",
            "click .vote-option" : "selectOption"
        },
        initialize : function(options) {
            this.poll = options.poll;
            this.canSubmit = false;
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.feedback_html, {
                view : this,
                poll : this.poll,
            }));
            this.scroller = new IScroll('.feedback-scroller', {
                mouseWheel : true,
                click : false
            });
            var view = this;
            setTimeout(function() {
                view.scroller.refresh();
                // view.scroller.scrollTo(0, -500, 500, false);
            }, 500);
            this.scroller.on('scrollStart', function() {
                console.debug('scrollStart');
                // view.scroller.refresh();
                // view.scroller.scrollTo(0, -500, 500, false);
            });
            this.$('input:radio').screwDefaultButtons({
                image : 'url("img/radioSmallBlue.png")',
                width : 52,
                height : 52
            });
        },
        renderMenu : function() {
            // TODO simplify menu handling by having each page declare
            // its own menu directly within the template
            var menu = this.$el.closest('[data-role=page]').find('#top_menu');
            var view = this;
            menu.empty();
            menu.append(util.render(templates.top_menu_okcancel_html));
            menu.find('.action-ok').click(function(e) {
                view.buildFeedback(e);
            });
            menu.find('.action-back').click(function(e) {
                view.trigger('feedback_cancelled');
            });
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
         * select an option
         */
        selectOption : function(e) {
            $('#top_menu .action-ok').closest('li').addClass('active');
            this.canSubmit = true;
        },
        /**
         * build the vote for the poll
         * 
         * retrieves all vote options and data, builds the vote
         * 
         * @param poll
         *            the Poll instance
         * @param poll_item
         *            the poll_item in the DOM
         */
        buildFeedback : function(e) {
            console.debug('trigger buildFeedback');
            var t = $(e.target);
            var option = this.$('[type=radio]:checked').closest('.vote-option')
                .data('option');
            var comment = this.$('#comment').val();
            if (this.canSubmit) {
                // finally, vote and save it
                var data = {
                    user : 'unknown',
                    info : util.getDeviceData()
                };
                try {
                    _.extend(data, {
                        email : app.session.auth.user.get('email')
                    });
                } catch (e) {
                    // ignore
                }
                this.trigger('feedback_submitted');
                this.poll.vote(option, comment, data);
            }
        },
    });
    return FeedbackView;
});
