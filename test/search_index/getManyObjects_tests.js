'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const sinon = require('sinon');

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');
const index = new SearchIndex('an-index');

const indexedObjects = [
  {_id: '1', found: true, _source: {name: 'test1', test: 'value'}},
  {found: false},
  {_id: '3', found: true, _source: {name: 'test3', test: 'another value'}}
];

describe('Search index', () => {
  describe('getManyObjects', () => {
    let returnedObjects;
    let mgetStub;

    before(() => {
      mgetStub = sinon.stub(elasticsearchClient, 'mget', args => {
        if (args.index === 'missing') {
          const indexNotFoundResult = {found: false, error: {type: 'index_not_found_exception'}};
          return Promise.resolve({docs: [indexNotFoundResult, indexNotFoundResult]});
        }

        return Promise.resolve({docs: indexedObjects});
      });

      return index.getManyObjects(['1', '2', '3'])
        .then(o => returnedObjects = o);
    });

    after(() => mgetStub.restore());

    it('returns only found objects', () => {
      expect(returnedObjects).to.have.length(2);
    });

    it('returns objectIDs', () => {
      expect(returnedObjects.map(o => o.objectID)).to.deep.equal(['1', '3']);
    });

    it('returns the object attributes', () => {
      indexedObjects.filter(o => o.found).forEach((indexedObject, i) => {
        _.forOwn(indexedObject._source, (value, key) => expect(returnedObjects[i]).to.have.property(key, value));
      });
    });

    it('returns index not found errors', () => {
      return new SearchIndex('missing')
        .getManyObjects(['1', '2'])
        .then(() => {
          throw new Error('expected index not found error');
        }, err => {
          expect(err).to.be.an('error');
          expect(err.indexFound).to.equal(false);
        });
    });
  });
});
