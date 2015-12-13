define(['backbone', 'models/polls/polls'], function($B, pollmodels) {
    /**
     * The unobstrusive view helper to enable quickpoll option processing
     *
     * Usage:
     *
     * <pre>
     * # only statement required:
     * var voter = PollVoter({
     *   view : view, // view to attach to
     *   polls: polls,  // Collection of Poll objects
     *   groups: groups, // array of groups
     *   extraVoteData : {} // extra data to be included in the poll
     * });
     * # optionally:
     * view.on('option_selected', handler as function(poll, group, option) { ... });
     * voter.castVote(poll, groups, builder as function(poll, poll_item) { ... });
     * view.on('vote_cast', function(poll, choice, data) { ... });
     * </pre>
     *
     * A quickpoll vote always has the following structure (css classes and
     * data-items). It is assumed the view has already rendered this structure.
     *
     * <pre>
     * .quickpoll data-pollid=poll-id
     *      .vote-radiobox data-group=group-id
     *          .vote-option data-option=value
     *                .action-select-option
     *          .vote-option data-option=value
     *                .action-select-option
     *          (... more .vote-options)
     *       (... more .vote-radioboxes)
     *      .action-cast-vote
     * </pre>
     *
     * Note that you may use any HTML elements you deem appropriate. PollVoter
     * only relies on the css classes and data-items, not the element types.
     *
     * On calling PollVoter.attach(view, polls, groups), pass the group-ids as
     * an array, e.g. ['group1', 'group2']. The first group listed is considered
     * the poll's voting choice. if no groups are given, the first
     * .vote-option.active's data-option will be the voting choice.
     *
     * If groups is given, PollVoter will collect all group's active data-option
     * values and pass them along as a .data item on voting. Except the first
     * group's value, which is passed as the .choice item on voting.
     *
     * All .action-select-option elements trigger the selection of one option
     * within the .vote-radiobox, that is it will remove the .active class from
     * all other options within the same group, and add the .active class to the
     * item that triggered the select.
     *
     * All .action-cast-vote elements trigger the casting of the closest
     * .quickpoll vote. You may also call PollVoter.castVote directly if there
     * is some pre-voting logic to be executed.
     */
    var PollVoter = $B.View.extend({
        events : {
            "click .action-select-option" : "selectOption",
            "click .action-list-select" : "selectSelectOption",
            "click .action-cast-vote" : "actionCastVote",
            "click .action-cancel-vote" : "actionCancelVote",
        },
        /**
         * @memberOf PollVoter
         */
        initialize : function(options) {
            this.attachedTo = options.view;
            this.polls = options.polls || new pollmodels.Poll.objects();
            this.groups = options.groups;
            this.extraVoteData = options.extraData || {};
        },
        /**
         * attach this view to an existing (rendered) set of options. just
         * give the view instance. Note that the view must already have
         * rendered one or several polls and have created the necessary
         * model Poll instance.
         *
         * @param view
         *            the view to attached to
         * @param polls
         *            optional polls collection this applies to
         * @param groups
         *            optional array of group ids. if no groups ids are
         *            given the first .vote-option.active within the
         *            .quickpoll element is considered the poll's voting
         *            choice.
         */
        attach : function(view, polls, groups) {
            this.attachedTo = view;
            this.$ = view.$;
            this.polls = this.polls || polls;
            this.groups = groups || this.groups;
        },
        /**
         * late call to update extra data while user is
         * already voting. use this to ingest asynchronous data
         * such as geo location. note that there is no guarantee
         * that this data is collected because the user may have
         * sent off the vote once this data arrives.
         */
        updateExtraData : function(extra) {
            this.extraVoteData = _.extend(this.extraVoteData, extra);
        },
        /**
         * vote casting by click on .action-cast-vote
         */
        actionCastVote : function(e) {
            var t = this.$(e.target);
            var poll_item = this.findPollItem(t);
            var poll = this.findPoll(t);
            var voter = this.castVote(poll, this.groups);
            var view = this;
            voter.done(function(vote) {
                view.attachedTo.trigger('vote_success', vote);
            });
        },
        /**
         * same as vote casing, however vote is recored as cancelled.
         */
        actionCancelVote : function(e) {
            var t = this.$(e.target);
            var poll_item = this.findPollItem(t);
            var poll = this.findPoll(t);
            var voter = this.castVote(poll, this.groups, null, {
                cancelled : true,
            });
            var view = this;
            voter.done(function(vote) {
                view.attachedTo.trigger('vote_cancelled', vote);
            });
        },
        /**
         * generic vote casting.
         *
         * call this to cast a vote on a given poll item. this will
         * automatically collect the respective poll's choice and optional
         * additional data.
         *
         * The default vote builder will work as follows:
         *
         * 1. find all choice groups and collect their data. a group is
         * marked by data-group=<groupid> witin the a poll marked with
         * .quickpoll 2. the data colleced per each group is the
         * data-option's value for the .vote-option.active item within that
         * group. 3. the vote's choice is the first group's value 3. if
         * there are no groups given, the first .vote-option.active is
         * assumed to be the choice value, disregarding any data-groups.
         *
         * @param poll
         *            the poll to cast for
         * @param builder
         *            an optional builder function(poll, poll_item) to
         *            return the data object to store along the vote.
         *            optionally return a $.Deferred for asynchronous
         *            processing.
         * @param groups
         *            optional array of data-groups to retrieve additional
         *            vote data from. the first entry is the group with the
         *            actual poll choice, the other groups are used to
         *            collect vote data
         * @return $.Deferred that's resolved once the vote has been cast
         */
        castVote : function(poll, groups, builderfn, extraData) {
            if (_.isFunction(groups)) {
                builder = groups;
            }
            var groups = groups || this.groups;
            var poll_item = $('.quickpoll[data-pollid={0}]'.format([poll.cid]));
            var voter = $.Deferred();
            var builder = this.buildVoteFor(poll, poll_item, groups, builderfn);
            // once the vote has been resolved, cast it
            var view = this;
            builder.done(function(choice, data) {
                // finally, vote and callback to the attachedTo view
                data = _.extend(data, extraData || {}, view.extraVoteData);
                var vote = poll.vote(choice || 'invalid', '', data);
                voter.resolve(vote, poll, choice, data);
            });
            return voter;
        },
        /**
         * build the vote, optionally calling a builder function to retrieve
         * additional data for the poll.
         *
         * expects at least one .vote-option.active within the poll_item. if
         * no builder is given, the default builder will
         *
         * @return a $.Deferred that will be resolved with the builder's
         *         output
         */
        buildVoteFor : function(poll, poll_item, groups, builderfn) {
            if (_.isFunction(groups)) {
                builder = groups;
                groups = this.groups || null;
            }
            // gather vote data
            var builderResult = $.Deferred();
            var builder = builderfn || this.defaultBuilder;
            var result = builder(poll, poll_item, groups);
            if ( result instanceof $.Deferred) {
                result.done(function(choice, data) {
                    builderResult.resolve(choice, data);
                });
            } else {
                builderResult.resolve(result.choice, result.data);
            }
            return builderResult;
        },
        /**
         * default vote builder
         */
        defaultBuilder : function(poll, poll_item, groups) {
            // get group data. build a dictionary of
            // { group : <data-option>, ... }
            var data = null;
            var choice = null;
            groups = groups || this.groups;
            var p = this.$(poll_item);
            if (groups) {
                data = {};
                _.each(groups, function(group, i) {
                    var item = p.find('.vote-radiobox[data-group={0}] .vote-option.active'.format([group]));
                    data[group] = item.data('option');
                });
                // poll's vote choice is the first group listed
                choice = data[groups[0]];
                delete data[groups[0]];
            } else {
                // no groups means to get just the first matching
                choice = p.find('.vote-option.active').first().data('option');
            }
            return {
                choice : choice,
                data : data
            };
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
            var view = this;
            options.removeClass('active');
            // allow DOM refresh to avoid sluggish option change
            setTimeout(function() {
                option.addClass('active');
                optid = option.data('option');
                // trigger callback event to the attached view
                view.attachedTo.trigger('option-selected', view.findPoll(t), group, option);
                console.debug('PollVoter: select group {0} option {1}'.format([group, optid]));
            }, 0);
        },
        /**
         * select element option selection
         */
        selectSelectOption : function(e) {
            var t = this.$(e.target);
            var rb = t;
            var group = t.data('group');
            var option = t.find('option:selected');
            var options = t.find('option');
            optid = option.data('option');
            var view = this;
            options.removeClass('active');
            // allow DOM refresh to avoid sluggish option change
            setTimeout(function() {
                option.addClass('active');
                // trigger callback event to the attached view
                view.attachedTo.trigger('option-selected', this.findPoll(t), group, option);
                console.debug('PollVoter: select group {0} option {1}'.format([group, optid]));
            }, 0);
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
            var t = this.$(el);
            var poll_item = t.closest('.quickpoll');
            // if there is no pollid, the action was triggered outside
            // the .quickpoll element => get the pollid from the target and
            // find globally
            if (poll_item.length == 0) {
                var pollid = t.data('pollid') || '';
                poll_item = this.$('.quickpoll[data-pollid={0}]'.format([pollid] || 'invalid'));
            }
            return poll_item;
        },
        /**
         * return true if all polls have been voted
         */
        checkAllPollsVoted : function() {
            var all = this.polls.every(function(poll) {
                return poll.isVoted();
            });
            return all;
        },
    });
    var polls = {
        PollVoter : PollVoter,
    }
    return polls;
});
