'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    eslint: {
      target: ['./*.js', './lib/**/*.js']
    }
  });

  grunt.registerTask('default', ['eslint']);
};
