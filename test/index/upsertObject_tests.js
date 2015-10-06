'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

const _ = require('lodash');
const sinon = require('sinon');

const expect = require('chai').expect;

const testId = 'myid';
const testIndexName = 'my-index-name';
const testObject = {name: 'an object', field1: 'value', field2: 0};

describe('Search Index', () => {
  describe('upsertObject', () => {
    let elasticStub;
    let indexedObject;
    let index;
    let indexName;
    let id;

    beforeEach(() => {
      elasticStub = sinon.stub(elasticsearchClient, 'index', args => {
        indexedObject = args.body;
        id = args.id;
        indexName = args.index;

        return Promise.resolve({_id: testId, _version: 2});
      });

      const SearchIndex = require('../../lib/search_index');
      index = new SearchIndex(testIndexName);
    });

    afterEach(() => {
      elasticStub.restore();
      indexedObject = undefined;
      indexName = undefined;
    });

    it('writes to elasticsearch with the provided id', () => {
      return index.upsertObject(testId, testObject)
        .then(() => {
          expect(id).to.equal(testId);
        });
    });

    it('writes to the named index', () => {
      return index.upsertObject(testId, testObject)
        .then(() => {
          expect(indexName).to.be.equal(testIndexName);
        });
    });

    it('adds the object to elasticsearch', () => {
      return index.upsertObject(testId, testObject)
        .then(() => {
          expect(indexedObject).to.be.equal(testObject);
        });
    });

    it('returns the new objects fields', () => {
      return index.upsertObject(testId, testObject)
        .then(o => {
          _.forOwn(testObject, (value, property) => {
            expect(o.upserted).to.have.property(property, value);
          });
        });
    });

    it('returns the objectID', () => {
      return index.upsertObject(testId, testObject)
        .then(o => {
          expect(o.upserted.objectID).to.be.equal(testId);
        });
    });

    it('returns the version number of objectID', () => {
      return index.upsertObject(testId, testObject)
        .then(o => {
          expect(o.version).to.be.equal(2);
        });
    });
  });
});
