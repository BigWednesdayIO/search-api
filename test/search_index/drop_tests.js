'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

const sinon = require('sinon');

const expect = require('chai').expect;

const testIndexName = 'an-index';

describe('Search Index', () => {
  describe('drop', () => {
    let elasticStub;
    let SearchIndex;

    before(() => {
      elasticStub = sinon.stub(elasticsearchClient.indices, 'delete', args => {
        if (args.index === 'nonexistantindex') {
          const err = new Error('Missing index');
          err.status = 404;

          return Promise.reject(err);
        }

        return Promise.resolve({});
      });

      SearchIndex = require('../../lib/search_index');
    });

    after(() => {
      elasticStub.restore();
    });

    it('deletes the index', () => {
      const index = new SearchIndex(testIndexName);

      index.drop().then(() => {
        sinon.assert.calledWith(elasticStub, {index: testIndexName});
      });
    });

    it('returns index not found errors', () => {
      const index = new SearchIndex('nonexistantindex');

      return index.drop()
        .then(() => {
          throw new Error('Expected index not found error');
        }, err => {
          expect(err).to.have.property('indexFound', false);
        });
    });
  });
});
