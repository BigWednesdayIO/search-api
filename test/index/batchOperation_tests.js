'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');

const testNewIndexName = 'my-index-name';
const testExistingIndexName = 'existing-index-name';
const operations = [
  {action: 'create', body: {name: 'an object'}},
  {action: 'create', body: {name: 'another object'}}
];

describe('Search Index', () => {
  describe('batchOperation', () => {
    let sandbox;
    let createIndexStub;
    let putAliasStub;
    let bulkStub;
    let SearchIndex;
    let batchResult;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

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

        if (args.ignore === 404) {
          return Promise.resolve({});
        }

        const err = new Error();
        err.error = `alias [${args.name}] missing`;
        err.status = 404;

        return Promise.reject(err);
      });

      createIndexStub = sandbox.stub(elasticsearchClient.indices, 'create', () => {
        return Promise.resolve({});
      });

      putAliasStub = sandbox.stub(elasticsearchClient.indices, 'putAlias', () => {
        return Promise.resolve({});
      });

      SearchIndex = require('../../lib/search_index');
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('when the index does not exist', () => {
      let expectedUniqueIndexName;

      beforeEach(() => {
        const testDate = new Date();
        sinon.useFakeTimers(testDate.getTime());

        expectedUniqueIndexName = `${testNewIndexName}_${testDate.getFullYear()}.${testDate.getMonth() + 1}.${testDate.getDate()}.${testDate.getMilliseconds()}`;

        const index = new SearchIndex(testNewIndexName);
        return index.batchOperation(operations);
      });

      it('creates the index with a unique name', () => {
        sinon.assert.calledOnce(createIndexStub);
        sinon.assert.calledWith(createIndexStub, {index: expectedUniqueIndexName});
      });

      it('sets the index name as an alias', () => {
        sinon.assert.calledOnce(putAliasStub);
        sinon.assert.calledWith(putAliasStub, {index: expectedUniqueIndexName, name: testNewIndexName});
      });
    });

    describe('when the index exists', () => {
      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);
        return index.batchOperation(operations);
      });

      it('does not create a new index', () => {
        sinon.assert.notCalled(createIndexStub);
        sinon.assert.notCalled(putAliasStub);
      });
    });

    describe('create', () => {
      const batchOperations = [
        {action: 'create', body: {name: 'an object'}},
        {action: 'create', body: {name: 'another object'}}
      ];

      const ids = ['id1', 'id2'];

      before(() => {
        bulkStub = sinon.stub(elasticsearchClient, 'bulk', () => {
          const result = {
            items: [{
              create: {_id: ids[0]}
            }, {
              create: {_id: ids[1]}
            }]
          };

          return Promise.resolve(result);
        });

        const SearchIndex = require('../../lib/search_index');
        const index = new SearchIndex(testNewIndexName);

        return index.batchOperation(batchOperations)
          .then(result => {
            batchResult = result;
          });
      });

      after(() => {
        bulkStub.restore();
      });

      it('makes an index request for each created object', () => {
        const expectedBulkArgs = {
          body: [{
            index: {_index: testNewIndexName, _type: 'object'}
          }, batchOperations[0].body, {
            index: {_index: testNewIndexName, _type: 'object'}
          }, batchOperations[1].body]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of inserted objects', () => {
        expect(batchResult.inserted).to.deep.equal(ids);
      });
    });

    describe('upsert', () => {
      const ids = ['id1', 'id2'];

      const batchOperations = [
        {action: 'upsert', objectID: ids[0], body: {name: 'an object'}},
        {action: 'upsert', objectID: ids[1], body: {name: 'another object'}}
      ];

      before(() => {
        bulkStub = sinon.stub(elasticsearchClient, 'bulk', () => {
          const result = {
            items: [{
              index: {_id: ids[0]}
            }, {
              index: {_id: ids[1]}
            }]
          };

          return Promise.resolve(result);
        });

        const SearchIndex = require('../../lib/search_index');
        const index = new SearchIndex(testNewIndexName);

        return index.batchOperation(batchOperations)
          .then(result => {
            batchResult = result;
          });
      });

      after(() => {
        bulkStub.restore();
      });

      it('makes an index request for each upserted object', () => {
        const expectedBulkArgs = {
          body: [{
            index: {_index: testNewIndexName, _type: 'object', _id: ids[0]}
          }, batchOperations[0].body, {
            index: {_index: testNewIndexName, _type: 'object', _id: ids[1]}
          }, batchOperations[1].body]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of upserted objects', () => {
        expect(batchResult.upserted).to.deep.equal(ids);
      });
    });

    describe('delete', () => {
      const ids = ['id1', 'id2'];

      const batchOperations = [
        {action: 'delete', objectID: ids[0]},
        {action: 'delete', objectID: ids[1]}
      ];

      before(() => {
        bulkStub = sinon.stub(elasticsearchClient, 'bulk', () => {
          const result = {
            items: [{
              'delete': {_id: ids[0]}
            }, {
              'delete': {_id: ids[1]}
            }]
          };

          return Promise.resolve(result);
        });

        const SearchIndex = require('../../lib/search_index');
        const index = new SearchIndex(testNewIndexName);

        return index.batchOperation(batchOperations)
          .then(result => {
            batchResult = result;
          });
      });

      after(() => {
        bulkStub.restore();
      });

      it('makes a delete request for each deleted object', () => {
        const expectedBulkArgs = {
          body: [{
            'delete': {_index: testNewIndexName, _type: 'object', _id: ids[0]}
          }, {
            'delete': {_index: testNewIndexName, _type: 'object', _id: ids[1]}
          }]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of deleted objects', () => {
        expect(batchResult.deleted).to.deep.equal(ids);
      });
    });
  });
});
