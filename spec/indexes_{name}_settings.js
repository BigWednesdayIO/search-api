'use strict';

const cuid = require('cuid');

const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/settings', () => {
  const testIndexName = `test_index_${cuid()}`;

  after(() => {
    return specRequest({
      url: `/indexes/${testIndexName}`,
      method: 'DELETE',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    });
  });

  describe('put', () => {
    it('accepts settings', () => {
      const settings = {searchable_fields: ['one', 'two', 'three'], facets: [{field: 'one', order: 'count'}, {field: 'two', order: 'count'}]};

      return specRequest({
        url: `/indexes/${testIndexName}/settings`,
        method: 'put',
        payload: settings,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result).to.deep.equal(settings);
        });
    });
  });

  describe('get', () => {
    before(() => {
      return specRequest({
        url: `/indexes/${testIndexName}/settings`,
        method: 'put',
        payload: {searchable_fields: ['one', 'two', 'three', 'four'], facets: [{field: 'a', order: 'count'}, {field: 'b', order: 'count'}]},
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      });
    });

    it('returns settings', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/settings`,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result).to.deep.equal({searchable_fields: ['one', 'two', 'three', 'four'], facets: [{field: 'a', order: 'count'}, {field: 'b', order: 'count'}]});
        });
    });

    it('returns a 404 response when the index does not exist', () => {
      return specRequest({
        url: `/indexes/nonexistantindex/settings`,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal(`Index nonexistantindex does not exist`);
        });
    });
  });
});
