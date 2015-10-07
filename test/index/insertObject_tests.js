'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

const _ = require('lodash');
const sinon = require('sinon');

const expect = require('chai').expect;

const testNewIndexName = 'my-index-name';
const testExistingIndexName = 'existing-index-name';

const testObject = {name: 'an object', field1: 'value', field2: 0};

describe('Search Index', () => {
  describe('insertObject', () => {
    let indexStub;
    let getAliasStub;
    let createIndexStub;
    let putAliasStub;
    let indexedObject;
    let SearchIndex;
    let indexName;
    let clock;
    const testDate = new Date();
    const indexNameDateString = `${testDate.getFullYear()}.${testDate.getMonth() + 1}.${testDate.getDate()}.${testDate.getMilliseconds()}`;

    before(() => {
      clock = sinon.useFakeTimers(testDate.getTime());
    });

    beforeEach(() => {
      indexStub = sinon.stub(elasticsearchClient, 'index', args => {
        indexedObject = args.body;
        indexName = args.index;

        return Promise.resolve({_id: '123'});
      });

      getAliasStub = sinon.stub(elasticsearchClient.indices, 'getAlias', args => {
        if (args.name === testExistingIndexName) {
          return Promise.resolve({
            anIndex: {
              aliases: {
                [testExistingIndexName]: {}
              }
            }
          });
        }

        if (args.ignore === 404) {
          return Promise.resolve({});
        }

        const err = new Error();
        err.error = `alias [${args.name}] missing`;
        err.status = 404;

        return Promise.reject(err);
      });

      createIndexStub = sinon.stub(elasticsearchClient.indices, 'create', () => {
        return Promise.resolve({});
      });

      putAliasStub = sinon.stub(elasticsearchClient.indices, 'putAlias', () => {
        return Promise.resolve({});
      });

      SearchIndex = require('../../lib/search_index');
    });

    afterEach(() => {
      indexStub.restore();
      getAliasStub.restore();
      createIndexStub.restore();
      putAliasStub.restore();
      indexedObject = undefined;
      indexName = undefined;
    });

    after(() => {
      clock.restore();
    });

    describe('when the index does not exist', () => {
      const expectedUniqueIndexName = `${testNewIndexName}_${indexNameDateString}`;

      beforeEach(() => {
        const index = new SearchIndex(testNewIndexName);
        return index.insertObject(testObject);
      });

      it('creates the index with a unique name', () => {
        sinon.assert.calledOnce(createIndexStub);
        sinon.assert.calledWith(createIndexStub, {index: expectedUniqueIndexName});
      });

      it('sets the index name as an alias', () => {
        sinon.assert.calledOnce(putAliasStub);
        sinon.assert.calledWith(putAliasStub, {index: expectedUniqueIndexName, name: testNewIndexName});
      });
    });

    describe('when the index exists', () => {
      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);
        return index.insertObject(testObject);
      });

      it('does not create a new index', () => {
        sinon.assert.notCalled(createIndexStub);
        sinon.assert.notCalled(putAliasStub);
      });
    });

    describe('insertion', () => {
      let insertResult;

      beforeEach(() => {
        const index = new SearchIndex(testNewIndexName);
        return index.insertObject(testObject).then(o => {
          insertResult = o;
        });
      });

      it('adds the object to elasticsearch', () => {
        expect(indexedObject).to.be.equal(testObject);
      });

      it('writes to the named index', () => {
        expect(indexName).to.be.equal(testNewIndexName);
      });

      it('returns the fields from the indexed object', () => {
        _.forOwn(testObject, (value, property) => {
          expect(insertResult).to.have.property(property, value);
        });
      });

      it('returns the generated objectID', () => {
        expect(insertResult.objectID).to.be.equal('123');
      });
    });
  });
});
