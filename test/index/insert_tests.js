'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

const _ = require('lodash');
const sinon = require('sinon');

const expect = require('chai').expect;

const testIndexName = 'my-index-name';
const testObject = {name: 'an object', field1: 'value', field2: 0};

describe('Index', () => {
  describe('insert', () => {
    let elasticStub;
    let indexedObject;
    let index;
    let indexName;

    beforeEach(() => {
      elasticStub = sinon.stub(elasticsearchClient, 'index', args => {
        indexedObject = args.body;
        indexName = args.index;

        return new Promise(resolve => {
          resolve({_id: '123', _source: indexedObject});
        });
      });

      const Index = require('../../lib/index');
      index = new Index(testIndexName);
    });

    afterEach(() => {
      elasticStub.restore();
      indexedObject = undefined;
      indexName = undefined;
    });

    it('adds the object to elasticsearch', () => {
      return index.insert(testObject).then(() => {
        expect(indexedObject).to.be.equal(testObject);
      });
    });

    it('writes to the named index', () => {
      return index.insert(testObject).then(() => {
        expect(indexName).to.be.equal(testIndexName);
      });
    });

    it('returns the fields from the indexed object', () => {
      return index.insert(testObject).then(o => {
        _.forOwn(testObject, (value, property) => {
          expect(o).to.have.property(property, value);
        });
      });
    });

    it('returns the generated objectID', () => {
      return index.insert(testObject).then(o => {
        expect(o.objectID).to.be.equal('123');
      });
    });
  });
});
