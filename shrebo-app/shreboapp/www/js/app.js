define(['backbone', 'jquery', 'util', //
'models', 'views', 'settings', 'templates', 'moment'], //
function($B, $, util, //
models, views, settings, templates, moment) {
    // initialise session
    var _session = {
        /**
         * @memberOf session
         */
        // api call authentication
        username : 'admin',
        password : 'test',
        // current user authentication check
        authenticated : function() {
            if (app.session.auth.isAuthenticated()) {
                return true;
            }
            return false;
        },
        // global shareable collection. we use this
        // to pass data between views. it gets initially
        // populated by app.initialization
        reservations : new models.ItineraryReservation.objects(),
        userBookings : new models.ItineraryReservation.objects(),
        shopOrders : new models.Order.objects(),
        // user authentication and profile
        profile : new models.UserProfile(),
        auth : new models.Auth(),
        // coach connections
        connections : new models.Itinerary.objects(),
        // passenger list
        passengers : new models.ItineraryPassenger.objects(),
        // services list
        services : new models.ItineraryService.objects(),
        // currently selected service
        service : null,
        // polls list
        polls : new models.Polls.Poll.objects(),
        // push notifications received but not handled. these
        // are stored by href as the key (a simple per-view queue)
        messages : {},
    };
    // setup routes and actions
    var Workspace = Backbone.Router
        .extend({
            // define routes=>actions
            routes : {
                'home' : 'home',
                'reservation/:id' : 'reservation',
                'bookings' : 'bookingsList',
                'booking/booker/:id' : 'bookingBooker',
                'search' : 'search',
                'scan' : 'scan',
                'groups' : 'groupList',
                'signup' : 'signup',
                'login' : 'login',
                'logout' : 'logout',
                'autologin' : 'autologin',
                'feedback' : 'feedback',
                'seats/:id' : 'seatSelection',
                'searchresults' : 'searchResults',
                'itinerary/:id' : 'itinerary',
                'mainmenu' : 'mainMenu',
                'passengers' : 'passengerList',
                'settings' : 'settings',
                'payments' : 'payments',
                'staffvote' : 'staffVote',
                'customervote' : 'customerVote',
                'staffservice' : 'staffService',
                'stats' : 'stats',
                'favorites' : 'favorites',
            },
            // actions
            // cancel go back to previous page
            /**
             * @memberOf Workspace
             */
            home : function() {
                app.workspace.navigate(app.settings.main_view, {
                    trigger : true
                });
            },
            cancel : function() {
                console.trace('app trigger event cancel');
                window.history.back();
            },
            //
            mainMenu : function() {
                console.trace('app trigger route mainMenu');
                // setup view
                var view = viewManager
                    .create(views.MainMenuView, {}, '#page .content');
                // install handlers
                view.on('scan', function() {
                    app.workspace.navigate('#scan', {
                        trigger : true
                    });
                });
                // show view
                viewManager.changePage("#page").show(view);
            },
            // -- reservation page
            reservation : function(id) {
                console.trace('app trigger route reservation:id=' + id);
                // setup the reservation view
                var view = viewManager.create(views.ReservationView, {
                    collection : app.session.connections,
                    model : new models.Reservation({
                        from_date : new Date(),
                        to_date : new Date()
                    }, {
                        related : {
                            user : app.session.auth.user,
                            shareable : app.session.connections.get(id)
                        }
                    }),
                }, '#page .content');
                // install handlers
                view.on('sector_selected', function(reservation) {
                    app.sectorSelected = true;
                });
                // reset sector selection (otherwise feedback will not
                // appear again)
                app.sectorSelected = false;
                // show the view
                viewManager.changePage("#page").show(view);
            },
            // booking list
            bookingsList : function() {
                console.trace('app trigger route booking_list');
                app.progress.show();
                var results = app.session.userBookings
                    .qryFilter(app.session.auth.user)
                    .qryFilter('status', '0,1', "in").fetch();
                var view = viewManager.create(views.BookingListView, {
                    collection : app.session.userBookings,
                }, '#page .content');
                // install handlers
                view.on('select_booking', function(booking) {
                    console.debug('app booking_list.select_booking {0}'
                        .format(booking.cid));
                    app.workspace.navigate('#booking/booker/' + booking.cid, {
                        trigger : true
                    });
                });
                view.on('cancel_booking', function(booking) {
                    // booking was cancelled, show the list again
                    console.debug('app booking_list.cancel_booking {0}'
                        .format([booking.shareable.get('label')]));
                    var results = app.session.userBookings
                        .qryFilter(app.session.auth.user).fetch();
                    var view = this;
                    results.done(function() {
                        view.render();
                    });
                });
                // when results are ready, show booking list
                results.done(function() {
                    app.progress.hide();
                    viewManager.changePage("#page").show(view);
                });
            },
            // booker booking view
            bookingBooker : function(id) {
                console.trace('app trigger route booking/booker');
                var booking = app.session.userBookings.get(id);
                var view = viewManager.create(views.BookingBookerView, {
                    model : booking
                }, '#page .content');
                // install view handlers
                view.on('back', function() {
                    app.workspace.navigate('#bookings', {
                        trigger : true
                    });
                });
                viewManager.changePage("#page").show(view);
            },
            // passenger list
            passengerList : function() {
                console.trace('app trigger route passengers');
                // sanity check -- we only show passenger lists of
                // one particular service
                if (!app.session.service) {
                    alert("no service known, cannot show passenger list");
                    app.workspace.navigate('#home', {
                        trigger : true
                    });
                    return;
                }
                // ok we know a service, so we can retrieve the list
                var result = app.session.passengers.fetch();
                var view = viewManager.create(views.ProfileListView, {
                    collection : app.session.passengers,
                }, '#page .content');
                // install handlers
                view.on('select_profile', function(group) {
                });
                view.on('back_clicked', function(group) {
                    app.workspace.navigate('#scan', {
                        trigger : true
                    });
                });
                // show view once we have the passenger list
                result.done(function() {
                    viewManager.changePage("#page").show(view);
                });
                result.fail(function() {
                    alert("Could not retrieve passenger list");
                });
            },
            // group list view
            groupList : function() {
                console.trace('app trigger route groups');
                var view = viewManager.create(views.GroupListView, {
                    collection : app.session.groups
                }, '#page .content');
                // install handlers
                view.on('select_group', function(group) {
                    // restrict shareables to the group we're in
                    var shareables = app.session.shareables.qryFilter(group);
                    var groups = app.session.groups;
                    var results = shareables.fetch();
                    results.done(function() {
                        navigate("#shareables");
                    });
                });
                // show view
                viewManager.changePage("#group_list").show(view);
            },
            // search
            search : function() {
                console.trace('app trigger route search');
                var view = viewManager.create(views.SearchView, {
                    collection : app.session.connections
                }, '#page .content');
                // install handlers
                view.on('results_ready', function(connections) {
                    // navigate to reservation
                    navigate('#searchresults');
                });
                // show view
                viewManager.changePage('#page').show(view);
            },
            // search
            searchResults : function() {
                console.trace('app trigger route search results');
                var view = viewManager.create(views.SearchResultsView, {
                    collection : app.session.connections,
                }, '#page .content');
                // install handlers
                view.on('itinerary_selected', function(itries) {
                    // get the first (to) for session selection and favorites
                    var itinerary = itries.at(0);
                    app.addFavorite(itinerary);
                    app.session.itinerary_ref = itinerary.get('ref');
                    itries.each(function(itry) {
                        console.debug('itinerary selected ref={0}'.format([itry
                            .get('ref')]));
                    });
                    app.confirmReservation(itries);
                });
                view.on('itinerary_detail', function(itinerary) {
                    // get the service(s) for the selected itinerary
                    // TODO query more than one service
                    // add to favorites
                    var service_key = itinerary.get('sections')[0].service_key;
                    var result = app.session.services
                        .qryFilter('service_key', service_key).fetch();
                    result.done(function() {
                        app.session.service = app.session.services.at(0);
                        app.addFavorite(itinerary);
                        app.workspace.navigate('#itinerary/' + itinerary.cid, {
                            trigger : true
                        });
                    });
                });
                // show view
                viewManager.changePage('#page').show(view);
            },
            itinerary : function(id) {
                console.trace('app trigger route itinerary ' + id);
                // get the stations
                app.session.service
                    .getStops()
                    .done(function(stops) {
                        var view = viewManager
                            .create(views.ItineraryDetailView, {
                                stops : app.session.service.related.stops,
                                itinerary : app.session.connections.get(id),
                            }, '#page .content');
                        // install handlers
                        view.on('select_seats', function(itinerary) {
                            app.workspace.navigate('#seats/' + itinerary.cid, {
                                trigger : true
                            });
                        });
                        view
                            .on('itinerary_selected', function(itinerary) {
                                var result = app
                                    .confirmReservation(new $B.Collection([itinerary]));
                                result.fail(function(itry) {
                                    console.debug('cancel confirmation');
                                    window.history.back();
                                });
                            });
                        // show view
                        viewManager.changePage('#page').show(view);
                    });
            },
            // scan qr code
            scan : function() {
                console.trace('app trigger route scan');
                var view = viewManager
                    .create(views.ScanQRCodeView, {}, '#page .content');
                // install handlers
                view.on('scan_shareable', function(shareable) {
                    console.trace('app trigger scan_shareable id='
                        + shareable.get('id'));
                    app.session.shareables.add(shareable);
                    shareable = app.session.shareables.findWhere({
                        id : shareable.get('id')
                    });
                    app.workspace.navigate('#/reservation/' + shareable.cid, {
                        trigger : true
                    });
                });
                view.on('scan_fail', function(error) {
                    navigator.notification.confirm(error, function() {
                        window.history.back();
                    }, 'verification failed', 'OK');
                });
                // show view
                viewManager.changePage('#page').show(view);
            },
            // settings
            settings : function() {
                if (app.session.auth.user.isAnonymous()) {
                    app.forceLogin("first");
                    return;
                }
                console.trace('app trigger route settings');
                var view = viewManager.create(views.SettingsDialog, {
                    model : app.session.profile
                }, "#page .content");
                view.on('dismissed', function(saved) {
                    view.close();
                    history.back();
                });
                view.on('edit_payments', function(saved) {
                    view.close();
                    app.workspace.navigate('#payments', {
                        trigger : true
                    });
                });
                viewManager.changePage('#page').show(view);
            },
            // payments
            payments : function() {
                console.trace('app trigger route payments');
                var view = viewManager.create(views.PaymentsDialog, {
                    model : app.session.profile
                }, "#page .content");
                view.on('dismissed', function(saved) {
                    view.close();
                    app.workspace.navigate('#settings', {
                        trigger : true
                    });
                });
                viewManager.changePage('#page').show(view);
            },
            // customer vote
            customerVote : function() {
                console.trace('app trigger route customervote');
                // process push notifications
                var messages = app.session.messages['#customervote'];
                if (messages && messages.length) {
                    var latest = messages.pop();
                    app.session.itinerary_ref = latest.data.reference;
                };
                // get the itinerary according to the stored ref
                var itinerary = new models.Itinerary({
                    ref : app.session.itinerary_ref
                });
                // build the polls to use for this voting
                var poll = new models.Polls.Poll({
                    reference : "customer-vote"
                });
                var polls = new models.Polls.Poll.objects();
                polls.add(poll);
                var result = itinerary.fetch();
                result
                    .done(function(stops) {
                        var view = viewManager.create(views.CustomerVoteView, {
                            polls : polls,
                            itinerary : itinerary,
                        }, '#page .content');
                        // install handlers
                        view
                            .on('vote_success', function(vote) {
                                navigator.notification
                                    .confirm(settings.texts['thanks_customervote'], function() {
                                        app.workspace.navigate('#search', {
                                            trigger : true
                                        });
                                    }, 'Danke', 'OK');
                            });
                        view.on('vote_cancelled', function(vote) {
                            app.workspace.navigate('#search', {
                                trigger : true
                            });
                        });
                        viewManager.changePage('#page').show(view);
                    })
                    .fail(function() {
                        navigator.notification
                            .confirm("Sie haben noch keine Reise gewählt", function() {
                                app.workspace.navigate('#search', {
                                    trigger : true
                                });
                            }, 'Reise wählen', 'OK');
                    });
            },
            // staff vote
            staffVote : function() {
                console.trace('app trigger route staffvote');
                if (!app.session.service) {
                    // no service set, get one first...
                    navigate('#staffservice');
                    return;
                }
                // get itinerary and availability
                var itinerary = new models.Itinerary({
                    ref : app.session.service.get('ref')
                });
                app.progress.show();
                // get the stations
                $
                    .when(itinerary.fetch(), app.session.service.getStops(), itinerary
                        .getAvailability({
                            counts : 1
                        }))
                    .done(function() {
                        // get staff feedback ...
                        app.requestItineraryNotification(itinerary, {
                            title : 'cleverpendeln',
                            message : 'Wie sind die Wagen ausgelastet?',
                            href : '#staffvote',
                            at : moment(itinerary.get('origin').departure)
                                .add(2, 'minutes').toDate(),
                        });
                        // get polls -- we have one poll per each section
                        try {
                            var sections = itinerary.related.availability
                                .get('sections')[0].details;
                        } catch (e) {
                            alert("Keine Formationsdaten.");
                            navigate('#staffservice');
                        }
                        app.session.polls.reset();
                        _.each(sections, function(s) {
                            app.session.polls.add(new models.Polls.Poll({
                                reference : 'staff-vote'
                            }));
                        });
                        // show voting view
                        var view = viewManager.create(views.StaffVoteView, {
                            polls : app.session.polls,
                            stops : app.session.service.related.stops,
                            sections : sections,
                            itinerary : itinerary,
                        }, '#page .content');
                        // install handlers
                        view.on('vote_success', function(polls) {
                            // reset app service to force a new selection
                            app.session.service = null;
                            app.workspace.navigate('#staffservice', {
                                trigger : true
                            });
                        });
                        viewManager.changePage('#page').show(view);
                        app.progress.hide();
                    })
                    .fail(function() {
                        alert('Daten konnten nicht geladen werden. Bitte später erneut versuchen.');
                        app.progress.hide();
                    });
            },
            // staff service
            staffService : function() {
                console.trace('app trigger route staffservice');
                var view = viewManager.create(views.StaffServiceView, {
                    collection : app.session.services,
                }, '#page .content');
                view.on('service_selected', function(service) {
                    console.debug('service selected {0}'.format([service
                        .get('service_key')]));
                    // store service for later use (e.g. #staffvote)
                    app.session.service = service;
                });
                viewManager.changePage('#page').show(view);
            },
            stats : function() {
                console.trace('app trigger route stats');
                var view = viewManager.create(views.StatsView, {
                    stations : ['ZUE', 'ZUG'],
                }, '#page .content');
                viewManager.changePage('#page').show(view);
            },
            // signup
            signup : function() {
                console.trace('app trigger route signup');
                var view = viewManager.create(views.SignupView, {
                    model : new models.Signup()
                }, '#signup .content');
                // install handlers
                view.on('signup_success', function(signup, password) {
                    // auto login and app restart
                    util.storage.set('username', signup.get('username'));
                    util.storage.set('password', password);
                    app.start();
                });
                view.on('anon_login', function() {
                    app.loginAnon(true);
                });
                view
                    .on('signup_failed', function(signup) {
                        // make sure we're actually no longer authenticated in
                        // this case! (e.g. when trying to transition from
                        // anonymous to signed up -- user can always go back
                        // to anonymous if this happens.
                        app.session.auth.logout();
                        var options = {
                            el : '#password-dialog',
                            title : signup.get('email'),
                            text : 'Bitte Passwort eingeben ({link})',
                            linkText : 'unbekannt?',
                        };
                        var dialog = viewManager
                            .create(views.PasswordDialog, options, '#modal-dialog');
                        viewManager.showSubview(dialog);
                        dialog.on('actionOk', function(password) {
                            app.session.username = signup.get('username');
                            app.session.password = password;
                            util.storage
                                .set('username', signup.get('username'));
                            util.storage.set('password', password);
                            dialog.hide();
                            dialog.close();
                            setTimeout(function() {
                                app.start();
                            }, 500);
                        });
                        dialog.on('actionCancel', function() {
                            dialog.hide();
                            dialog.close();
                        });
                        dialog.on('actionReset', function() {
                            dialog.hide();
                            dialog.close();
                            // TODO implement proper password reset dialog
                            window.location = "{0}/accounts/password/reset/"
                                .format([settings.apiUrl]);
                        });
                    });
                // show view
                viewManager.changePage('#signup').show(view);
            },
            favorites : function() {
                var favorites = util.storage.get('favorites') || [];
                var dialog = new views.FavoritesDialog({
                    favorites : favorites
                });
                dialog.render();
                dialog.show();
                dialog.on('favorite_selected', function(value) {
                    console.debug('favorite selected: ' + value);
                    window.history.back();
                    // peform the actual search
                    var options = {
                        origin : value.origin,
                        destination : value.destination,
                        byname : 0
                    };
                    app.progress.show();
                    var result = app.session.connections.findSchedule(options);
                    result.done(function() {
                        // FIXME triggers searchresults twice -- once for
                        // previous display, once for the new display
                        // we should dismiss the previous view and launch
                        // searchresults only once. viewmanager needs a
                        // dismiss() method
                        if (window.location.hash == '#searchresults') {
                            window.history.back();
                        }
                        setTimeout(function() {
                            app.workspace.navigate("#searchresults", {
                                trigger : true
                            });
                        }, 500);
                    });
                    result.always(function() {
                        app.progress.hide();
                    });
                });
                dialog.on('favorite_cancelled', function() {
                    console.debug('favorite cancelled');
                    window.history.back();
                });

            },
            // login
            login : function() {
                console.trace('app trigger route login');
                var view = viewManager.create(views.LoginView, {
                    model : app.session.auth
                }, '#signup .content');
                // install handlers
                view.on('login_success', function(user) {
                    util.storage.set('username', app.session.auth
                        .get('username'));
                    util.storage.set('password', app.session.auth
                        .get('password'));
                    app.start();
                });
                view.on('login_failed', function() {
                    navigator.notification
                        .confirm("user login failed", function() {
                        }, 'Please login', 'OK');
                });
                // show view
                viewManager.changePage('#signup').show(view);
            },
            // logout
            logout : function() {
                console.trace('app trigger route logout');
                if (app.session.authenticated()) {
                    app.session.auth.logout();
                    // reset auth storage so later use
                    // will have to log in again
                    // FIXME use oauth2
                    util.storage.del('username');
                    util.storage.del('password');
                };
                navigate("#login");
            },
            // auto login
            autologin : function() {
                // FIXME use oauth2 token
                var username = util.storage.get('username');
                var password = util.storage.get('password');
                if (username && password) {
                    app.progress.show();
                    var auth = app.session.auth;
                    var result = auth.login(username, password);
                    result.done(function(user) {
                        if (user.isAnonymous()) {
                            util.trace("anonymous detected -- logging out ");
                            auth.logout();
                            navigate("#signup");
                        } else {
                            util.trace("user auto-logged in: "
                                + user.get('username'), function() {
                            });
                            app.start();
                        }
                    });
                    result.fail(function() {
                        navigator.notification
                            .confirm("auto-login failed for {0}"
                                .format([username]), function() {
                            }, 'Please login or register', 'OK');
                        navigate("#signup");
                    });
                    result.always(function() {
                        app.progress.hide();
                    });
                } else {
                    navigate("#signup");
                }
            },
            // feedback
            feedback : function() {
                console.trace('app trigger route feedback');
                var poll = new models.Polls.Poll({
                    reference : '{0}app-feedback'.format([app.settings.variant
                        || '']),
                });
                var view = viewManager.create(views.FeedbackView, {
                    poll : poll
                }, '#page .content');
                // install handlers
                view.on('feedback_submitted', function(user) {
                    navigator.notification.confirm("Danke!", function() {
                        window.history.back();
                    }, 'Danke für Ihre Rückmeldung', 'OK');
                });
                view.on('feedback_cancelled', function(user) {
                    window.history.back();
                });
                viewManager.changePage('#page').show(view);
            },
            // seat selection
            seatSelection : function(id) {
                console.trace('app trigger route seats');
                var itry = app.session.connections.get(id);
                itry.availability().done(function(availability) {
                    var view = viewManager.create(views.SeatSelectionView, {
                        user : app.session.auth,
                        service : app.session.service,
                        availability : availability,
                    }, '#page .content');
                    // install handlers
                    view.on('section_selected', function(section) {
                        // store the selected section
                        itry.set('booking_section', section);
                        app.confirmReservation(new $B.Collection([itry]));
                    });
                    view.on('cancelled', function() {
                        window.history.back();
                    });
                    viewManager.changePage('#page').show(view);
                });
            },
        });
    var workspace = new Workspace();
    // setup app
    var app = {
        /**
         * @memberOf app
         */
        settings : settings,
        session : _session,
        workspace : workspace,
        util : util,
        // innitialize the bare minimum -- a simple constructur for app
        // will call start() to do the actual startup code. Note that
        // initialize should only be called once for each session,
        // start() can be called as many times as needed.
        initialize : function() {
            // reset the app's user credentials?
            if (this.settings.reset) {
                util.storage.del('username');
                util.storage.del('password');
            }
            // called on every page change
            this.on('page_changed', function(selector) {
                app.startTimeUpdate();
            });
            // get a default progress handler
            // so you can do app.progress.show(); .hide() anywhere
            this.progress = util.progress('body');
            // install activity tracker
            util.activityTracker.setup();
            // disable touchmove event dragging the whole document
            document.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, false);
            // start the app
            try {
                Backbone.history.start();
            } catch (e) {
                // we ignore the "already started error", we get what we want
            } finally {
                util.updateAppSettings();
                this.startTimeUpdate();
                this.start();
            }
        },
        /**
         * start the app. this performs login and calls startup tasks
         */
        start : function() {
            var self = this;
            console.debug('app started');
            // see if we should autlogin
            var startup = $.Deferred();
            if (app.settings.devmode) {
                // development mode, take some shortcuts
                self.devStartup().done(function() {
                    app.settings.main_view = app.settings.dev_main_view
                        || app.settings.main_view;
                    startup.resolve();
                });
            } else if (!app.session.authenticated()) {
                // user login, not yet authenticated
                // this will call app.start() again once done
                // which takes us to the else clause
                navigate("#autologin");
                return;
            } else {
                // authenticate, and user login
                startup.resolve();
            }
            // note we only get here once authenticated
            // either as anonymous user (dev mode) or authenticated
            // user. from here on we have the same code for both
            // devmode and user
            startup.done(function() {
                // render top menu HTML (this will not actually display
                // something,
                // but add the variant-specific menu items)
                self.progress.show();
                self.loadResources().done(function() {
                    // normal startup
                    // -- start app
                    navigate(app.settings.main_view);
                    // process notificationss
                    app.enableAppNotifications();
                    AppNotification.deliverMessages(true);
                    self.progress.hide();
                });
            });
            setTimeout(function() {
                if (startup.state() == "pending") {
                    alert(app.settings.texts["startup_failure"]);
                }
            }, app.settings.maxStartupTime || 1000);
        },
        /**
         * loads resources
         * 
         * returns a promise
         */
        loadResources : function() {
            var loader = null;
            if (app.settings.variant == 'staff') {
                // load staff specific start up code
                loader = $.when(app.discoverDriversService(), app
                    .loadUserProfile());
            } else {
                // load customer specific start up code
                // also available: app.discoverServices()
                loader = $.when(app.loadUserProfile());
            }
            console.debug('user is anonymous {0}'.format([app.session.auth.user
                .isAnonymous()]));
            if (window.TestFairy) {
                TestFairy.setCorrelationId(app.session.auth.user
                    .get('username'));
            }
            // present feedback dialog if requested
            if (this.feedback_requested()) {
                setTimeout(function() {
                    navigate("#feedback");
                }, 1000);
            }
            return loader;
        },
        devStartup : function() {
            return this.loginAnon(false);
        },
        feedback_requested : function() {
            // FIXME this must be set according to the
            // timer or push notification that we received
            // from the OS
            return false;
        },
        /**
         * suboptimal implementation of menu rendering. should be improved to
         * get menus from some external text / json file TODO externalize menu
         * definition
         */
        renderMenu : function() {
            var menu = [];
            var vm = viewManager;
            if (settings.variant == "customer") {
                menu.push(vm.menuItem("#home", "Home", "fa fa-bars"));
                menu.push(vm
                    .menuItem("#bookings", "My tickets", "fa fa-list-alt"));
                menu.push(vm.menuItem("#settings", "Settings", "fa fa-cog"));
            };
            if (settings.variant == "staff") {
                menu.push(vm.menuItem("#home", "Home", "fa fa-bars"));
                menu
                    .push(vm
                        .menuItem("#passengers", "Scanned Tickets", "fa fa-list-alt"));
                menu.push(vm.menuItem("#settings", "Settings", "fa fa-cog"));
            };
            viewManager.renderMenu("#top_menu", menu, templates.top_menu_html);
        },

        /**
         * force user signup/login
         * 
         * @param reason
         *            the text reason, must match string "Please login ..."
         */
        forceLogin : function(reason) {
            navigator.notification
                .confirm('Please login {0}'.format([reason]), function(c) {
                    if (c == 1) {
                        navigate("#signup");
                    } else {
                        // no action, simply continue
                    }
                }, 'Login', 'Continue,Cancel');
        },
        loadUserProfile : function() {
            app.session.profile.qryFilter('username', app.session.auth
                .get('username'));
            var result = app.session.profile.fetch();
            result.done(function() {
                console.log(app.session.profile);
            });
            return result;
        },
        /**
         * update current date time update every so often
         * 
         * @param selector
         *            the DOM selector where to insert
         * @param seconds
         *            number of seconds between updates, defaults to 60
         */
        startTimeUpdate : function() {
            util.startTimeUpdate(".date_time_txt p", 60);
        },
        /**
         * find the current service that the user is logged in (as a driver)
         * this will store the current service in app.session.service
         * 
         * @returns a $.Deferred to resolve to a ItineraryService instance
         */
        discoverDriversService : function() {
            // query services in relation to current user
            var limit = app.settings.limit_staff_services || 5;
            var currentService = app.session.services
                .currentService(app.session.auth.user, limit);
            // if a service was found, reset the session's
            // passenger list collection to prepare it for
            // later
            currentService.done(function(service) {
                app.session.service = service;
            });
            return currentService;
        },
        /**
         * find future services
         * 
         * @returns a $.Deferred to resolve to a ItineraryService collection
         *          instance
         */
        discoverServices : function() {
            // query all services in scope for this staff user
            var userServices = app.session.services
                .userServices(app.session.auth.user, true);
            // if services were found, reset the app's
            userServices.done(function(services) {
                app.session.services = services;
            });
            return userServices;
        },
        /**
         * get a list of passengers.
         * 
         * @returns a $.Deferred to resolve to a collection of
         *          ItineraryPassenger objectss
         */
        getPassengerList : function() {
            if (!app.session.service) {
                // we don't have a service currently, return an empty
                // passenger list or fail?
                alert("no service known for this user");
                var pax = $.Deferred();
                pax.resolve(new models.ItineraryService.objects());
                return pax;
            } else {
                return app.session.service.passengers();
            }
        },
        /**
         * FIXME relate to actual shareable's scancodes/beacons simple hack to
         * demonstrate iBeacons
         */
        setupBeacons : function() {
            models.Scancode
                .setup("Near", this.onBeaconRanged, this.isBeaconEnabled);
            // get beacon list. this is taken straight from
            // http://panel.kontakt.io/venue/481ee6e8-b1aa-40b3-9af0-24e7676e2c60
            var BEACON_UUID = "f7826da6-4fa2-4e98-8024-bc5b71e0893e"
                .toUpperCase();
            var BEACONS = [{
                major : 22650,
                minor : 53461
            }, {
                major : 37362,
                minor : 46166
            }, {
                major : 4464,
                minor : 46131
            }];
            // take all available beacons and assign to the shareables
            // we know. In a real application the beacon uuid, major,
            // minor
            // will come as an attribute to the shareable.
            for ( var i in BEACONS) {
                var major = BEACONS[i].major;
                var minor = BEACONS[i].minor;
                // create Beacons with monitoring
                models.Scancode
                    .createBeacon("wagon-{0}".format([i]), major, minor, BEACON_UUID);
            }
        },
        /**
         * create the payment processor according to the app's default settings
         * or the user's preferences. This approach allows to dynamically inject
         * the payment processor at run-time and even change it on the whim of
         * the the user's preferences.
         * 
         * TODO implement user's payment preferences.
         * 
         * @return a $.Deferred that resolves to the payment processor
         */
        getPaymentProcessor : function() {
            var result = new $.Deferred();
            require([app.settings.paymentConfig.processorModule], function(PaymentProcessor) {
                var processor = new PaymentProcessor(app.settings.paymentConfig);
                result.resolve(processor);
            });
            return result;
        },
        /**
         * book selected itineraries. expects a Collection of 'to' and 'return'
         * itineraries, i.e. itries.findWhere({ journey : 'to' | 'from });
         * 
         * Process is as follows:
         * 
         * <pre>
         * 1. create a reservation
         * 2. retreive the respective order
         * 3. call app.processOrderPayment()
         * </pre>
         * 
         * TODO refactor to a separate model that deals with all the
         * complexities
         * 
         * @param itries
         *            list of itinearies to book
         */
        bookItineraries : function(itries, awaitOrder) {
            if (app.session.auth.user.isAnonymous()) {
                app.forceLogin("to book");
                return;
            }
            // perform the actual booking. there will be two
            // bookings, one for the to, one for the return journey
            var toItry = itries.findWhere({
                'journey' : 'to'
            });
            var returnItry = itries.findWhere({
                'journey' : 'return'
            });
            console.debug('=> itry ref: {0}'.format([toItry
                ? toItry.get('ref')
                : "(none)"]));
            console.debug('<= itry ref: {0}'.format([returnItry ? returnItry
                .get('ref') : "(none)"]));
            // -- perform booking "to"
            // get a deferred object that will only resolve
            // once the booking is done
            var bookingResults = $.Deferred();
            var toReservationResult = toItry.book({
                'pax_count' : 1,
                'section' : toItry.get('booking_section').code,
            });
            // we need to get the booking_col to book the
            // second booking on the same order, which is why we wait
            // for toReservationResult to return
            toReservationResult.done(function(reservation) {
                var booking_col = reservation.get('booking_col');
                console.debug("=> booking col {0}".format([booking_col]));
                if (returnItry) {
                    // -- perform booking "from"
                    var returnReservationResult = returnItry.book({
                        'pax_count' : 1,
                        'section' : 'A',
                        'booking_col' : booking_col,
                    });
                    // since we have two reservations, create
                    // a joint promise from both, as we want to create one
                    // order for both
                    returnReservationResult.done(function() {
                        bookingResults.resolve(booking_col);
                    });
                } else {
                    bookingResults.resolve(booking_col);
                }
            });
            // if we don't expect an order, don't wait for it
            // (e.g. free/non-payment apps)
            if (!awaitOrder)
                return bookingResults.promise();
            // only get the payment once all reservations have
            // completed. done() receives the booking_col which
            // we can use to get the order. The booking_col is
            // the shop's client_reference.
            bookingResults.done(function(booking_col) {
                // quick hack to poll for the booking ref
                var wait = 5;
                var poll = function() {
                    if (!wait) {
                        alert('could not get order');
                        return;
                    }
                    wait--;
                    console.log('querying...');
                    // the order is created by the server, get it.
                    var orders = app.session.shopOrders
                        .qryFilter('booking_reference', booking_col);
                    var results = orders.fetch();
                    results.done(function() {
                        console.log(orders.first());
                        if (orders.length > 0
                        // process payment if there was an order
                        && orders.first().get('order_reference')) {
                            app.processOrderPayment(orders.first());
                        } else {
                            // ??
                            setTimeout(poll, 1000);
                        }
                    });
                    results.fail(function() {
                        setTimeout(poll, 1000);
                    });
                };
                /* poll */
                setTimeout(poll, 1000);
            });
            bookingResults.fail(function() {
                alert("one or both reservations failed to book.");
            });
            return bookingResults.promise();
        },
        /**
         * Given an itinerary get user's booking confirmation
         * 
         * ask user's confirmation, if yes, book, if not return without further
         * action. if ok, continue to the detail display.
         * 
         */
        confirmReservation : function(itries) {
            var result = $.Deferred();
            var itry = itries.at(0);
            var destination = itry.get('destination');
            var origin = itry.get('origin');
            var message = '{origin} - {destination} {departure} - {arrival}<br> Sektor {sector}'
                .format({
                    origin : origin.info.station_sign
                        || origin.info.timetable_city,
                    destination : destination.info.station_sign
                        || destination.info.timetable_city,
                    departure : moment(origin.departure).format('HH.mm'),
                    arrival : moment(destination.arrival).format('HH.mm'),
                    sector : itry.get('booking_section').label || '',
                });
            navigator.notification
                .confirm(message, function(s) {
                    console.debug('button {0}'.format([s]));
                    if (s == 1) {
                        // book, don't wait for an order to return
                        app.bookItineraries(itries, false);
                        // get service details
                        var service_key = itry.get('sections')[0].service_key;
                        var result2 = app.session.services.clearQryFilter()
                            .qryFilter('service_key', service_key).fetch();
                        result2
                            .done(function() {
                                app.session.service = app.session.services
                                    .at(0);
                                app.workspace
                                    .navigate('#itinerary/' + itry.cid, {
                                        trigger : true
                                    });
                                result.resolve(itry);
                            })
                            .fail(function() {
                                alert("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
                                result.reject(itry);
                            });
                    } else {
                        result.reject(itry);
                    }
                }, 'Sie fahren Richtung', 'OK,&Auml;ndern');
            result
                .done(function(itry) {
                    var message = "Gute Reise!" + //
                    " Bitte bewerten Sie die Platzverhältnisse nach Beginn der Reise.";
                    navigator.notification.confirm(message, function(s) {
                        // TODO maybe
                        // better to go into #itinerary.cid with a parameter
                        // to have it show "your journey" instead of
                        // asking "to book this one"
                        app.workspace.navigate('#customervote', {
                            trigger : true
                        });
                    }, "Danke für Ihre Teilnahme", "OK");
                    app.requestItineraryNotification(itry);
                });
            return result.promise();
        },
        /**
         * process payment of order
         * 
         * @param order
         */
        processOrderPayment : function(order) {
            // checkout to process the payment
            app
                .getPaymentProcessor()
                .done(function(processor) {
                    // initiate payment
                    var orderResult = order.checkout(processor);
                    // on successful payment
                    // -- on success, navigate to tickets
                    var confirmCallback = function(confirm) {
                        app.workspace.navigate('#bookings', {
                            trigger : true
                        });
                    };
                    var cancelCallback = function(confirm) {
                        app.workspace.navigate('#search-results', {
                            trigger : true
                        });
                    };
                    orderResult
                        .done(function(data) {
                            console.log(data);
                            var payment = new models.Payment({
                                'order_id' : order.get('id'),
                                'method' : 'paypal-rest-single',
                                'authorization' : data.authorization,
                            });
                            payment.save();
                            navigator.notification
                                .confirm("Thank you", confirmCallback, 'Thank you', 'continue');
                        });
                    // orderResult.done()
                    // -- on failed payment, say so, cancel
                    orderResult
                        .fail(function() {
                            navigator.notification
                                .confirm('Payment was not successful', cancelCallback, "We're sorry", 'continue');
                        });
                    // orderResult.fail()
                });
            // getPaymentProcessor.done()
        },
        /**
         * determine beacon enablement in this state of the application
         */
        isBeaconEnabled : function(beacon) {
            return window.location.href.match("reservation")
                && app.sectorSelected;
        },
        loginAnon : function(restart) {
            var auth = app.session.auth;
            var username = settings.anonymousUser;
            var password = settings.anonymousKey;
            app.progress.show();
            var result = auth.login(username, password);
            result
                .done(function(user) {
                    util.storage.set('username', username);
                    util.storage.set('password', password);
                    util
                        .trace("user auto-logged in: " + user.get('username'), function() {
                        });
                    if (restart) {
                        app.progress.hide();
                        app.start();
                    }
                });
            result.fail(function() {
                navigator.notification.confirm("anonymous login failed for {0}"
                    .format([username]), function() {
                }, 'Please login', 'OK');
                navigate("#signup");
            });
            result.always(function() {
                app.progress.hide();
            });
            return result;
        },
        /**
         * process the event of a beacon in range
         * 
         * @param {Object}
         *            beacon
         */
        onBeaconRanged : function(beacon) {
            navigate("#feedback");
        },
        /**
         * enable notifications
         */
        enableAppNotifications : function() {
            models.AppNotification.register();
            models.AppNotification.on('notify', function(msg) {
                if (msg.data.href) {
                    // store messages that trigger hrefs
                    if (!app.session.messages[msg.data.href]) {
                        app.session.messages[msg.data.href] = [];
                    }
                    app.session.messages[msg.data.href].push(msg);
                    navigate(msg.data.href);
                } else {
                    alert(msg.text);
                };
            });
        },
        /**
         * request to be notified on itinerary date / time
         * 
         * this requests a local notification on the date/time of the itinerary
         * start. since we want people's feedback we will do this not on the
         * very date/time, but some 10 minutes later.
         * 
         * also we only do this if enabled in
         * settings.localItineraryNotifcation. This allows us to switch easily
         * to server-induced notification later on.
         */
        requestItineraryNotification : function(itry, options) {
            options = options || {
                message : 'Wie voll ist Ihr Wagen?',
                title : 'Umfrage cleverpendeln',
                href : '#customervote',
            };
            if (settings.webapp || settings.notifySoon) {
                options.at = moment(new Date()).add(10, 'seconds').toDate();
            } else {
                var notifyTime = moment(itry.get('origin').departure)
                    .add(10, 'minutes').toDate();
                options.at = options.at || notifyTime;
            }
            if (!settings.localItineraryNotification) {
                return;
            }
            AppNotification.schedule(options.message, {
                data : {
                    href : options.href,
                    reference : itry.get('ref')
                },
                title : options.title,
                at : options.at,
            });
        },
        /**
         * add current itry to favorites
         */
        addFavorite : function(itry) {
            var favorites = util.storage.get('favorites') || [];
            var getLatLon = function(position) {
                return '{lat},{lon}'.format(position);
            };
            var getStation = function(info) {
                return info.station_sign || info.timetable_city;
            };
            favorites
                .push({
                    origin : getLatLon(itry.get('origin').address.position),
                    destination : getLatLon(itry.get('destination').address.position),
                    text : '{0} - {1}'.format([
                        getStation(itry.get('origin').info),
                        getStation(itry.get('destination').info)])
                });
            favorites = _
                .uniq(_.sortBy(favorites, 'text'), true, function(item) {
                    return item.text;
                });
            util.storage.set('favorites', favorites);
        },
        /**
         * direct service display (for developer testing)
         * 
         * set the target as
         * 
         * #staffservice #searchresults #itinerary #seats #customervote
         */
        directDisplay : function(target) {
            if (target == '#search') {
                navigate(target);
                return;
            }
            app.discoverServices().done(function() {
                if (target == '#staffservice') {
                    navigate(target);
                    return;
                }
                var options = {
                    origin : '47.050170,8.310170',
                    destination : '47.378177,8.540192',
                    byname : 0
                };
                var result = app.session.connections.findSchedule(options);
                result.done(function() {
                    if (target == "#searchresults") {
                        navigate(target);
                        return;
                    }
                    var itry = app.session.connections.at(0);
                    app.session.itinerary_ref = itry.get('ref');
                    if (target == "#seats") {
                        var avail = itry.availability({
                            optimized : 1
                        }).done(function() {
                            navigate('{0}/{1}'.format([target, itry.cid]));
                        });
                        return;
                    }
                    var service_key = itry.get('sections')[0].service_key;
                    var result2 = app.session.services.clearQryFilter()
                        .qryFilter('service_key', service_key).fetch();
                    result2.done(function() {
                        app.session.service = app.session.services.at(0);
                        if (target == '#customervote') {
                            navigate(target);
                            return;
                        }
                        if (target == '#itinerary') {
                            navigate('#itinerary/' + itry.cid);
                            return;
                        }
                    });
                });
            });
        }
    };
    // install event handlers on app object
    _.extend(app, $B.Events);
    // install global app object
    window.app = app;
    window.navigate = util.navigate;
    return app;
});
