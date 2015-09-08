'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    jsFiles: ['./*.js', './lib/**/*.js', './test/**/*.js'],
    eslint: {
      target: ['<%= jsFiles %>']
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: false
        },
        src: ['test/*.js']
      }
    },
    watch: {
      js: {
        files: ['<%= jsFiles %>'],
        tasks: ['test', 'lint']
      }
    },
    retire: {
      node: ['node']
    }
  });

  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('ci', ['retire', 'test', 'lint']);
  grunt.registerTask('default', ['test', 'lint']);
};
