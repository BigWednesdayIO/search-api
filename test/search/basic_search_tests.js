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

  it('builds a keyword query', () => {
    const expected = {
      index: indexName,
      body: {
        query: {match: {_all: 'some-keyword'}}
      }
    };

    return search.query(indexName, {query: 'some-keyword'})
      .then(() => expect(searchArgs).to.deep.equal(expected));
  });

  it('returns document source', () => {
    return search.query(indexName, {query: 'some-keyword'})
      .then(results => expect(results[0]).to.deep.equal(testDocument));
  });
});
