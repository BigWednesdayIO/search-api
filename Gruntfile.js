'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    app: ['./*.js', './lib/**/*.js'],
    tests: ['./test/**/*.js'],
    specs: ['./spec/**/*.js'],
    eslint: {
      target: ['<%= app %>', '<%= tests %>', '<%= specs %>']
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: false
        },
        src: ['<%= tests %>']
      },
      spec: {
        options: {
          reporter: 'spec',
          clearRequireCache: false
        },
        src: ['<%= specs %>']
      }
    },
    watch: {
      default: {
        files: ['<%= app %>', '<%= tests %>'],
        tasks: ['test', 'lint']
      },
      specs: {
        files: ['<%= specs %>'],
        tasks: ['spec', 'lint']
      }
    },
    retire: {
      node: ['node']
    }
  });

  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('test', 'mochaTest:test');
  grunt.registerTask('spec', 'mochaTest:spec');
  grunt.registerTask('ci', ['retire', 'test', 'spec', 'lint']);
  grunt.registerTask('default', ['test', 'spec', 'lint']);
};
