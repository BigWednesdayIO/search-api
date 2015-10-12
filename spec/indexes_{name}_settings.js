'use strict';

const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/settings', () => {
  describe('put', () => {
    it('accepts settings', () => {
      return specRequest({
        url: '/indexes/test-index/settings',
        method: 'put',
        payload: {},
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
        });
    });

    it('returns settings', () => {
      return specRequest({
        url: '/indexes/test-index/settings',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
        });
    });
  });
});
