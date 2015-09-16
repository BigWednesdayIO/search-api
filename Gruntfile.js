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
    shell: {
      validateSwagger: {
        command: 'swagger-tools validate swagger.json'
      }
    },
    watch: {
      default: {
        files: ['<%= app %>', '<%= tests %>'],
        tasks: ['lint', 'test']
      },
      specs: {
        files: ['<%= specs %>'],
        tasks: ['lint', 'spec']
      },
      swagger: {
        files: ['swagger.json'],
        tasks: ['lint', 'shell:validateSwagger', 'spec']
      }
    },
    retire: {
      node: ['node']
    }
  });

  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('test', 'mochaTest:test');
  grunt.registerTask('spec', 'mochaTest:spec');
  grunt.registerTask('ci', ['retire', 'default']);
  grunt.registerTask('default', ['lint', 'test', 'shell:validateSwagger', 'spec']);
};
