'use strict';

const _ = require('lodash');
const sinon = require('sinon');

const elasticsearchClient = require('../../../lib/elasticsearchClient');
const SearchIndex = require('../../../lib/search_index');

describe('Search Index', () => {
  describe('query', () => {
    let searchStub;
    let getMappingStub;

    before(() => {
      searchStub = sinon.stub(elasticsearchClient, 'search', () => {
        return Promise.resolve({hits: {hits: []}});
      });

      getMappingStub = sinon.stub(elasticsearchClient.indices, 'getMapping', () => {
        const mapping = {
          testIndex: {
            mappings: {
              object: {
                _meta: {indexSettings: {searchable_fields: ['one', 'two', 'three']}}
              }
            }
          }
        };

        return Promise.resolve(mapping);
      });
    });

    after(() => {
      searchStub.restore();
      getMappingStub.restore();
    });

    it('applies boosts to fields based on position in searchable_fields setting', () => {
      const expectedQuery = {
        query: {filtered: {query: {simple_query_string: {query: 'some-keyword~1', fields: ['three', 'two^1.1', 'one^1.2']}}}},
        size: 10
      };

      return new SearchIndex('index').query({query: 'some-keyword'})
        .then(() => {
          sinon.assert.calledWith(searchStub, sinon.match(value => {
            return _.eq(value.body, expectedQuery);
          }, 'query'));
        });
    });
  });
});
