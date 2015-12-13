module.exports = {
	options : {
		banner : '/*! <%= app.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
	},
	dist : {
		options : {
			mangle : {
				except : ['jQuery', 'jquerymobile', 'Backbone']
			},
			compress : true,
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