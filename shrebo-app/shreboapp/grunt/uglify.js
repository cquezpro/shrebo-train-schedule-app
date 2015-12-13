module.exports = {
	options : {
		banner : '/*! <%= app.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
	},
	dist : {
		options : {
			mangle : {
				except : ['jQuery', 'jquerymobile', 'Backbone']
			},
			// see https://github.com/gruntjs/grunt-contrib-uglify/issues/298#issuecomment-74161370
			compress : {},
		},
		files : [{
			expand : true,
			cwd : 'www/js',
			src : ['**/*.js', '!**/*.min.js'],
			dest : 'build/www/js',
			ext : '.js'
		}]
	}
};