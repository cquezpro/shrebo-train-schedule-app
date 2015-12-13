define([], function() {
    var config_local = {
        apiUri : '/api/v1',
        trainApiUri : '/api/train/v1',
        itineraryApiUri : '/api/v1/coach',
        shopApiUri : '/api/v1/shop',
        authApiUri : '/api/v2/auth',
        pollsApiUri : '/api/v1/polls',
        notifyApiUri : '/api/v1/notify',
        apiUrl : 'http://localhost:8000', /* foreman:5000, manage.py: 8000 */
        debug : true,
        reset : true,
        payment : 'paypal',
        devmode : false,
        localItineraryNotification : true,
        notifySoon : true, // notify in a few seconds rather than at app time
    };
    var config_dev = {
        apiUri : '/api/v1',
        trainApiUri : '/api/train/v1',
        itineraryApiUri : '/api/v1/coach',
        shopApiUri : '/api/v1/shop',
        authApiUri : '/api/v2/auth',
        pollsApiUri : '/api/v1/polls',
        notifyApiUri : '/api/v1/notify',
        apiUrl : 'https://cpdev.dockrzone.com', /* foreman:5000, manage.py: 8000 */
        debug : true,
        reset : true,
        devmode : true,
        payment : 'paypal',
        localItineraryNotification : true,
        notifySoon : true, // notify in a few seconds rather than at app time
        maxStartupTime : 5000,
    };
    var config_local_device = {
        apiUri : '/api/v1',
        trainApiUri : '/api/train/v1',
        itineraryApiUri : '/api/v1/coach',
        shopApiUri : '/api/v1/shop',
        authApiUri : '/api/v2/auth',
        pollsApiUri : '/api/v1/polls',
        notifyApiUri : '/api/v1/notify',
        apiUrl : 'https://567f3af0.ngrok.com',
        debug : true,
        reset : true,
        payment : 'paypal',
        devmode : false,
        localItineraryNotification : true,
        notifySoon : true, // notify in a few seconds rather than at app time
        maxStartupTime: 10000,
    };
    var config_test = {
        apiUri : '/api/v1',
        trainApiUri : '/api/train/v1',
        itineraryApiUri : '/api/v1/coach',
        shopApiUri : '/api/v1/shop',
        authApiUri : '/api/v2/auth',
        pollsApiUri : '/api/v1/polls',
        notifyApiUri : '/api/v1/notify',
        apiUrl : 'https://cptest.dockrzone.com',
        debug : true,
        reset : false,
        payment : 'paypal',
        localItineraryNotification : true,
        maxStartupTime: 30000,
    };
    var config_staging = {
        apiUri : '/api/v1',
        trainApiUri : '/api/train/v1',
        itineraryApiUri : '/api/v1/coach',
        shopApiUri : '/api/v1/shop',
        authApiUri : '/api/v2/auth',
        pollsApiUri : '/api/v1/polls',
        notifyApiUri : '/api/v1/notify',
        apiUrl : 'https://cptest.dockrzone.com',
        debug : true,
        reset : false,
        payment : 'paypal',
        localItineraryNotification : true,
        maxStartupTime: 30000,
    };
    var config_deploy = {
        apiUri : '/api/v1',
        trainApiUri : '/api/train/v1',
        itineraryApiUri : '/api/v1/coach',
        shopApiUri : '/api/v1/shop',
        authApiUri : '/api/v2/auth',
        pollsApiUri : '/api/v1/polls',
        notifyApiUri : '/api/v1/notify',
        apiUrl : 'https://cpsbb.herokuapp.com',
        debug : false,
        reset : false,
        payment : 'paypal',
        localItineraryNotification : true,
        maxStartupTime : 60000, // milliseconds
    };

	current=config_deploy;//@Grunt:config

    // ** common settings
    // use css progress indicator. see

    // variant?
	current.variant="customer";//@Grunt:variant
    // util.progress for details
    current.css_progress = true;
    // rest login
    current.reset = false;
    // disable past slots
    current.disablePast = false;
    // use html dialogs
    current.html_dialogs = true;
    // main page?
    current.main_view = "#search";
	current.main_view="#search";//@Grunt:main_view
    if (current.variant == 'customer') {
        current.dev_main_view = '#search';
        // '#seats'; //'#searchresults'; //'#seats';
    }
    // web app? (false = phonegap on device)
    current.webapp = true;
	current.webapp=false;//@Grunt:webapp
    // anonymous user, password?
    current.anonymousUser = "AnonymousUser@shrebo.com";
    current.anonymousKey = "7tzNywbA";
    current.anonymousUser = "info@shrebo.ch";
    current.anonymousKey = "test";
    // android push notifications
    current.gcm_sender_id = '255505428895';
    // voting options.
    // TODO get vote labels from polls api
    current.vote_levels = {
        'low' : '&#60;50%',
        'medium' : '&#62;50%',
        'high' : '99%',
        'overload' : '&uuml;bervoll',
        'elsewhere' : '',
    };
    current.texts = {
        thanks_customervote : "Danke, dass Sie mitmachen! Ihre Mitarbeit hilft uns, genaue Prognosen über die Platzverhältnisse zu erstellen. So erhalten Sie in Zukunft Ihre ganz individuelle Empfehlung.",
        customervote_geopermission : "Möchten Sie, dass wir Ihren aktuellen Standort bei Befragungen ermitteln?",
        startup_failure : "Die Anwendung konnte leider nicht gestartet werden. Bitte schliessen und neu starten.",
        search_info : "Derzeit eingeschr&auml;nkte Auswahl auf<br>Luzern - Z&uuml;rich (morgens), Z&uuml;rich - Luzern (abends)",
    };
    return current;
});
