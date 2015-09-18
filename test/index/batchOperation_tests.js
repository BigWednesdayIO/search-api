'use strict';

const sinon = require('sinon');

const elasticsearchClient = require('../../lib/elasticsearchClient');

const expect = require('chai').expect;

describe('Index', () => {
  describe('batchOperation', () => {
    const testIndexName = 'an-index';

    const batchOperations = {
      insert: [{name: 'an object'}, {name: 'another object'}]
    };

    const ids = ['id1', 'id2'];

    let bulkStub;
    let batchResult;

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

    it('inserts objects into the index', () => {
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
});
