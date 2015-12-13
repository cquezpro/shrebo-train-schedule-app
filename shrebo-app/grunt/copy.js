module.exports = {
	main : {
		expand : true,
		src : 'www/**',
		dest : 'build/',
		noProcess : '*.js',
	},
	customer : {
		expand : true,
		cwd : 'www/variants/customer',
		src : '**',
		dest : 'www/',
	},
	staff : {
		expand : true,
		cwd : 'www/variants/staff',
		src : '**',
		dest : 'www/',
	},
	// https://gist.github.com/jonathandixon/7418730
	platform_merges : {
		expand : true,
		dest : './platforms/',
		cwd : 'platform-merges',
		src : '**'
	},
	// @formatter:off
	resources_ios : {
		files : [
			{
				src : ['www/res/icon/ios/icon-57.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/icons/icon.png'
			},
			{
				src : ['www/res/icon/ios/icon-57-2x.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/icons/icon@2x.png'
			},
			{
				src : ['www/res/icon/ios/icon-72.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/icons/icon-72.png'
			},
			{
				src : ['www/res/icon/ios/icon-72-2x.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/icons/icon-72@2x.png'
			},
			{
				src : ['www/res/screen/ios/screen-iphone-portrait.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/splash/Default~iphone.png'
			},
			{
				src : ['www/res/screen/ios/screen-iphone-portrait-2x.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/splash/Default@2x~iphone.png'
			},
			{
				src : ['www/res/screen/ios/screen-iphone-portrait-568h-2x.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/splash/Default-568h@2x~iphone.png'
			},
			{
				src : ['www/res/screen/ios/screen-ipad-portrait.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/splash/Default-Portrait~ipad.png'
			},
			{
				src : ['www/res/screen/ios/screen-ipad-portrait-2x.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/splash/Default-Portrait@2x~ipad.png'
			},
			{
				src : ['www/res/screen/ios/screen-ipad-landscape.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/splash/Default-Landscape~ipad.png'
			},
			{
				src : ['www/res/screen/ios/screen-ipad-landscape-2x.png'],
				dest : 'platforms/ios/<%= app.name %>/Resources/splash/Default-Landscape@2x~ipad.png'
			}]
	},
	resources_android : {
		files : [{
			src : ['www/res/icon/android/icon-36-ldpi.png'],
			dest : 'platforms/android/res/drawable-ldpi/icon.png'
		}, {
			src : ['www/res/icon/android/icon-48-mdpi.png'],
			dest : 'platforms/android/res/drawable-mdpi/icon.png'
		}, {
			src : ['www/res/icon/android/icon-72-hdpi.png'],
			dest : 'platforms/android/res/drawable-hdpi/icon.png'
		}, {
			src : ['www/res/icon/android/icon-96-xhdpi.png'],
			dest : 'platforms/android/res/drawable-xhdpi/icon.png'
		}, {
			src : ['www/res/icon/android/icon-96-xhdpi.png'],
			dest : 'platforms/android/res/drawable/icon.png'
		}, {
			src : ['www/res/screen/android/screen-ldpi-portrait.png'],
			dest : 'platforms/android/res/drawable-port-ldpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-ldpi-landscape.png'],
			dest : 'platforms/android/res/drawable-land-ldpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-mdpi-portrait.png'],
			dest : 'platforms/android/res/drawable-port-mdpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-mdpi-landscape.png'],
			dest : 'platforms/android/res/drawable-land-mdpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-hdpi-portrait.png'],
			dest : 'platforms/android/res/drawable-port-hdpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-hdpi-landscape.png'],
			dest : 'platforms/android/res/drawable-land-hdpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-xhdpi-portrait.png'],
			dest : 'platforms/android/res/drawable-port-xhdpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-xhdpi-landscape.png'],
			dest : 'platforms/android/res/drawable-land-xhdpi/screen.png'
		}, {
			src : ['www/res/screen/android/screen-xhdpi-portrait.png'],
			dest : 'platforms/android/res/drawable/screen.png'
		}]
	},
// @formatter:on

};
