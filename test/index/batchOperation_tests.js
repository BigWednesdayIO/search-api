'use strict';

const sinon = require('sinon');

const elasticsearchClient = require('../../lib/elasticsearchClient');

const expect = require('chai').expect;

describe('Index', () => {
  describe('batchOperation', () => {
    const testIndexName = 'an-index';

    let bulkStub;
    let batchResult;

    describe('addObjects', () => {
      const batchOperations = {
        insert: [{name: 'an object'}, {name: 'another object'}]
      };

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

      it('makes an index request for each inserted object', () => {
        const expectedBulkArgs = {
          body: [{
            index: {_index: testIndexName, _type: 'object'}
          }, batchOperations.insert[0], {
            index: {_index: testIndexName, _type: 'object'}
          }, batchOperations.insert[1]]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of inserted objects', () => {
        expect(batchResult.inserted).to.deep.equal(ids);
      });
    });

    describe('updateObjects', () => {
      const ids = ['id1', 'id2'];

      const batchOperations = {
        update: [{objectID: ids[0], data: {name: 'an object'}}, {objectID: ids[1], data: {name: 'another object'}}]
      };

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

      it('makes an index request for each updated object', () => {
        const expectedBulkArgs = {
          body: [{
            index: {_index: testIndexName, _type: 'object', _id: ids[0]}
          }, batchOperations.update[0].data, {
            index: {_index: testIndexName, _type: 'object', _id: ids[1]}
          }, batchOperations.update[1].data]
        };

        sinon.assert.calledOnce(bulkStub);
        sinon.assert.calledWith(bulkStub, expectedBulkArgs);
      });

      it('returns the ids of updated or inserted objects', () => {
        expect(batchResult.updated).to.deep.equal(ids);
      });
    });
  });
});
