'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

const sinon = require('sinon');

const testIndexName = 'an-index';

describe('Index', () => {
  describe('drop', () => {
    let elasticStub;
    let index;

    before(() => {
      elasticStub = sinon.stub(elasticsearchClient.indices, 'delete', () => {
        return Promise.resolve({});
      });

      const Index = require('../../lib/index');
      index = new Index(testIndexName);
    });

    after(() => {
      elasticStub.restore();
    });

    it('deletes the index', () => {
      index.drop().then(() => {
        sinon.assert.calledWith(elasticStub, {index: testIndexName});
      });
    });
  });
});
