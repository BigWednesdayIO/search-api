'use strict';

var elasticsearch = require('elasticsearch');
var sinon = require('sinon');

var expect = require('chai').expect;

describe('Index', function () {
  describe('insert', function () {
    var elasticStub;
    var indexedObject;
    var index;
    var indexName;
    var testIndexName = 'my-index-name';
    var testObject = {name: 'an object'};

    beforeEach(function () {
      elasticStub = sinon.stub(elasticsearch, 'Client', function () {
        return {
          index: function (args) {
            indexedObject = args.body;
            indexName = args.index;

            return new Promise(function (resolve) {
              resolve();
            });
          }
        };
      });

      var Index = require('../../lib/index');
      index = new Index(testIndexName);
    });

    afterEach(function () {
      elasticStub.restore();
      indexedObject = undefined;
      indexName = undefined;
    });

    it('adds the object to elasticsearch', function (done) {
      index.insert(testObject).then(function () {
        expect(indexedObject).to.be.equal(testObject);
        done();
      }, done);
    });

    it('writes to the named index', function (done) {
      index.insert(testObject).then(function () {
        expect(indexName).to.be.equal(testIndexName);
        done();
      }, done);
    });
  });
});
