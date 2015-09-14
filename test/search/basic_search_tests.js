'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('Search', () => {
  let search;
  let searchArgs;
  let elasticStub;
  const indexName = 'test-index';
  const testDocument = {name: 'test-item'};

  beforeEach(() => {
    elasticStub = sinon.stub(elasticsearchClient, 'search', args => {
      searchArgs = args;
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

  it('builds a default match all query when no search is supplied', () => {
    const expected = {
      index: indexName,
      body: {query: {filtered: {}}}
    };

    return search.query(indexName, {})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds a keyword query', () => {
    const expected = {
      index: indexName,
      body: {query: {filtered: {query: {match: {_all: 'some-keyword'}}}}}
    };

    return search.query(indexName, {query: 'some-keyword'})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('builds a filtered query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {
          filtered: {
            filter: {and: [{term: {field1: 'term1'}}, {term: {field2: 'term2'}}]}
          }
        }
      }
    };

    return search.query(indexName, {
      filters: [{field: 'field1', term: 'term1'}, {field: 'field2', term: 'term2'}]
    })
    .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('returns document source', () => {
    return search.query(indexName, {query: 'some-keyword'})
      .then(results => expect(results[0]).to.deep.equal(testDocument));
  });
});
