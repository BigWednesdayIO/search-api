'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');

const testExistingIndexName = 'existing-index-name';
const testObject = {name: 'an object', field1: 'value', field2: 0};

describe('Search Index', () => {
  describe('insertObject', () => {
    let sandbox;
    let indexStub;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      indexStub = sandbox.stub(elasticsearchClient, 'index', () => Promise.resolve({_id: '123'}));

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
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('insertion', () => {
      let insertResult;

      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);
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
        sinon.assert.calledWith(indexStub, sinon.match({index: testExistingIndexName}));
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
