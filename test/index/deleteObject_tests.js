'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

// const _ = require('lodash');
const sinon = require('sinon');

const expect = require('chai').expect;

const testId = 'myid';
const testIndexName = 'my-index-name';

describe('Index', () => {
  describe('deleteObject', () => {
    let elasticStub;
    let index;
    let deletedId;
    let indexName;

    beforeEach(() => {
      elasticStub = sinon.stub(elasticsearchClient, 'delete', args => {
        deletedId = args.id;
        indexName = args.index;

        return Promise.resolve({_id: testId, _version: 2});
      });

      const Index = require('../../lib/index');
      index = new Index(testIndexName);
    });

    afterEach(() => {
      elasticStub.restore();
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
  });
});
