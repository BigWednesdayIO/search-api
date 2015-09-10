'use strict';

const elasticsearch = require('elasticsearch');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('Search', function () {
  let search;
  let searchArgs;
  let elasticStub;
  const indexName = 'test-index';

  beforeEach(function () {
    elasticStub = sinon.stub(elasticsearch, 'Client', function () {
      return {
        search(args) {
          searchArgs = args;
          return Promise.resolve([{_id: '1'}]);
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

  it('performs keyword search', function () {
    const expected = {
      index: indexName,
      body: {
        query: {match: {_all: 'some-keyword'}}
      }
    };

    return search.query(indexName, {keywords: 'some-keyword'})
      .then(function () {
        expect(searchArgs).to.deep.equal(expected);
      });
  });
});
