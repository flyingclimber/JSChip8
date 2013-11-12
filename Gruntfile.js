/*global module:false*/

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    qunit: {
      files: ['qunit.html']
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        eqnull: true,
        browser: true,
        quotmark: true,
        //unused: true,
        trailing: true,
        },
      files: {
        src: ['*.js']
      }
    },
    csslint: {
      files: {
        src: ['*.css']
      }
    }
  });

grunt.loadNpmTasks('grunt-contrib-qunit');
grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-contrib-csslint');

// Default task.
grunt.registerTask('default', ['jshint', 'csslint', 'qunit']);

};
