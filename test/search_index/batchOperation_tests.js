'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');

const testNewIndexName = 'my-index-name';
const testExistingIndexName = 'existing-index-name';
const operations = [
  {action: 'create', body: {name: 'an object'}},
  {action: 'create', body: {name: 'another object'}},
  {action: 'delete', objectID: '1'}
];
const createIds = ['id1', 'id2'];

describe('Search Index', () => {
  describe('batchOperation', () => {
    let sandbox;
    let bulkStub;
    let bulkArgs;

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

        const err = new Error();
        err.error = `alias [${args.name}] missing`;
        err.status = 404;

        return Promise.reject(err);
      });

      bulkStub = sandbox.stub(elasticsearchClient, 'bulk', args => {
        bulkArgs = args;
        let createdCount = 0;
        const result = {};

        result.items = args.body
          .filter(row => {
            return row.delete || row.index;
          })
          .map(header => {
            if (header.delete) {
              return {'delete': {_id: header.delete._id}};
            }

            if (header.index._id) {
              return {index: {_id: header.index._id}};
            }

            return {create: {_id: createIds[createdCount++]}};
          });

        return Promise.resolve(result);
      });
    });

    afterEach(() => {
      bulkArgs = undefined;
      sandbox.restore();
    });

    describe('when the index does not exist', () => {
      beforeEach(() => {
        sandbox.stub(elasticsearchClient.indices, 'create', () => Promise.resolve({}));
        sandbox.stub(elasticsearchClient.indices, 'putAlias', () => Promise.resolve({}));

        const index = new SearchIndex(testNewIndexName);
        return index.batchOperation(operations);
      });

      it('does not run delete operations', () => {
        sinon.assert.calledOnce(bulkStub);

        const deleteRequest = bulkArgs.body.find(request => {
          return request.delete;
        });

        expect(deleteRequest).to.not.exist;
      });
    });

    describe('create', () => {
      let batchCreateResult;

      const batchOperations = [
        {action: 'create', body: {name: 'an object'}},
        {action: 'create', body: {name: 'another object'}}
      ];

      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);

        return index.batchOperation(batchOperations)
          .then(result => {
            batchCreateResult = result;
          });
      });

      it('makes an index request for each created object', () => {
        const expectedBulkArgs = {
          body: [{
            index: {_index: testExistingIndexName, _type: 'object'}
          }, batchOperations[0].body, {
            index: {_index: testExistingIndexName, _type: 'object'}
          }, batchOperations[1].body]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of inserted objects', () => {
        expect(batchCreateResult.inserted).to.deep.equal(createIds);
      });
    });

    describe('upsert', () => {
      let bactchUpsertResult;
      const ids = ['id1', 'id2'];

      const batchOperations = [
        {action: 'upsert', objectID: ids[0], body: {name: 'an object'}},
        {action: 'upsert', objectID: ids[1], body: {name: 'another object'}}
      ];

      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);

        return index.batchOperation(batchOperations)
          .then(result => {
            bactchUpsertResult = result;
          });
      });

      after(() => {
        bulkStub.restore();
      });

      it('makes an index request for each upserted object', () => {
        const expectedBulkArgs = {
          body: [{
            index: {_index: testExistingIndexName, _type: 'object', _id: ids[0]}
          }, batchOperations[0].body, {
            index: {_index: testExistingIndexName, _type: 'object', _id: ids[1]}
          }, batchOperations[1].body]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of upserted objects', () => {
        expect(bactchUpsertResult.upserted).to.deep.equal(ids);
      });
    });

    describe('delete', () => {
      let batchDeleteResult;
      const ids = ['id1', 'id2'];

      const batchOperations = [
        {action: 'delete', objectID: ids[0]},
        {action: 'delete', objectID: ids[1]}
      ];

      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);

        return index.batchOperation(batchOperations)
          .then(result => {
            batchDeleteResult = result;
          });
      });

      it('makes a delete request for each deleted object', () => {
        const expectedBulkArgs = {
          body: [{
            'delete': {_index: testExistingIndexName, _type: 'object', _id: ids[0]}
          }, {
            'delete': {_index: testExistingIndexName, _type: 'object', _id: ids[1]}
          }]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of deleted objects', () => {
        expect(batchDeleteResult.deleted).to.deep.equal(ids);
      });
    });
  });
});
