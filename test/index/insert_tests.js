'use strict';

var index = require('../../lib/index');

describe('Index', function () {
  describe('insert', function () {
    it('adds the object', function (done) {
      index.insert({name: 'an object'}).then(function () {
        done();
      }, done);
    });
  });
});
