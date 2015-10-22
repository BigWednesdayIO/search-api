'use strict';

const SearchIndex = require('../../../lib/search_index');
const elasticsearchClient = require('../../../lib/elasticsearchClient');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('Search Index', () => {
  describe('query', () => {
    let searchIndex;
    let searchArgs;
    let searchStub;
    let getMappingStub;
    const indexName = 'test-index';
    const nonExistantIndexName = 'non-existant-index';
    const testDocument = {name: 'test-item'};

    beforeEach(() => {
      searchStub = sinon.stub(elasticsearchClient, 'search', args => {
        searchArgs = args;

        if (args.index === nonExistantIndexName) {
          const err = new Error('IndexMissingException');
          err.status = 404;
          return Promise.reject(err);
        }

        return Promise.resolve({
          hits: {hits: [{_id: '1', _source: testDocument}]}
        });
      });

      getMappingStub = sinon.stub(elasticsearchClient.indices, 'getMapping', args => {
        if (args.index === 'nomapping') {
          return Promise.resolve({
            testIndex: {
              mappings: {}
            }
          });
        }

        if (args.index === 'nosettings') {
          return Promise.resolve({
            testIndex: {
              mappings: {
                object: {
                  properties: {one: {}}
                }
              }
            }
          });
        }

        const mapping = {
          testIndex: {
            mappings: {
              object: {
                _meta: {indexSettings: {searchable_fields: ['test']}}
              }
            }
          }
        };

        return Promise.resolve(mapping);
      });

      searchIndex = new SearchIndex(indexName);
    });

    afterEach(() => {
      searchStub.restore();
      getMappingStub.restore();
      searchArgs = undefined;
    });

    it('returns index not found for unknown index', () => {
      return new SearchIndex(nonExistantIndexName).query({})
        .then(() => {
          throw new Error('Expected index not found error');
        }, err => {
          expect(err).to.have.property('indexFound', false);
        });
    });

    it('prevents index wildcards', () => {
      return searchIndex.query({})
        .then(() => {
          expect(searchArgs.expandWildcards).to.equal('none');
          expect(searchArgs.allowNoIndices).to.equal(false);
        });
    });

    it('does not execute a search against an index containing no mapping', () => {
      // when index exists but there is no mapping - should never actually happen
      return new SearchIndex('nomapping').query({})
        .then(result => {
          sinon.assert.notCalled(searchStub);
          expect(result.hits).to.have.length(0);
        });
    });

    it('queries requested index', () => {
      return searchIndex.query({})
        .then(() => expect(searchArgs.index).to.equal(indexName));
    });

    it('builds a default match all query when no search is supplied', () => {
      const expectedQuery = {
        query: {
          filtered: {}
        },
        size: 10
      };

      return searchIndex.query({})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a non-fuzzy keyword for a query shorter than 4 characters', () => {
      const expectedQuery = {
        query: {filtered: {query: {simple_query_string: {query: 'abc', default_operator: 'and', fields: ['test']}}}},
        size: 10
      };

      return searchIndex.query({query: 'abc'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a query for every field in the index when no settings are present', () => {
      // when index is created and contains data but no settings
      const expectedQuery = {
        query: {filtered: {query: {simple_query_string: {query: 'abc', default_operator: 'and', fields: ['one']}}}},
        size: 10
      };

      return new SearchIndex('nosettings').query({query: 'abc'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a distance 1 fuzzy keyword query for a query at least 4 characters long', () => {
      const expectedQuery = {
        query: {filtered: {query: {simple_query_string: {query: 'abcd~1', default_operator: 'and', fields: ['test']}}}},
        size: 10
      };

      return searchIndex.query({query: 'abcd'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a distance 2 fuzzy keyword query for a query at least 8 characters long', () => {
      const expectedQuery = {
        query: {filtered: {query: {simple_query_string: {query: 'abcdefgh~2', default_operator: 'and', fields: ['test']}}}},
        size: 10
      };

      return searchIndex.query({query: 'abcdefgh'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a fuzzy multi keyword query', () => {
      const expectedQuery = {
        query: {filtered: {query: {simple_query_string: {query: 'keyword1~2 keyword2~2', default_operator: 'and', fields: ['test']}}}},
        size: 10
      };

      return searchIndex.query({query: 'keyword1 keyword2'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a term filtered query', () => {
      const expectedQuery = {
        query: {
          filtered: {
            filter: {and: [{term: {field1: 'term1'}}, {term: {field2: 'term2'}}]}
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'field1', term: 'term1'}, {field: 'field2', term: 'term2'}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a range filtered query', () => {
      const expectedQuery = {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {gte: 1, lte: 2}}}]}
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'field1', range: {from: 1, to: 2}}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds lower bound only range filtered query', () => {
      const expectedQuery = {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {gte: 1}}}]}
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'field1', range: {from: 1}}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds upper bound only range filtered query', () => {
      const expectedQuery = {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {lte: 5}}}]}
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'field1', range: {to: 5}}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds upper bound only range filtered query', () => {
      const expectedQuery = {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {lte: 5}}}]}
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'field1', range: {to: 5}}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('defaults to page size of 10', () => {
      const expectedQuery = {
        query: {filtered: {}},
        size: 10
      };

      return searchIndex.query({})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds query with modified page size', () => {
      const expectedQuery = {
        query: {filtered: {}},
        size: 50
      };

      return searchIndex.query({hitsPerPage: 50})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds query with page number', () => {
      const expectedQuery = {
        query: {filtered: {}},
        size: 10,
        from: 10
      };

      return searchIndex.query({page: 2})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds sorted query with default order', () => {
      const expectedQuery = {
        query: {filtered: {}},
        size: 10,
        sort: ['field1']
      };

      return searchIndex.query({sort: [{field: 'field1'}]})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds sorted query with explicit order', () => {
      const expectedQuery = {
        query: {filtered: {}},
        size: 10,
        sort: [{field1: {order: 'asc'}}]
      };

      return searchIndex.query({sort: [{field: 'field1', direction: 'asc'}]})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('returns document source', () => {
      return searchIndex.query({query: 'some-keyword'})
        .then(results => expect(results.hits[0]).to.deep.equal(testDocument));
    });
  });
});
