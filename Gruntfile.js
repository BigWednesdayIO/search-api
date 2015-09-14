'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    app: ['./*.js', './lib/**/*.js'],
    tests: ['./test/**/*.js'],
    specs: ['./spec/**/*.js'],
    env: {
      test: {
        AWS_REGION: 'eu-west-1',
        AWS_ACCESS_KEY_ID: 'dummy',
        AWS_SECRET_ACCESS_KEY: 'dummy',
        AWS_ENDPOINT: 'http://localhost:8000'
      }
    },
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
      dynamodb: {
        command: './dev/stopStartDynamoDb.sh && sleep 3 && node ./dev/bootstrap_dynamodb.js'
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
      }
    },
    retire: {
      node: ['node']
    }
  });

  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('test', 'mochaTest:test');
  grunt.registerTask('spec', ['env:test', 'shell:dynamodb', 'mochaTest:spec']);
  grunt.registerTask('ci', ['retire', 'default']);
  grunt.registerTask('default', ['lint', 'test', 'spec']);
};
