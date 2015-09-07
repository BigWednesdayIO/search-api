'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    eslint: {
      target: ['./*.js', './lib/**/*.js']
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: false
        },
        src: ['test/**/*.js']
      }
    }
  });

  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['eslint', 'mochaTest']);
};
