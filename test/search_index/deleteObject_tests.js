'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');

const sinon = require('sinon');

const expect = require('chai').expect;

const testId = 'myid';
const testIndexName = 'my-index-name';

describe('Search Index', () => {
  describe('deleteObject', () => {
    let elasticDeleteStub;
    let elasticGetIndexStub;
    let index;
    let deletedId;
    let indexName;

    beforeEach(() => {
      elasticDeleteStub = sinon.stub(elasticsearchClient, 'delete', args => {
        deletedId = args.id;
        indexName = args.index;

        return Promise.resolve({_id: testId, _version: 2});
      });

      elasticGetIndexStub = sinon.stub(elasticsearchClient.indices, 'get', args => {
        if (args.index === 'nonexistantindex') {
          const err = new Error('Missing index');
          err.status = 404;

          return Promise.reject(err);
        }

        return Promise.resolve({});
      });

      index = new SearchIndex(testIndexName);
    });

    afterEach(() => {
      elasticDeleteStub.restore();
      elasticGetIndexStub.restore();
    });

    it('deletes an object with a matching id', () => {
      return index.deleteObject(testId)
        .then(() => {
          expect(deletedId).to.be.equal(testId);
        });
    });

    it('deletes an object from the named index', () => {
      return index.deleteObject(testId)
        .then(() => {
          expect(indexName).to.be.equal(testIndexName);
        });
    });

    it('returns index not found errors', () => {
      const index = new SearchIndex('nonexistantindex');

      return index.deleteObject(testId)
        .then(() => {
          throw new Error('Expected index not found error');
        }, err => {
          expect(err).to.have.property('indexFound', false);
        });
    });

    it('does not call client.delete when index does not exist', () => {
      // calling delete item for an non-existant index causes the index to be created
      // so test that this never happens
      const index = new SearchIndex('nonexistantindex');

      return index.deleteObject(testId)
        .then(() => {
          throw new Error('Expected index not found error');
        }, () => {
          sinon.assert.notCalled(elasticDeleteStub);
        });
    });
  });
});
