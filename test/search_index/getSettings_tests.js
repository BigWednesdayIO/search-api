'use strict';

const expect = require('chai').expect;

const SearchIndex = require('../../lib/search_index');

describe('Search Index', () => {
  describe('getSettings', () => {
    it('returns searchable fields that exist in the mapping properties');

    it('returns searchable fields that exist in the mapping templates');

    it('returns index not found errors', () => {
      const index = new SearchIndex('nonexistantindex');

      return index.getSettings()
        .then(() => {
          throw new Error('expected index not found error');
        }, err => {
          expect(err).to.have.property('objectFound', false);
          expect(err).to.have.property('indexFound', false);
        });
    });
  });
});
