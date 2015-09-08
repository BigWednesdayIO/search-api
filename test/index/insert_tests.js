'use strict';

var elasticsearch = require('elasticsearch');
var sinon = require('sinon');

var expect = require('chai').expect;

describe('Index', function () {
  describe('insert', function () {
    var elasticStub;
    var indexedObject;
    var index;

    before(function () {
      elasticStub = sinon.stub(elasticsearch, 'Client', function () {
        return {
          index: function (args) {
            indexedObject = args.body;

            return new Promise(function (resolve) {
              resolve();
            });
          }
        };
      });

      index = require('../../lib/index');
    });

    after(function () {
      elasticStub.restore();
    });

    it('adds the object', function (done) {
      var object = {name: 'an object'};

      index.insert(object).then(function () {
        expect(indexedObject).to.be.equal(object);
        done();
      }, done);
    });
  });
});
