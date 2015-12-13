module.exports = {
	// https://gist.github.com/jonathandixon/7418730
	options : {
		path : './'
	},
	add_android : {
		options : {
			command : 'platform',
			action : 'add',
			platforms : ['android']
		}
	},
	add_ios: {
		options : {
			command : 'platform',
			action : 'add',
			platforms : ['ios']
		}
	},
	add_plugins : {
		options : {
			command : 'plugin',
			action : 'add',
			plugins : [
				'console',
				'device',
				'geolocation',
				'network-information',
				'splashscreen',
				'https://github.com/paypal/PayPal-Cordova-Plugin',
				'https://github.com/phonegap-build/BarcodeScanner.git',
				'https://github.com/apache/cordova-plugin-statusbar.git',
				'https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git',
				'https://github.com/Initsogar/cordova-activityindicator.git',
				'https://github.com/apache/cordova-plugin-dialogs.git',
				'https://github.com/apache/cordova-plugin-splashscreen.git',
				'https://github.com/apache/cordova-plugin-vibration.git',
				'https://github.com/phonegap-build/PushPlugin.git',
				'https://github.com/miraculixx/cordova-testfairy-plugin.git',
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