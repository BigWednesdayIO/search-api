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

  it('builds a default match all query when no search is supplied', () => {
    const expected = {
      index: indexName,
      body: {query: {filtered: {}}, size: 10}
    };

    return search.query(indexName, {})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds a keyword query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {filtered: {query: {match: {_all: 'some-keyword'}}}},
        size: 10
      }
    };

    return search.query(indexName, {query: 'some-keyword'})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds a term filtered query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {
          filtered: {
            filter: {and: [{term: {field1: 'term1'}}, {term: {field2: 'term2'}}]}
          }
        },
        size: 10
      }
    };

    return search.query(indexName, {
      filters: [{field: 'field1', term: 'term1'}, {field: 'field2', term: 'term2'}]
    })
    .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds a range filtered query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {gte: 1, lte: 2}}}]}
          }
        },
        size: 10
      }
    };

    return search.query(indexName, {
      filters: [{field: 'field1', range: {from: 1, to: 2}}]
    })
    .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds lower bound only range filtered query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {gte: 1}}}]}
          }
        },
        size: 10
      }
    };

    return search.query(indexName, {
      filters: [{field: 'field1', range: {from: 1}}]
    })
    .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds upper bound only range filtered query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {lte: 5}}}]}
          }
        },
        size: 10
      }
    };

    return search.query(indexName, {
      filters: [{field: 'field1', range: {to: 5}}]
    })
    .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds upper bound only range filtered query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {
          filtered: {
            filter: {and: [{range: {field1: {lte: 5}}}]}
          }
        },
        size: 10
      }
    };

    return search.query(indexName, {
      filters: [{field: 'field1', range: {to: 5}}]
    })
    .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('defaults to page size of 10', () => {
    const expected = {
      index: indexName,
      body: {
        query: {filtered: {}},
        size: 10
      }
    };

    return search.query(indexName, {})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds query with modified page size', () => {
    const expected = {
      index: indexName,
      body: {
        query: {filtered: {}},
        size: 50
      }
    };

    return search.query(indexName, {hitsPerPage: 50})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds query with page number', () => {
    const expected = {
      index: indexName,
      body: {
        query: {filtered: {}},
        size: 10,
        from: 10
      }
    };

    return search.query(indexName, {page: 2})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds sorted query with default order', () => {
    const expected = {
      index: indexName,
      body: {
        query: {filtered: {}},
        size: 10,
        sort: ['field1']
      }
    };

    return search.query(indexName, {sort: [{field: 'field1'}]})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds sorted query with explicit order', () => {
    const expected = {
      index: indexName,
      body: {
        query: {filtered: {}},
        size: 10,
        sort: [{field1: {order: 'asc'}}]
      }
    };

    return search.query(indexName, {sort: [{field: 'field1', direction: 'asc'}]})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('returns document source', () => {
    return search.query(indexName, {query: 'some-keyword'})
      .then(results => expect(results[0]).to.deep.equal(testDocument));
  });
});
