// configure standard modules
require.config({
    baseUrl : 'js',
    // paths are relative to the location of main.js
    paths : {
        app : 'app',
        settings : 'settings',
        util : 'util',
        jquery : 'libs/jquery-1.10.2.min',
        // jqmobile : 'libs/jquerymobile/jquery.mobile-1.4.2.min',
        jqmobileclarity : 'jqm-clarity-compat',
        jqgallery : 'libs/jquery.gallery',
        modernizr : 'libs/modernizr.custom.53451',
        underscore : 'libs/underscore.min',
        backbone : 'libs/backbone.min',
        text : 'libs/require-text.min',
        tastypie : 'libs/tastypie',
        mobiscroll : 'libs/mobiscroll/js/mobiscroll.custom-2.13.1.min',
        bootstrap : 'libs/bootstrap/bootstrap',
        spin : 'libs/spin.min', // progress bar loader spinner
        scrollto : 'libs/scrollto.min', // on Android scroll up entry fields if
        // hidden by keyboard
        iscroll : 'libs/iscroll', // scrolling support for view content
        datejs : 'libs/datejs/datejs', // datajs
        moment : 'libs/momentjs/moment.min', // momentjs
        momentduration : 'libs/momentjs/moment-duration-format', // moment duration format
        qrcode : 'libs/qrcode/qrcode.min', // qrcode
        nicebuttons : 'libs/jquery.screwdefaultbuttonsV2', // screwdefaultbuttons
        autocomplete : 'libs/jquery.autocomplete', // jq autocomplete
        geocoder : 'libs/geocoder',
    },
    shim : {
        'app' : {
            'deps' : ['backbone', 'jquery', 'mobiscroll', 'util']
        },
        'backbone' : {
            'deps' : ['underscore', 'jquery'],
            'exports' : "Backbone" // attach Backbone to window
        },
        'jquery' : {
            exports : 'jquery'
        },
        'jqgallery' : {
            'deps' : ['jquery', 'modernizr'],
        },
        'mobiscroll' : {
            'deps' : ['jquery'],
            'exports' : 'jQuery.mobiscroll'
        },
        'jqmobile' : {
            'deps' : ['jquery']
        },
        'bootstrap' : {
            'deps' : ['jquery']
        },
        'spin' : {
            'deps' : ['jquery']
        },
        'iscroll' : {
            'exports' : 'IScroll'
        },
        'util' : {
            'deps' : ['jquery']
        },
        'datejs' : {
            'exports' : 'Date'
        },
        'moment' : {
            'exports' : 'moment'
        },
        'momentduration' : {
          deps : ['moment'],  
        },
        'qrcode' : {
            'exports' : 'QRCode'
        },
        'nicebuttons' : {
            'depends' : 'jquery',
            'exports' : 'jQuery.screwDefaultButtons',
        },
        'autocomplete' : {
            'depends' : 'jquery',
            'exports' : 'jquery.autocomplete',
        },
    }
});
// load the app
require([// define dependencies
'tastypie', // tastypie overrides
'jquery', // jquery
'app', // our app
], function(tastypie, $, app) {
    // http://demos.jquerymobile.com/1.4.2/backbone-requirejs/
    $(document).on('mobileinit', function() {
        $.mobile.linkBindingEnabled = false;
        $.mobile.hashListeningEnabled = false;
        $.mobile.ajaxEnabled = false;
        $.mobile.pushStateEnabled = false;
        $.mobile.loader.prototype.options.text = "";
        $.mobile.loader.prototype.options.textVisible = true;
        $.mobile.resetActivePageHeight();
    });
    // log errors to the device console
    window.onerror = function(message, url, lineNumber) {
        console.log("Error: " + message + " in " + url + " at line "
            + lineNumber);
    };

    // simulate phonegap components if they are not there
    if (app.settings.html_dialogs || !navigator.notification) {
        navigator.notification = {};
        navigator.notification.alert = function(message, callback) {
            alert(message);
            callback();
        };
        /**
         * works the same as the phonegap notification.confirm helper
         * 
         * @param message
         *            message to display
         * @param confirmCallback
         *            confirm callback function
         * @param title
         *            title on dialog
         * @param buttonLabels
         *            comma separated string of button labels (don't ask)
         * @see http://cordova.apache.org/docs/en/2.5.0/cordova_notification_notification.md.html
         */
        navigator.notification.confirm = function(message, confirmCallback, title, buttonLabels) {
            var views = require(['views', 'templates'], function(views, templates) {
                var options = {
                    title : title,
                    text : message,
                    buttonLabels : buttonLabels
                };
                var dialog = viewManager
                    .create(views.ConfirmDialog, options, '#modal-dialog');
                dialog.render();
                dialog.on('button-pressed', function(id) {
                    dialog.hide();
                    dialog.close();
                    confirmCallback(id);
                });
                dialog.show();
            });
        };
    }

    function hideAddressBar() {
        window.scrollTo(0, 1);
        setTimeout(function() {
            window.scrollTo(0, 1);
        }, 1000);
        if (/iPhone/i.test(navigator.userAgent)) {
            if (window.StatusBar) {
                // StatusBar plugin
                // https://github.com/phonegap-build/StatusBarPlugin/blob/master/README.md
                window.StatusBar.hide();
            }
            // on iphone (device) we need to push down the content not to hide
            // behind top menu
            document.body.style.height = (window.outerHeight - 44) + 'px';
            $(".footer").css('bottom', '');
            $(".footer").css('top', '50px');
            //$(".content").css('margin-top', '50px');
            // remove from signup screen because it is fullscreen
            $("#signup > .content").css("margin-top", '');
        }
    }

    $(function() {
        hideAddressBar();
    });

    var startup = function() {
        // jqm needs to be loaded & initialized last, otherwise
        // the jqm router interferes with the backbone router
        require([/* 'jqmobile' */], function(jqm) {
            // mobiscroll needs to be loaded after jqmobile
            // note this is not possible using shims
            // as we have a circular dependency
            // app -> mobiscroll -> jqmobile -> app
            // using this approach we simply resolve this as
            // a dependency of app.initialize():
            // app -> jquery, and then
            // app.initialize() -> mobiscroll -> qmobile
            require(['mobiscroll'], function(mobiscroll) {
                setTimeout(function() {
                    app.initialize()
                }, app.settings.splash_delay);
            });
        });

        // mock plugins
        // TODO refactor into some kind of generic mocking module
        if (app.util.isSimulator() || app.settings.webapp) {
            window.cordova = window.cordova || {
                plugins : {}
            };
            window.device = window.device || {
                platform : "web"
            };
            cordova.plugins.barcodeScanner = {
                /**
                 * always simulate a successful scan
                 */
                scan : function(callback) {
                    navigator.notification
                        .confirm("SIMULATION: Select the ticket validity", function(button) {
                            var result = {
                                format : "QR_CODE",
                                text : "RESULT:{0}".format([button == 1
                                    ? "OK"
                                    : "NOK"])
                            };
                            callback(result);
                        }, "Set result", "Valid,Invalid");
                } // scan
            }; // mock object
        } // if
    }; // startup

    /**
     * get updated app settings for next session
     * 
     * note that this is a failsafe way of retrieving new application settings,
     * as the new settings are stored in local storage for the next restart of
     * the app. this makes sure that loading of new settings does not interfere
     * with the current user processing of the app.
     * 
     * use this approach to get the client to use new settings without requiring
     * a new client - such as to update for new servers or other default
     * settings.
     */
    var getAppSettings = function(version) {
        require(['models/appsettings'], function(AppSettings) {
            app.settings.version = version;
            // load somewhat deferred not to interfere with initial
            // application loading or other user actions
            setTimeout(function() {
                var appsettings = new AppSettings();
                appsettings.buildid = version;
                appsettings.fetch().done(function() {
                    console.log('remote settings received');
                    window.localStorage.setItem('appsettings', JSON
                        .stringify(appsettings.get('settings')));
                    window.localStorage.setItem('apppatch', appsettings
                        .get('patch'));
                });
            }, 5000);
        });
    };

    // entrypoint for webapp
    if (app.settings.webapp) {
        console.debug('running as webapp');
        getAppSettings('webapp');
        startup();
    }

    // entrypoint for phonegap
    document.addEventListener('deviceready', function() {
        console.debug('deviceready triggered');
        if (navigator.splashscreen) {
            navigator.splashscreen.hide();
        }
        if (window.TestFairy) {
            TestFairy.init("633d62212313c147722a8770dd89a4f016385616");
        }
        // hack to get a settings update from the server
        cordova.getAppVersion.getVersionNumber().then(function(version) {
            getAppSettings(version);
        });
        startup();
    });
});

