'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

const sinon = require('sinon');

const expect = require('chai').expect;

const testIndexName = 'an-index';

describe('Index', () => {
  describe('drop', () => {
    let elasticStub;
    let Index;

    before(() => {
      elasticStub = sinon.stub(elasticsearchClient.indices, 'delete', args => {
        if (args.index === 'nonexistantindex') {
          const err = new Error('Missing index');
          err.status = 404;

          return Promise.reject(err);
        }

        return Promise.resolve({});
      });

      Index = require('../../lib/index');
    });

    after(() => {
      elasticStub.restore();
    });

    it('deletes the index', () => {
      const index = new Index(testIndexName);

      index.drop().then(() => {
        sinon.assert.calledWith(elasticStub, {index: testIndexName});
      });
    });

    it('returns index not found errors', () => {
      const index = new Index('nonexistantindex');

      return index.drop()
        .then(() => {
          throw new Error('Expected index not found error');
        }, err => {
          expect(err).to.have.property('indexFound', false);
        });
    });
  });
});
