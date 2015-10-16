'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');

const testExistingIndexName = 'existing-index-name';
const testId = 'myId';
const testObject = {name: 'an object', field1: 'value', field2: 0};

describe('Search Index', () => {
  describe('upsertObject', () => {
    let sandbox;
    let indexStub;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      indexStub = sandbox.stub(elasticsearchClient, 'index', () => Promise.resolve({_id: testId, _version: 2}));

      sandbox.stub(elasticsearchClient.indices, 'getAlias', args => {
        if (args.name === testExistingIndexName) {
          return Promise.resolve({
            anIndex: {
              aliases: {
                [testExistingIndexName]: {}
              }
            }
          });
        }

        const err = new Error();
        err.error = `alias [${args.name}] missing`;
        err.status = 404;

        return Promise.reject(err);
      });
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('upserting', () => {
      let upsertResult;

      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);
        return index.upsertObject(testId, testObject).then(u => {
          upsertResult = u;
        });
      });

      it('writes to elasticsearch with the provided id', () => {
        sinon.assert.calledOnce(indexStub);
        sinon.assert.calledWith(indexStub, sinon.match({id: testId}));
      });

      it('writes to the named index', () => {
        sinon.assert.calledOnce(indexStub);
        sinon.assert.calledWith(indexStub, sinon.match({index: testExistingIndexName}));
      });

      it('adds the object to elasticsearch', () => {
        sinon.assert.calledOnce(indexStub);
        sinon.assert.calledWith(indexStub, sinon.match({body: testObject}));
      });

      it('returns the new objects fields', () => {
        _.forOwn(testObject, (value, property) => {
          expect(upsertResult.upserted).to.have.property(property, value);
        });
      });

      it('returns the objectID', () => {
        expect(upsertResult.upserted.objectID).to.be.equal(testId);
      });

      it('returns the version number of objectID', () => {
        expect(upsertResult.version).to.be.equal(2);
      });
    });
  });
});
