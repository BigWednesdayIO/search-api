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
          hits: {total: 1, hits: [{_id: 'abc', _source: testDocument}]}
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
                _meta: {indexSettings: {searchable_fields: ['test']}},
                properties: {
                  field1: {
                    type: 'double'
                  },
                  str1: {
                    type: 'string'
                  },
                  str2: {
                    type: 'string'
                  }
                }
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
          bool: {}
        },
        size: 10
      };

      return searchIndex.query({})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a non-fuzzy keyword for a query shorter than 4 characters', () => {
      const expectedQuery = {
        query: {bool: {must: {simple_query_string: {query: 'abc', default_operator: 'and', fields: ['test'], lenient: true}}}},
        size: 10
      };

      return searchIndex.query({query: 'abc'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a query for every field in the index when no settings are present', () => {
      // when index is created and contains data but no settings
      const expectedQuery = {
        query: {bool: {must: {simple_query_string: {query: 'abc', default_operator: 'and', fields: ['one'], lenient: true}}}},
        size: 10
      };

      return new SearchIndex('nosettings').query({query: 'abc'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a distance 1 fuzzy keyword query for a query at least 4 characters long', () => {
      const expectedQuery = {
        query: {bool: {must: {simple_query_string: {query: 'abcd~1', default_operator: 'and', fields: ['test'], lenient: true}}}},
        size: 10
      };

      return searchIndex.query({query: 'abcd'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a distance 2 fuzzy keyword query for a query at least 8 characters long', () => {
      const expectedQuery = {
        query: {bool: {must: {simple_query_string: {query: 'abcdefgh~2', default_operator: 'and', fields: ['test'], lenient: true}}}},
        size: 10
      };

      return searchIndex.query({query: 'abcdefgh'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a fuzzy multi keyword query', () => {
      const expectedQuery = {
        query: {bool: {must: {simple_query_string: {query: 'keyword1~2 keyword2~2', default_operator: 'and', fields: ['test'], lenient: true}}}},
        size: 10
      };

      return searchIndex.query({query: 'keyword1 keyword2'})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a term filtered query on raw string fields', () => {
      const expectedQuery = {
        query: {
          bool: {
            filter: [{term: {'str1.raw': 'term1'}}, {term: {'str2.raw': 'term2'}}]
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'str1', term: 'term1'}, {field: 'str2', term: 'term2'}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a term filtered query on non-string fields', () => {
      const expectedQuery = {
        query: {
          bool: {
            filter: [{term: {'str1.raw': 'term1'}}, {term: {field1: 123}}]
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'str1', term: 'term1'}, {field: 'field1', term: 123}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a terms filtered query on raw string fields', () => {
      const expectedQuery = {
        query: {
          bool: {
            filter: [{terms: {'str1.raw': ['term1', 'term2']}}]
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'str1', terms: ['term1', 'term2']}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a terms filtered query on non-string fields', () => {
      const expectedQuery = {
        query: {
          bool: {
            filter: [{terms: {field1: [123, 456]}}]
          }
        },
        size: 10
      };

      return searchIndex.query({
        filters: [{field: 'field1', terms: [123, 456]}]
      })
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds a range filtered query', () => {
      const expectedQuery = {
        query: {
          bool: {
            filter: [{range: {field1: {gte: 1, lte: 2}}}]
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
          bool: {
            filter: [{range: {field1: {gte: 1}}}]
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
          bool: {
            filter: [{range: {field1: {lte: 5}}}]
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
          bool: {
            filter: [{range: {field1: {lte: 5}}}]
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
        query: {bool: {}},
        size: 10
      };

      return searchIndex.query({})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds query with modified page size', () => {
      const expectedQuery = {
        query: {bool: {}},
        size: 50
      };

      return searchIndex.query({hitsPerPage: 50})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds query with page number', () => {
      const expectedQuery = {
        query: {bool: {}},
        size: 10,
        from: 10
      };

      return searchIndex.query({page: 2})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds sorted query on raw string field', () => {
      const expectedQuery = {
        query: {bool: {}},
        size: 10,
        sort: ['str1.raw']
      };

      return searchIndex.query({sort: [{field: 'str1'}]})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds sorted query on non-string field', () => {
      const expectedQuery = {
        query: {bool: {}},
        size: 10,
        sort: ['field1']
      };

      return searchIndex.query({sort: [{field: 'field1'}]})
        .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
    });

    it('builds sorted query with explicit order', () => {
      const expectedQuery = {
        query: {bool: {}},
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

    it('returns objectID', () => {
      return searchIndex.query({query: 'some-keyword'})
        .then(results => expect(results.hits[0].objectID).to.equal('abc'));
    });

    it('returns total hits', () => {
      return searchIndex.query({query: 'some-keyword'})
        .then(results => expect(results.totalHits).to.equal(1));
    });
  });
});
