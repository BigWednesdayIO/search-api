'use strict';

const sinon = require('sinon');

const elasticsearchClient = require('../../lib/elasticsearchClient');

const expect = require('chai').expect;

describe('Index', () => {
  describe('batchOperation', () => {
    const testIndexName = 'an-index';

    let bulkStub;
    let batchResult;

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

        const Index = require('../../lib/index');
        const index = new Index(testIndexName);

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
            index: {_index: testIndexName, _type: 'object'}
          }, batchOperations[0].body, {
            index: {_index: testIndexName, _type: 'object'}
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

        const Index = require('../../lib/index');
        const index = new Index(testIndexName);

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
            index: {_index: testIndexName, _type: 'object', _id: ids[0]}
          }, batchOperations[0].body, {
            index: {_index: testIndexName, _type: 'object', _id: ids[1]}
          }, batchOperations[1].body]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of upserted objects', () => {
        expect(batchResult.upserted).to.deep.equal(ids);
      });
    });
  });
});
