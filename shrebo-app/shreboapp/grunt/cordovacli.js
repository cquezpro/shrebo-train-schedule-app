module.exports = {
	// https://gist.github.com/jonathandixon/7418730
	options : {
		path : './'
	},
	add_android : {
		options : {
			command : 'platform',
			action : 'add',
            // add 3.6 => target SDK 19 
            // see http://www.droid-life.com/tag/distribution/
			platforms : ['android@4.0.0']
		}
	},
	add_ios: {
		options : {
			command : 'platform',
			action : 'add',
			platforms : ['ios@3.7.0']
		}
	},
	add_plugins : {
		options : {
			command : 'plugin',
			action : 'add',
			plugins : [
				'https://github.com/apache/cordova-plugin-console.git#r0.2.13',
				'https://github.com/apache/cordova-plugin-device.git#r0.3.0',
				'https://github.com/apache/cordova-plugin-geolocation.git#r0.3.12',
				'https://github.com/apache/cordova-plugin-network-information.git#r0.2.15',
				// required for android@4.0.0 
				'https://github.com/apache/cordova-plugin-whitelist#r1.0.0',
				'https://github.com/paypal/PayPal-Cordova-Plugin#3.1.7',
				'https://github.com/phonegap-build/BarcodeScanner.git#1.2.0',
				'https://github.com/apache/cordova-plugin-statusbar.git#r1.0.0',
				'https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git#4.3.18',
				'https://github.com/Initsogar/cordova-activityindicator.git',
				'https://github.com/apache/cordova-plugin-dialogs.git#r1.1.0',
				'https://github.com/apache/cordova-plugin-splashscreen.git#r2.0.0',
				'https://github.com/apache/cordova-plugin-vibration.git#r1.1.0',
				'https://github.com/miraculixx/cordova-testfairy-plugin.git#1.4.0',
				'https://github.com/whiteoctober/cordova-plugin-app-version.git#0.1.7',
				'https://github.com/phonegap-build/PushPlugin.git#2.4.0',
				'https://github.com/miraculixx/cordova-plugin-local-notifications.git#0.8.1-fix-4.0',
			]
		}
	},
	build_ios : {
		options : {
			command : 'build',
			platforms : ['ios']
		}
	},
	build_android : {
		options : {
			command : 'build',
			platforms : ['android']
		}
	},
	prepare_ios : {
		options : {
			command : 'prepare',
			platforms : ['ios']
		}
	},
	prepare_android : {
		options : {
			command : 'prepare',
			platforms : ['android']
		}
	},
	serve : {
		options : {
			command : 'serve',
			port : 7000
		}
	},
};