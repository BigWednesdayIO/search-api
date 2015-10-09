'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');

const testNewIndexName = 'my-index-name';
const testExistingIndexName = 'existing-index-name';
const testObject = {name: 'an object', field1: 'value', field2: 0};

describe('Search Index', () => {
  describe('insertObject', () => {
    let sandbox;
    let indexStub;
    let createIndexStub;
    let putAliasStub;
    let SearchIndex;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      indexStub = sandbox.stub(elasticsearchClient, 'index', () => {
        return Promise.resolve({_id: '123'});
      });

      sandbox.stub(elasticsearchClient.indices, 'getAlias', args => {
        if (args.name === testExistingIndexName) {
          return Promise.resolve({
            anIndex: {
              aliases: {
                [testExistingIndexName]: {}
              }
            }
          });
        }

        const err = new Error();
        err.error = `alias [${args.name}] missing`;
        err.status = 404;

        return Promise.reject(err);
      });

      createIndexStub = sandbox.stub(elasticsearchClient.indices, 'create', () => {
        return Promise.resolve({});
      });

      putAliasStub = sandbox.stub(elasticsearchClient.indices, 'putAlias', () => {
        return Promise.resolve({});
      });

      SearchIndex = require('../../lib/search_index');
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('when the index does not exist', () => {
      let expectedUniqueIndexName;

      beforeEach(() => {
        const testDate = new Date();
        sandbox.useFakeTimers(testDate.getTime());

        expectedUniqueIndexName = `${testNewIndexName}_${testDate.getFullYear()}.${testDate.getMonth() + 1}.${testDate.getDate()}.${testDate.getMilliseconds()}`;

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
        sinon.assert.calledOnce(indexStub);
        sinon.assert.calledWith(indexStub, sinon.match({body: testObject}));
      });

      it('writes to the named index', () => {
        sinon.assert.calledOnce(indexStub);
        sinon.assert.calledWith(indexStub, sinon.match({index: testNewIndexName}));
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
