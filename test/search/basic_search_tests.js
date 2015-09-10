'use strict';

const _ = require('lodash');
const elasticsearch = require('elasticsearch');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('Search', function () {
  let search;
  let searchArgs;
  let elasticStub;
  const indexName = 'test-index';
  const testDocuments = [{_id: '1', _source: {name: 'test-item'}}];

  beforeEach(function () {
    elasticStub = sinon.stub(elasticsearch, 'Client', function () {
      return {
        search(args) {
          searchArgs = args;
          return Promise.resolve(testDocuments);
        }
      };
    });

    const Search = require('../../lib/search');
    search = new Search(indexName);
  });

  afterEach(function () {
    elasticStub.restore();
    searchArgs = undefined;
  });

  it('builds a keyword query', function () {
    const expected = {
      index: indexName,
      body: {
        query: {match: {_all: 'some-keyword'}}
      }
    };

    return search.query(indexName, {keywords: 'some-keyword'})
      .then(() => {
        expect(searchArgs).to.deep.equal(expected);
      });
  });

  it('returns documents', function () {
    return search.query(indexName, {keywords: 'some-keyword'})
      .then(results => {
        expect(results).to.deep.equal(_.pluck(testDocuments, '_source'));
      });
  });
});
