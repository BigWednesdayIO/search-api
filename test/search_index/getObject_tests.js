'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');

const _ = require('lodash');
const sinon = require('sinon');

const expect = require('chai').expect;

const indexData = [{
  indexName: 'one',
  data: []
}, {
  indexName: 'two',
  data: [{
    _id: '1',
    _source: {}
  }, {
    _id: '2',
    _source: {}
  }, {
    _id: '3',
    _source: {
      name: 'test'
    }
  }]
}];

describe('Search Index', () => {
  describe('getObject', () => {
    let index;
    let elasticStub;
    let retrievedObject;

    before(() => {
      elasticStub = sinon.stub(elasticsearchClient, 'get', args => {
        return new Promise((resolve, reject) => {
          const index = _.find(indexData, {indexName: args.index});

          if (!index) {
            const err = new Error('Missing index');
            err.status = 404;
            err.body = {
              error: 'Missing index'
            };

            return reject(err);
          }

          const o = _.find(index.data, {_id: args.id});

          if (!o) {
            const err = new Error('Not found');
            err.status = 404;
            err.body = {
              _index: index.indexName,
              found: false
            };

            return reject(err);
          }

          resolve(o);
        });
      });

      index = new SearchIndex('two');

      return index.getObject('3')
        .then(o => {
          retrievedObject = o;
        });
    });

    after(() => {
      elasticStub.restore();
    });

    it('returns the object fields from the index', () => {
      const expectedData = indexData[1].data[2]._source;

      _.forOwn(expectedData, (value, property) => {
        expect(retrievedObject).to.have.property(property, value);
      });
    });

    it('returns the objectID', () => {
      const expectedId = indexData[1].data[2]._id;
      expect(retrievedObject).to.have.property('objectID', expectedId);
    });

    describe('errors', () => {
      it('returns object not found errors', () => {
        return index.getObject('a')
          .then(() => {
            throw new Error('expected object not found error');
          }, err => {
            expect(err).to.have.property('objectFound', false);
            expect(err).to.have.property('indexFound', true);
          });
      });

      it('returns index not found errors', () => {
        const index = new SearchIndex('nonexistantindex');
        return index.getObject('a')
          .then(() => {
            throw new Error('expected index not found error');
          }, err => {
            expect(err).to.have.property('objectFound', false);
            expect(err).to.have.property('indexFound', false);
          });
      });
    });
  });
});
