'use strict';

const elasticsearch = require('elasticsearch');
const sinon = require('sinon');

const expect = require('chai').expect;

const testIndexName = 'my-index-name';
const testObject = {name: 'an object'};

describe('Index', function () {
  describe('insert', function () {
    let elasticStub;
    let indexedObject;
    let index;
    let indexName;

    beforeEach(function () {
      elasticStub = sinon.stub(elasticsearch, 'Client', function () {
        return {
          index(args) {
            indexedObject = args.body;
            indexName = args.index;

            return new Promise(function (resolve) {
              resolve();
            });
          }
        };
      });

      const Index = require('../../lib/index');
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
