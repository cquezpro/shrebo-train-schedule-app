module.exports = {
	/* make sure we set the production environment on dist build */
	/**
	 * the replacements change various configuration settings according to the grunt
	 * target. In general this works by finding a line that has a //@Grunt:target comment
	 * in it. The line is then replaced as specified by the "to" setting of the
	 * replacement.
	 * 
	 * Note that the dist target replaces by copying into the build directory, whereas
	 * other targets replace in-place as a convenience to the developer.
	 * 
	 * This is not perfect, but it works just fine.
	 */
	dist : {
		// distribution build
		src : ['www/js/settings.js'],
		dest : 'build/www/js/settings.js',
		replacements : [{
			from : '//@Grunt:config',
			to : '\tcurrent=config_prod;//@Grunt:config'
		}]
	},
	/*
	 * the following change varios settings in-place. That is, the settings.js file is
	 * overwritten as this is supposed to work within the development environment for
	 * covenience. In order to preserve code formatting, the replacement strings are
	 * prefixed with a tab character (\t)
	 */
	customer : {
		// set customer settings
		src : ['www/js/settings.js', 'www/config.xml'],
		overwrite : true,
		replacements : [{
			from : /.*\/\/.*\@Grunt:main_view/,
			to : '\tcurrent.main_view="#search";//@Grunt:main_view'
		}, {
			from : /.*\/\/.*\@Grunt:variant/,
			to : '\tcurrent.variant="customer";//@Grunt:variant'
		}, {
			from : /(id=")(.*?)(")/g,
			to : '$1ch.cleverpendeln.customer$3'
		}, {
			from : /(<name>)\n?(.*)\n/m,
			to : '$1\ncleverpendeln\n'
		}]
	},
	staff : {
		// set staff settings
		src : ['www/js/settings.js', 'www/config.xml'],
		overwrite : true,
		replacements : [{
			from : /.*\/\/.*\@Grunt:main_view/,
			to : '\tcurrent.main_view="#staffservice";//@Grunt:main_view'
		}, {
			from : /.*\/\/.*\@Grunt:variant/,
			to : '\tcurrent.variant="staff";//@Grunt:variant'
		}, {
			from : /(id=")(.*?)(")/g,
			to : '$1ch.cleverpendeln.staff$3'
		}, {
			from : /(<name>)\n?(.*)\n/m,
			to : '$1\cp SBB Staff\n'
		}]
	},
	webapp : {
		// set webapp
		src : ['www/js/settings.js'],
		overwrite : true,
		replacements : [{
			from : /.*\/\/.*\@Grunt:webapp/,
			to : '\tcurrent.webapp=true;//@Grunt:webapp'
		}]
	},
	cordova : {
		// set cordova
		src : ['www/js/settings.js'],
		overwrite : true,
		replacements : [{
			from : /.*\/\/.*\@Grunt:webapp/,
			to : '\tcurrent.webapp=false;//@Grunt:webapp'
		}]
	},
	testserver : {
		// distribution build
		src : ['www/js/settings.js'],
		overwrite : true,
		replacements : [{
			from : /.*\/\/.*\@Grunt:config/,
			to : '\tcurrent=config_test;//@Grunt:config'
		}]

	},
	localserver : {
		// distribution build
		src : ['www/js/settings.js'],
		overwrite : true,
		replacements : [{
			from : /.*\/\/.*\@Grunt:config/,
			to : '\tcurrent=config_local;//@Grunt:config'
		}]

	},
	localserver_device : {
        // device build with a local dev server
        src : ['www/js/settings.js'],
        overwrite : true,
        replacements : [{
            from : /.*\/\/.*\@Grunt:config/,
            to : '\tcurrent=config_local_device;//@Grunt:config'
        }]

    },
	stagingserver : {
        // distribution build
        src : ['www/js/settings.js'],
        overwrite : true,
        replacements : [{
            from : /.*\/\/.*\@Grunt:config/,
            to : '\tcurrent=config_staging;//@Grunt:config'
        }]
    },
    deployserver: {
        // distribution build
        src : ['www/js/settings.js'],
        overwrite : true,
        replacements : [{
            from : /.*\/\/.*\@Grunt:config/,
            to : '\tcurrent=config_deploy;//@Grunt:config'
        }]
    },
	devserver : {
		// distribution build
		src : ['www/js/settings.js'],
		overwrite : true,
		replacements : [{
			from : /.*\/\/.*\@Grunt:config/,
			to : '\tcurrent=config_dev;//@Grunt:config'
		}]

	},

};