define(['backbone', 'util', 'models', 'templates', 'jqgallery', 'settings'], function($B, util, models, templates, jqgallery, settings) {
    /**
     * View for staff to vote on section occupancy
     *
     * Displays as many voting dialogs as given in options.polls, numbered from
     * 1..n. Each poll is expected to carry the choices low, medium, high, over
     *
     * @param options.polls
     *            the list of Poll objects
     * @param options.stations
     *            the list of stations
     */
    var StaffVoteView = $B.View.extend({
        events : {
            "click" : "select",
            "click .action-drop-down" : "openPosition",
            "click .action-close" : "closePosition",
            "click .action-select-option" : "selectOption",
            "click .action-select-active" : "toggleActive",
        },
        /**
         * @memberOf StaffVoteView
         */
        initialize : function(options) {
            if (this.collection) {
                this.collection.bind("change", this.modelChanged, this);
            }
            this.polls = options.polls || [];
            this.stops = options.stops || [];
            this.itinerary = options.itinerary;
            this.sections = options.sections || [];
            console.log(this.stops);
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.staff_vote_html, {
                polls : this.polls,
                stops : this.stops,
                sections : _.filter(this.sections, function(el) {
                    // get 0-index array
                    return true;
                }),
                service_key : this.itinerary.get('sections')[0].service_key,
                view : this,
            }));
            // make page scrollable
            this.scroller = new IScroll('.staff-vote-scroller', {
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
            // initialize OK button and station selector
           
            $('#dg-container').gallery();
        },
        renderMenu : function() {
            var menu = this.$el.closest('[data-role=page]').find('#top_menu');
            var view = this;
            menu.empty();
            menu.append(util.render(templates.top_menu_staffvote_html));
            // activation and handler see this.checkAllPolls() 
            $('.action-save').removeClass('active');
        },
        /**
         * render dynamic values per position, i.e.
         *
         * Kl. <paxclass> <option>
         */
        renderInline : function(poll) {
            var el = this.$('[data-pollid={0}]'.format([poll.cid])).find('.vote-inline');
            el.empty();
            el.append(util.render(templates.staff_vote_inline_html, {
                vote : poll.getVote(),
            }));
            el.css('visibility', 'visible');
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
         * open a position vote
         */
        openPosition : function(e) {
            console.debug("trigger openPosition");
            var t = this.$(e.target);
            var poll_item = this.findPollItem(t);
            var box = poll_item.find('.down_box');
            // if this is to open, open and hide all others,
            // if it is already open, close and show all others
            if (box.is(':visible')) {
                this.closePosition(e);
            } else {
                poll_item.prevAll().hide();
                box.slideToggle();
            }
            this.scroller.scrollTo(0, 0);
        },
        /**
         * close a position vote
         *
         * this visually closes the vote dialog and gathers all of its data
         * into the corresponding vote
         */
        closePosition : function(e) {
            // visually close
            console.debug("trigger closePosition");
            var t = this.$(e.target);
            var poll_item = this.findPollItem(t);
            var box = poll_item.find('.down_box');
            poll_item.prevAll().show();
            box.slideToggle();
            var poll = this.findPoll(t);
            this.buildVoteFor(poll, poll_item);
        },
        /**
         * select an option button
         *
         * this is a generic radiobox selector. use as follows
         *
         * <pre>
         *   <ul class="vote-radiobox" data-group='groupid'>
         *     <li class="vote-option" data-option='v1'>
         *        &lt;a class=&quot;action-option-select&quot;&gt;option 1&lt;/a&gt;;
         * </li>
         *     <li class="vote-option" data-option='v2'>
         *       &lt;a class=&quot;action-option-select&quot;&gt;option 2&lt;/a&gt;;
         * </li>
         *   </ul>
         * </pre>
         *
         * On click .action-option-select, any option within the closest
         * vote-radiobox element is considered part of the radiobox.
         * selecting one will add .active to it, and remove .active from all
         * the others.
         */
        selectOption : function(e) {
            var t = this.$(e.target);
            var rb = t.closest('.vote-radiobox');
            var option = t.closest('.vote-option');
            var group = rb.data('group');
            var options = rb.find('.vote-option');
            options.removeClass('active');
            option.addClass('active');
            optid = option.data('option');
            console.debug('select group {0} option {1}'.format([group, optid]));
        },
        /**
         * find the closest poll
         *
         * given an element find the closest poll and return the
         * corresponding Poll instance. This assumes that the data-pollid is
         * the index into this.polls
         */
        findPoll : function(el) {
            var poll_item = this.findPollItem(el);
            var pollid = poll_item.data('pollid');
            return this.polls.get(pollid);
        },
        /**
         * find the closest .quickpoll item
         *
         * convenience function
         */
        findPollItem : function(el) {
            var poll_item = this.$(el).closest('.quickpoll');
            return poll_item;
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
        buildVoteFor : function(poll, poll_item) {
            var p = this.$(poll_item);
            // get the active choice
            var choice = p.find('[data-group=paxload] .vote-option.active');
            // gather vote data
            var paxclass = p.find('[data-group=paxclass] .vote-option.active');
            var posactive = p.find('[data-group=posactive]');
            var servicekey = p.find('[data-group=servicekey]');
            var sid = this.$('.station-select .dg-center').data('stopid');
            // prepare data to send along
            var data = {
                paxclass : paxclass.data('option'),
                station : this.stops.get(sid).get('itinerary_code'),
                posactive : posactive.data('option'),
                servicekey : servicekey.data('option'),
                device : util.getDeviceData(),
                geolocation : false,
                email : app.session.auth.user.get('email'),
            };
            // get last known geo location
            if (app.session.geoPosition) {
                data = _.extend(data, {
                    geolocation : true,
                    coord : app.session.geoPosition,
                    // not a final vote yet
                    finalized : false,
                });
            }
            choice = _.extend(choice.data('option') || 'invalid', {});
            // finally, vote and save it
            poll.vote(choice, '', data);
            this.checkAllPolls();
            this.renderInline(poll);
        },
        checkAllPolls : function() {
            var all = this.polls.every(function(poll) {
                return poll.isVoted();
            });
            var view = this;
            if (all) {
                $('.action-save').addClass('active');
                $('.action-save').on('click', function() {
                    var results = [];
                    app.progress.show();
                    view.polls.each(function(poll) {
                        var vote = poll.getVote();
                        // force a new vote
                        vote.unset('id');
                        vote.updateData({
                            finalized : true
                        });
                        results.push(vote.save());
                    });
                    $.when.apply($, results).always(function() {
                        app.progress.hide();
                        view.trigger('vote_success', view.polls);
                    });
                });
            }
        },
        /**
         * toggle the active / inactive display
         */
        toggleActive : function(e) {
            var t = this.$(e.target);
            var current = this.isPositionActive(t);
            var posactive = this.getPositionFlag(t);
            posactive.data('option', current ? 0 : 1);
            if (current) {
                posactive.find('.is-active').hide();
                posactive.find('.is-inactive').show();
            } else {
                posactive.find('.is-inactive').hide();
                posactive.find('.is-active').show();
            }

            var poll = this.findPoll(t);
            var poll_item = this.findPollItem(t);
            this.buildVoteFor(poll, poll_item);
        },
        /**
         * get position flag
         */
        getPositionFlag : function(el) {
            var poll = this.findPoll(el);
            var poll_item = this.findPollItem(el);
            var posactive = poll_item.find('[data-group=posactive]');
            return posactive;
        },
        /**
         * determine if position is active
         */
        isPositionActive : function(el) {
            var posactive = this.getPositionFlag(el);
            var current = parseInt(posactive.data('option'));
            return current;
        },
        getVoteLabel : function(option) {
            return settings.vote_levels[option] || '&nbsp;';
        },
    });
    return StaffVoteView;
});
