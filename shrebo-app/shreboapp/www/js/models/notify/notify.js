define(['jquery', 'backbone', 'settings'], function($, $B, settings) {
    /**
     * push & local notification handler and client to /notify API
     *
     * installs window.AppNotification as a singleton notification handler
     * supports both push notifications and local notifications from
     * one single interface
     *
     * Usage
     *
     * 1. Register your device with APN / CGM (depends on device.platform)
     *
     * <pre>
     * var result = window.AppNotification.register();
     * result.done(function(token) {
     *     // token will already have been registerd with
     *     // the server API
     * });
     *
     * 1b. If you don't receive local notifications on coldstart (user
     *     clicked on notfication to start application), register an
     *     early on click handler for the local notification plugin:
     *
     * <pre>
     *  document.addEventListener('deviceready', function() {
     *    console.log('registering startup click handler for local notifications');
     *    window._startupNotifications = [];
     *    cordova.plugins.AppNotification.local.on('click', function(notification) {
     *      if(window._startupNotifications) {
     *        console.log('queuing startup notification');
     *        window._startupNotifications.push(notification);
     *      }
     *     });
     *  }, false);
     * </pre>
     *
     * 2. Start receiving messages
     *
     * window.AppNotification.on('notify', function(message, foreground) {
     *     // foreground is True if the alert was received in foreground
     *     // message.txt contains the alert message on iOS
     *     // and payload.message on Android
     *     // message.sound contains the sound file that was played
     *     // on reception
     * });
     *
     * 3. On wakeup of your app, ask to deliver background messages
     *
     * // deliver background messages (only do once on('notify') has been
     * // called, and the app is in a ready state to process messages)
     * window.AppNotification.deliverMessages(true);
     *
     * 4. Optionally, use setInterval to process messages at your convenience
     *
     * // check if there are background messages
     * window.AppNotification.deferDelivery = true;
     * window.AppNotification.hasMessages();
     * // deliver
     * window.AppNotification.deliverMessages();
     * </pre>
     *
     * Implementation notes
     *
     * This plugin installs notification handlers for iOS & Android
     * push notifications, as well as local notifications. All notification
     * handlers transform the received notifications into this plugin's
     * canoncial message format:
     *
     * <pre>
     * message = {
     *     text: "some text",
     *     sound: "/path/to/sound.ext",
     *     foreground: true | false,
     *     local: true, | false, // push == false
     *     data : custom data object,
     *     _event: ... //actual event untransformed
     * }
     * </pre>
     *
     * Once transformed, the messages are sent to the NotificationHandler.on('receive') handler,
     * which then decides whether to queue up the message or deliver it immediately. There
     * are 4 cases (details see receive handler). The gist of it is this:
     *
     * * on window.AppNotification, set deferDelivery == false, immediateDelivery = true to
     *   receive all messages immediately, whether foreground or background. This only
     *   works if the app is active and your own on('notify') handler has been installed.
     *   The best is to install the handler then call Notification.deliverMessages(true),
     *   which sets immediateDelivery = true;
     *
     * * set deferDelivery == true to cause all messages to be queued up. Then install
     *   and interval to query Notification.hasMessages() and Notification.deliverMessages()
     *   to get on('notify') called.
     *
     * Using a central receive handler and a canonical message format means that your app
     * can focus on message handling rather than having to deal with the technical details
     * of local or push notifications.
     *
     *
     */
    var NotificationHandler = $B.Model.extend({
        /**
         * @memberOf NotificationHandler
         */
        urlRoot : settings.notifyApiUri + '/register/',
        messages : [],
        // set to true if all messages should be
        // treated as background and queued up. In thise case messages
        // will only be delivered on call to deliverMessages() no
        // matter what. Poll on hasMessages(), then call deliverMessages().
        deferDelivery : false,
        // set to true once on('notify') trigger is installed
        // this will force foreground and background to be
        // delivered immediately, except if deferDelivery == true
        // see on('receive') handler below. If this is false
        // background messages will always be queued even if the
        // app is in foreground when background messages are delivered.
        // That's valid, but you will have
        // to call hasMessages() / deliverMessages() in an interval.
        // Background messages are those queued in the notification
        // panel while the app was in the background or turned off
        // They stay marked as background even if the app becomes
        // online in the mean time (e.g. think multiple background messages
        // received, and the first was processed -- later background
        // messages queue up even though the app is in the foreground now).
        immediateDelivery : false,
        initialize : function(options) {

        },
        registerResult : $.Deferred(),
        /**
         * register device with APNS or google
         */
        register : function() {
            // https://github.com/phonegap-build/PushPlugin#register
            var result = this.registerResult = $.Deferred();
            var platform = device.platform.toLowerCase();
            var errorHandler = function(error) {
                // fail
                console.debug('push device registration error ' + result);
                result.reject(error);
            };
            if (platform == 'android') {
                var successHandler = function(result) {
                    // continue, we'll have onNotification called to register
                    // the token, which will resolve result.
                    console.debug('push device registered ' + result);
                };
                pushNotification.register(successHandler, errorHandler, {
                    // the registration handler is given by "ecb"
                    "senderID" : settings.gcm_sender_id,
                    "ecb" : "onNotification"
                });
            }
            if (platform == 'ios') {
                // the registration handler is given by "ecb"
                pushNotification.register(window.tokenHandler, errorHandler, {
                    "badge" : "true",
                    "sound" : "true",
                    "alert" : "true",
                    "ecb" : "onNotificationAPN"
                });
            }
            return result.promise();
        },
        // only works on iOS
        setAppBadge : function(count) {
            var result = $.Deferred();
            if (device.platform == 'ios') {
                pushNotification.setApplicationIconBadgetNumber(function() {
                    // success
                    result.resolve('ok');
                }, function(error) {
                    // fail
                    result.reject(error);
                }, count);
            } else {
                result.reject('this only works on ios');
            }
            return result.promise();
        },
        /**
         * deliver queued up messages
         *
         * call this to deliver background-received messages
         * only do this once you have registered your handlers
         * with on('notify'). If there are no messages this
         * does nothing.
         *
         * @param setImmediateDelivery  sets immediate delivery to true
         */
        deliverMessages : function(setImmediate) {
            var handler = this;
            if (setImmediate) {
                this.immediateDelivery = true;
            }
            // process local notifications received on startup
            // NOTE: requires an early on('click') handler on
            // the local notifications plugin that stores
            // notifications in window._startupNotifications
            // this is a hack, but it seems to work...
            if (window._startupNotifications) {
                _.each(window._startupNotifications, function(notification) {
                    handler.trigger('notify', handler.transformLocal(notification));
                });
                // stop delivering messages to this queue
                window._startupNotifications = null;
            }
            // process background push notifications
            _.each(this.messages, function(message) {
                handler.trigger('notify', message);
            });
            // clear messages
            this.messages = [];
        },
        /**
         * returns true if there is at least one queued message
         *
         * this checks our local queue as well as the _startupNotifications
         * queue.
         */
        hasMessages : function() {
            return this.messages.length > 0 || (window._startupNotifications && window._startupNotifications.length > 0);
        },
        /**
         * schedule a local or push notification
         *
         * if options.remote is false or not provided, will
         * schedule a local notification.
         *
         * local notifications, see for options:
         * see https://github.com/katzer/cordova-plugin-local-notifications
         */
        schedule : function(message, options) {
            options = options || {};
            if (options.remote) {
                // ask server to schedule a push notification
            } else {
                // schedule locally, which is the default
                // and creates a local notification
                var maxId = _.max(window.localNotification.getIds());
                options.id = _.isFinite(maxId) ? maxId + 1 : 1;
                // make sure we have valid options and
                // a message object (instead of only a string)
                if (_.isString(message)) {
                    message = {
                        title : "Message",
                        text : message,
                        sound : "file://sounds/message.mp3",
                        icon : "",
                    };
                }
                message.title = message.title || '';
                message.text = message.text || '';
                message.sound = message.sound || "file://sounds/message.mp3";
                message.icon = message.icon || '';
                _.extend(message, options);
                // hotfix https://github.com/katzer/cordova-plugin-local-notifications/issues/526
                // can't resolve for iOS 7.x without some heavy testing. 
                if(device.platform.toLowerCase() == 'ios' && parseFloat(device.version) < 8) {
                    return;
                }
                window.localNotification.schedule(message);
            }
        },
        /**
         * register device with server
         */
        registerDevice : function(token) {
            window.AppNotification.set('token', token);
            window.AppNotification.set('type', device.platform);
            window.AppNotification.save();
            window.AppNotification.registerResult.resolve(token);
        },
        /**
         * receive handler to enable queue up of background messages
         *
         * this is called for both iOS and Android, background and foreground
         * messages. If the handler has deferDelivery==true or the
         * messages were received in background, the messages are queued
         * up for later delivery by handler.deliverMessages(). Note that
         * if the handler has immediateDelivery == true &  deferDelivery == false,
         * even background messages will not be queued. See rationale on
         * immediateDelivery in definition of NotificationHandler.
         */
        receiveMessage : function(message) {
            var handler = window.AppNotification;
            // cases
            //    deferDelivery == true => queue
            //    foreground == '0' && !immediateDelivery => queue
            //    foreground == '0' && immediateDelivery => deliver
            //    foreground == '1' && !deferDelivery => deliver
            //    foreground == '1' && deferDeliery = queue (which is the first case)
            var shouldQueue = false;
            switch(true) {
            case (handler.deferDelivery) :
                shouldQueue = true;
                break;
            case (message.foreground == '0' && !handler.immediateDelivery) :
                shouldQueue = true;
                break;
            case (message.foreground == '0' && handler.immediateDelivery) :
                shouldQueue = false;
                break;
            case (message.foreground == '1' && !handler.deferDelivery) :
                shouldQueue = false;
                break;
            default:
                // play safe, no messages are lost this way
                shouldQueue = !handler.immediateDelivery;
            }
            if (shouldQueue) {
                console.debug('push queue message for later delivery');
                handler.messages.push(message);
            } else {
                console.debug('push notify foreground');
                // deliver foreground notifications immediately
                handler.trigger('notify', message);
            }
        },
        /**
         * create canonical message from local notification
         */
        transformLocalEvent : function(notification) {
            console.debug('local notification event received ' + notification.text);
            window.AppNotification.trigger('receive', {
                text : notification.text,
                sound : notification.sound,
                foreground : false, /* always assume background for local notifications (?) */
                data : JSON.parse(notification.data) || {},
                local : true,
                _event : notification,
            });
        },
        /**
         * create canonical message from APN event
         */
        transformAPNEvent : function(event) {
            console.debug('push notification received (APN) ' + event.alert);
            window.AppNotification.trigger('receive', {
                text : event.alert,
                sound : event.sound,
                foreground : event.foreground,
                data : JSON.parse(event.data) || {},
                local : false, /* push */
                _event : event,
            }, true);
            if (event.badge) {
                window.AppNotification.setAppBadge(event.badge);
            }
        },
        /**
         * create canonical message from GCM event and handle GCM token
         */
        transformGCMEvent : function(event) {
            console.debug('push notification received (GCM) ' + event.alert);
            var kind = event.event;
            var message = event.message;
            switch(kind) {
            case 'registered' :
                var regid = event.regid;
                // push to server and resolve the register() deferred
                window.AppNotification.registerDevice(regid);
                console.debug('push device registered, id ' + regid);
                break;
            case 'message' :
                var foreground = event.foreground;
                var coldstart = event.coldstart;
                console.debug('push message received (GCM)' + message);
                window.AppNotification.trigger('receive', {
                    text : message,
                    sound : event.soundname || event.payload.sound,
                    data : event.payload.data,
                    foreground : foreground,
                    _event : event,
                    local : false, /* push */
                }, foreground);
                break;
            case 'error' :
                var error = event.msg;
                console.debug('push error ' + error);
                break;
            default:
                console.debug('push notification event received, kind unknown: ' + kind);
            }
        },
        /**
         * APN token handler
         */
        handleAPNToken : function(token) {
            window.AppNotification.registerDevice(token);
            console.debug('push device registered, token ' + token);
        },
    });
    // a dummy notification plugin that does nothing
    var shimNotification = _.extend({}, {
        register : function() {
            console.debug('shim notification register');
        },
        schedule : function(message, options) {
            console.debug('shim notification schedule');
            setTimeout(function() {
                message.foreground = '1';
                AppNotification.trigger('receive', message);
            }, 5000);
        },
        getIds : function() {
            return 0;
        }
    }, $B.Events);
    // create and return singleton
    if (!window.AppNotification) {
        window.AppNotification = new NotificationHandler();
        if (window.plugins) {
            window.pushNotification = window.plugins.pushNotification;
        }
        if (window.cordova && cordova.plugins) {
            window.localNotification = window.cordova.plugins.notification.local;
        }
        window.pushNotification = window.pushNotification || shimNotification;
        window.localNotification = window.localNotification || shimNotification;
    };
    // install global handlers as per the PushPlugin
    // ios notification handler
    window.onNotificationAPN = window.AppNotification.transformAPNEvent;
    // ios registration handler
    window.tokenHandler = window.AppNotification.handleAPNToken;
    // Android registration & notification handler
    window.onNotification = window.AppNotification.transformGCMEvent;
    // local notification handler
    window.localNotification.on('click', window.AppNotification.transformLocalEvent);
    // canonical message handler (triggered by above ios, android, local handlers)
    window.AppNotification.on('receive', window.AppNotification.receiveMessage);
    return window.AppNotification;
});

