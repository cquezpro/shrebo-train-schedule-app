define(['backbone', 'util', 'models', 'templates', 'jqgallery',
    'views/polls/polls', 'settings', 'moment'], function($B, util, models, templates, jqgallery, polls, settings, moment) {
    /**
     * View for customers to vote on section occupancy
     * 
     * Displays as many voting dialogs as given in options.polls, numbered from
     * 1..n. Each poll is expected to carry the choices low, medium, high, over
     * 
     * @param options.polls
     *            the list of Poll objects
     * @param options.stations
     *            the list of stations
     */
    var CustomerVoteView = $B.View
        .extend({
            events : {
                "click" : "select",
                "click .action-drop-down" : "openPosition",
                "click .action-close" : "closePosition",
                "click .action-select-option" : "selectOption",
                "click .action-select-active" : "toggleActive",
            },
            /**
             * @memberOf CustomerVoteView
             */
            initialize : function(options) {
                if (this.collection) {
                    this.collection.bind("change", this.modelChanged, this);
                }
                this.polls = options.polls || null;
                this.itinerary = options.itinerary;
            },
            render : function() {
                this.$el.empty();
                this.$el
                    .append(util
                        .render(templates.customer_vote_html, {
                            poll : this.polls.at(0),
                            service_key : this.itinerary.get('sections')[0].service_key,
                            view : this,
                        }));
                // make page scrollable
                this.scroller = new IScroll('#customer-vote-scroller', {
                    mouseWheel : true,
                    click : false,
                });
                var view = this;
                setTimeout(function() {
                    view.scroller.refresh();
                    // view.scroller.scrollTo(0, -500, 500, false);
                }, 1000);
                view.scroller.on('scrollStart', function() {
                    console.log('scroll start');
                });
                // initialize OK button and station selector
                $('.action-staffvote').removeClass('active');
                $('#dg-container').gallery();
                // $('#top-menu').hide();
                // attach PollVoter
                this.voter = new polls.PollVoter({
                    el : this.el,
                    view : this,
                    polls : this.polls,
                    groups : ['paxload', 'paxsection', 'paxclass', 'servicekey'],
                    extraData : {
                        extra : util.getDeviceData(),
                    },
                });
                this.askGeoLocationPermission();
                this.voter.render();
            },
            renderMenu : function() {
                $("#top_menu").empty();
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
            askGeoLocationPermission : function() {
                var permission = $.Deferred();
                var view = this;
                var geopermission = util.storage.get('permission_geolocation');
                if (geopermission == null) {
                    navigator.notification
                        .confirm(settings.texts['customervote_geopermission'], function(s) {
                            switch (s) {
                                case 1 :
                                    util.storage
                                        .set('permission_geolocation', true);
                                    permission.resolve();
                                    break;
                                case 2 :
                                    util.storage
                                        .set('permission_geolocation', false);
                                    permission.reject();
                                    break;
                                default :
                                    permission.reject();
                            }
                        }, 'Ihre Entscheidung', 'Ja,Nein');
                } else {
                    if (geopermission) {
                        permission.resolve();
                    }
                    permission.reject();
                }
                permission.done(function() {
                    $('.statusicons').show();
                    $('.statusicons .geo').addClass('animated').show();
                    var geoloc = util.getPositionCoordinates();
                    // store the fact that geo location is allowed
                    view.voter.updateExtraData({
                        geolocation : true
                    });
                    // wait until we actually have some geo location data
                    geoloc.done(function(coord) {
                        $('.statusicons .geo').removeClass('animated').show();
                        view.voter.updateExtraData({
                            coord : coord
                        });
                    });
                }).fail(function() {
                    view.voter.updateExtraData({
                        geolocation : false,
                    });
                });
            },
            getJourneyDisplay : function() {
                var origin = this.itinerary.get('origin');
                var dest = this.itinerary.get('destination');
                return '{0} - {1}'.format([origin.info.timetable_city,
                    dest.info.timetable_city]);
            },
            getDateTimeDisplay : function() {
                var origin = this.itinerary.get('origin');
                var dest = this.itinerary.get('destination');
                return '{0} - {1}, {2}'.format([
                    moment(origin.departure).format('HH.mm'),
                    moment(dest.arrival).format('HH.mm'),
                    moment(dest.arrival).format('DD.MM.YYYY')]);
            },
            getVoteLabel : function(option) {
                return settings.vote_levels[option] || '&nbsp;';
            }
        });
    return CustomerVoteView;
});
