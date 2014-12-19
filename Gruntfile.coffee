

module.exports = (grunt)->


	pkg = grunt.file.readJSON('package.json')

	grunt.initConfig 
		
		coffee: 
			compile:
				files: 'deploy/js/main.js' : 'deploy/js/main.coffee'
				options: 
					sourceMap: true

		watch: 
			coffee:
				files: ['deploy/js/main.coffee']
				tasks: ['coffee:compile']
				livereload: true

			dev:
				files: ['**/*.html', '**/*.css', '**/*.js']
				options:
					livereload: true


		connect:
			dev:
				options:
					base: './deploy'
					# livereload: true

		uglify:
			dist:
				files:
					'deploy/js/main.min.js' : ['deploy/js/main.js']



	for taskName of pkg.devDependencies when taskName.substring(0,6) is 'grunt-' 
		grunt.loadNpmTasks taskName
	

	grunt.registerTask('dev', ['connect', 'watch'])
	grunt.registerTask('dist', ['coffee:compile', 'uglify:dist', 'connect'])

