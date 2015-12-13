define(['backbone', 'settings', 'util'], function($B, settings, util) {
    /**
     * Scancode
     *
     * Associates a shareable with a scancode, such as
     * a QR code or iBeacon
     *
     * If there is an iBeacon, it wil be accessible as
     * scancode._beacon.
     */
    var Scancode = $B.Model.extend({
        urlRoot : settings.apiUri + '/scancode/',
        asFilter : 'scancode',

    });
    var objects = $B.Collection.extend({
        model : Scancode,
        url : settings.apiUri + '/scancode/',
        initialize : function() {
            this.filter('owner', function() {
                return window.app.session.auth.user.get('id');
            });
        }
    });
    // use as
    // var results = new Scancode.objects().fetch();
    // results.done(function() {...});
    Scancode.objects = objects;
    /**
     * iBeacon code
     * 
     * To use do:
     * 
     * Scancode.setup("Near", callback, [enabledCallback]);
     * 
     * callback is of type function(beacon), where each beacon
     * will be presented if it is detected and within the 
     * proximity given by setup. 
     * 
     * Upon a beacon comes into range, it will call the callback
     * function, callback(beacon). The beacon has the following
     * attributes:
     * 
     * - proximity
     * - rssi
     * - uuid
     * - major
     * - minor
     * - cid
     * 
     * To register a beacon for ranging detection, you have to: 
     * 
     * Scancode.createBeacon(cid, major, minor, uuid, callbacks);
     * 
     * where callbacks is a dict with two optional entries:
     * 
     *    monitoring : function(beacon)
     *    ranging : function(beacon)
     * 
     * These functions will be called for each ranging and monitoring
     * call respectively. Only ranging calls have proximity, rssi and
     * cid attributes. Note that callbacks is an expert feature. Only
     * use it if you know what you are doing. The default should be
     * to use the setup's callback, which is a ranging callback called
     * by Scancode.beaconRangingCallback after it has done sanity and
     * time span checking.
     * 
     */
    // -- Beacon processing code
    // FIXME refactor to match any kind of scan code
    /**
     * list of known beacons
     * a simple dictionary with each entry as
     * <uuid>-<major>-<minor> : <id>
     * use Scancode.getBeaconAssociation to retrieve
     */
    // simple semaphore
    Scancode.processingBean = false;
    // association of beacons and their application id
    // simple dict of major-minor-uuid = id
    Scancode.beacons = {};
    // Near, Immediate, Far (note first capital letter)
    Scancode.proximity = "Near";
    // default callback does nothing
    Scancode.appCallback = function(beacon) {
    };
    // idle activity time as given by util.noActivityFor()
    // in milliseconds, before the next beacon is processed
    Scancode.idleBeforeBeacon = settings.idleBeforeBeacon || 5000;
    // set the URL where the beacon callbacks will
    // work. Any other URL will not process beacon
    // callbacks.
    // FIXME allow more than one enabling or disabling URL or
    // a function call to determine
    Scancode.isBeaconEnabled = function(beacon) {
        return true;
    };
    /**
     * default activity tracker, basically means there is
     * always activity. override by setup
     */
    Scancode.noActivityFor = function() {
        return 0;
    };
    // setup beacon semantics and callback
    /**
     * Setup beacon processing. This will install
     * the beacon detection and install the callback
     * Callbacks will only be called if idleBeforeBeacon
     * time in ms has passed, as given by util.activityTracker.noActivityFor().
     * This is to slow down beacon callbacks. If you want to receive all beacon
     * ranging events, no matter how often, set this value to -1. By default,
     * settings.idleBeforeBeacon is used, or a default of 5000 ms. 
     */
    Scancode.setup = function(proximity, appCallback, beaconEnabledCallback) {
        // currently only works on iOS real devices
        if(util.isSimulator() || !window.device.platform.match(/iOS/)) return;
        // set parameters, always use existing as the default
        Scancode.appCallback = appCallback || Scancode.appCallback;
        Scancode.proximity = proximity || Scancode.proximity;
        Scancode.isBeaconEnabled = beaconEnabledCallback || Scancode.isBeaconEnabled;
    };
    // iBeacon interfacing code
    /**
     * @param id  the beacon id (=some kind of shareable id)
     * @param major the major number
     * @param major the minor number
     * @param minor the uuid
     * @param callback if provided will be called for monitoring status
     */
    Scancode.createBeacon = function(cid, major, minor, uuid, callback) {
        // currently only works on iOS real devices
        if(util.isSimulator() || !window.device.platform.match(/iOS/)) return;
        // throws an error if the parameters are not valid
        var beacon = new IBeacon.CLBeaconRegion(uuid, major, minor, cid);
        if(!callback) {
            // set default callbacks. That's the preferred way
            callback = {
                monitoring : null,
                ranging : Scancode.beaconRangingCallback
            };
        }
        // start monitoring
        if (callback && callback.monitor) {
            Scancode.startBeaconMonitoring(beacon, callback.monitor);
        }
        // start ranging
        if (callback && callback.ranging) {
            Scancode.startBeaconRanging(beacon, callback.ranging);
        }
        // remember assocation
        Scancode.beacons['{0}-{1}-{2}'.format([major, minor, uuid])] = cid;
        console.debug("Scancode.createBeacon: {0}-{1}-{2}-{3}".format([cid, major, minor, uuid]));
        return beacon;
    };
    /***
     * return a previously registered beacon
     */
    Scancode.getBeaconAssociation = function(beacon) {
        try {
            return Scancode.beacons['{0}-{1}-{2}'.format([beacon.major, beacon.minor, beacon.uuid.toUpperCase()])];
        } catch(err) {
            return null;
        }
    };
    /**
     * will be called by the beacon monitoring
     * @param {Object} result
     * @see https://github.com/petermetz/cordova-plugin-ibeacon#start-monitoring-a-single-ibeacon
     */
    Scancode.onBeaconCallBack = function(result) {
        console.log(result.state);
    };
    /**
     * Start monitoring a particular beacon
     * @param {Object} beacon
     * @param callback the callback to be called
     * @see https://github.com/petermetz/cordova-plugin-ibeacon#start-monitoring-a-single-ibeacon
     */
    Scancode.startBeaconMonitoring = function(beacon, callback) {
        IBeacon.startMonitoringForRegion(beacon, callback || Scancode.onBeaconCallBack);
    };
    /**
     * Stop monitoring a particular beacon
     * @param {Object} beacon
     * @see https://github.com/petermetz/cordova-plugin-ibeacon#start-monitoring-a-single-ibeacon
     */
    Scancode.stopBeaconMonitoring = function(beacon) {
        IBeacon.stopMonitoringForRegion(beacon);
    };
    /**
     * Start location ranging a particular beacon
     * @param {Object} beacon
     * @see https://github.com/petermetz/cordova-plugin-ibeacon#start-monitoring-a-single-ibeacon
     */
    Scancode.startBeaconRanging = function(beacon, callback) {
        IBeacon.startRangingBeaconsInRegion(beacon, callback || Scancode.onBeaconCallBack);
    };
    /**
     * Beacon ranging callback. Quite simply go to the reservation screen for
     * the shareable that is associated with the beacon
     * @param {Object} result
     */
    Scancode.beaconRangingCallback = function(result) {
        var idleBeforeBeacon = Scancode.idleBeforeBeacon || settings.idleBeforeBeacon || 5000;
        // no activity for less than then ten seconds
        // we simply ignore any callbacks
        if (util.activityTracker.noActivityFor() <= idleBeforeBeacon)
            return;
        // check if we should process the beacon callback in the first place
        var proximityRe = new RegExp(Scancode.proximity);
        var hrefRe = new RegExp(Scancode.enablingURL);
        for(var i in result.beacons) {
          // find the beacon and its associated application id
          var beacon = result.beacons[i];
          var proximity = beacon.proximity;
          var cid = Scancode.getBeaconAssociation(beacon);
          beacon.cid = cid;
          // see if we should process this beacon and call the app's callback
          if (!Scancode.processingBeacon && proximity.match(proximityRe) && Scancode.isBeaconEnabled(beacon)) {
              Scancode.processingBeacon = true;
              // application callback
              Scancode.appCallback(beacon);
              // wait for idleBeforeBeacon milliseconds before we
              // start processing the next beacon
              setTimeout(function() {
                  Scancode.processingBeacon = false;
              }, idleBeforeBeacon);
          }
        }
    };
    return Scancode;
});
