'use strict';

const expect = require('chai').expect;

class SearchIndex {
  constructor(name) {
    this.name = name;
  }
}

const SearchIndexFactory = require('../lib/search_index_factory');
const factory = new SearchIndexFactory(SearchIndex);

describe('Search index factory', () => {
  describe('build', () => {
    let index;

    before(() => {
      index = factory.build('my-index-name', {clientId: '1'});
    });

    it('builds a search index', () => {
      expect(index).to.be.an.instanceOf(SearchIndex);
    });

    it('uses the client identifier to create a unique name for the index', () => {
      expect(index.name).to.equal('1_my-index-name');
    });
  });
});
