'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('Search', () => {
  let search;
  let searchArgs;
  let elasticStub;
  const indexName = 'test-index';
  const nonExistantIndexName = 'non-existant-index';
  const testDocument = {name: 'test-item'};

  beforeEach(() => {
    elasticStub = sinon.stub(elasticsearchClient, 'search', args => {
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

    const Search = require('../../lib/search');
    search = new Search(indexName);
  });

  afterEach(() => {
    elasticStub.restore();
    searchArgs = undefined;
  });

  it('returns index not found for unknown index', () => {
    return search.query(nonExistantIndexName, {})
      .then(() => {
        throw new Error('Expected index not found error');
      }, err => {
        expect(err).to.have.property('indexFound', false);
      });
  });

  it('prevents index wildcards', () => {
    return search.query(indexName, {})
      .then(() => {
        expect(searchArgs.expandWildcards).to.equal('none');
        expect(searchArgs.allowNoIndices).to.equal(false);
      });
  });

  it('queries requested index', () => {
    return search.query(indexName, {})
      .then(() => expect(searchArgs.index).to.equal(indexName));
  });

  it('builds a default match all query when no search is supplied', () => {
    const expectedQuery = {
      query: {
        filtered: {}
      },
      size: 10
    };

    return search.query(indexName, {})
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('builds a fuzzy keyword query', () => {
    const expectedQuery = {
      query: {filtered: {query: {simple_query_string: {query: 'some-keyword~1'}}}},
      size: 10
    };

    return search.query(indexName, {query: 'some-keyword'})
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('builds a fuzzy multi keyword query', () => {
    const expectedQuery = {
      query: {filtered: {query: {simple_query_string: {query: 'keyword1~1 keyword2~1'}}}},
      size: 10
    };

    return search.query(indexName, {query: 'keyword1 keyword2'})
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

    return search.query(indexName, {
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

    return search.query(indexName, {
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

    return search.query(indexName, {
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

    return search.query(indexName, {
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

    return search.query(indexName, {
      filters: [{field: 'field1', range: {to: 5}}]
    })
    .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('defaults to page size of 10', () => {
    const expectedQuery = {
      query: {filtered: {}},
      size: 10
    };

    return search.query(indexName, {})
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('builds query with modified page size', () => {
    const expectedQuery = {
      query: {filtered: {}},
      size: 50
    };

    return search.query(indexName, {hitsPerPage: 50})
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('builds query with page number', () => {
    const expectedQuery = {
      query: {filtered: {}},
      size: 10,
      from: 10
    };

    return search.query(indexName, {page: 2})
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('builds sorted query with default order', () => {
    const expectedQuery = {
      query: {filtered: {}},
      size: 10,
      sort: ['field1']
    };

    return search.query(indexName, {sort: [{field: 'field1'}]})
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('builds sorted query with explicit order', () => {
    const expectedQuery = {
      query: {filtered: {}},
      size: 10,
      sort: [{field1: {order: 'asc'}}]
    };

    return search.query(indexName, {sort: [{field: 'field1', direction: 'asc'}]})
      .then(() => expect(searchArgs.body).to.deep.equal(expectedQuery));
  });

  it('returns document source', () => {
    return search.query(indexName, {query: 'some-keyword'})
      .then(results => expect(results.hits[0]).to.deep.equal(testDocument));
  });
});
