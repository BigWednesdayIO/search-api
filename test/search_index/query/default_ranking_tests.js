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
      searchStub = sinon.stub(elasticsearchClient, 'search', () => Promise.resolve({hits: {hits: []}}));

      getMappingStub = sinon.stub(elasticsearchClient.indices, 'getMapping', () => {
        const mapping = {
          testIndex: {
            mappings: {
              object: {
                _meta: {indexSettings: {searchable_fields: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']}}
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
        query: {
          bool: {
            must: {
              simple_query_string: {
                query: 'abc',
                fields: ['l', 'k^1.1', 'j^1.2', 'i^1.3', 'h^1.4', 'g^1.5', 'f^1.6', 'e^1.7', 'd^1.8', 'c^1.9', 'b^2', 'a^2.1'],
                default_operator: 'and'
              }
            }
          }
        },
        size: 10
      };

      return new SearchIndex('index').query({query: 'abc'})
        .then(() => {
          sinon.assert.calledWith(searchStub, sinon.match(value => {
            return _.eq(value.body, expectedQuery);
          }, 'query'));
        });
    });
  });
});
