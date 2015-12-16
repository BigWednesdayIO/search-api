'use strict';

const expect = require('chai').expect;
const specRequest = require('./spec_request');

describe('endpoint authentication', () => {
  it('accepts token in header', () => {
    return specRequest({
      url: '/indexes/some-index/some-id',
      method: 'GET',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    })
    .then(result => {
      expect(result.statusCode).to.equal(404);
    });
  });

  it('accepts token in query string', () => {
    return specRequest({
      url: '/indexes/some-index/some-id?authorization=8N*b3i[EX[s*zQ%',
      method: 'GET'
    })
    .then(result => {
      expect(result.statusCode).to.equal(404);
    });
  });

  describe('search scope', () => {
    const tests = [
      {routeName: '/indexes/{name}', method: 'POST', url: '/indexes/some-index'},
      {routeName: '/indexes/{name}', method: 'DELETE', url: '/indexes/some-index'},
      {routeName: '/indexes/{name}', method: 'GET', url: '/indexes/some-index?id[]=1'},
      {routeName: '/indexes/{name}/settings', method: 'PUT', url: '/indexes/some-index/settings'},
      {routeName: '/indexes/{name}/settings', method: 'GET', url: '/indexes/some-index/settings'},
      {routeName: '/indexes/{name}/{objectID}', method: 'GET', url: '/indexes/some-index/1'},
      {routeName: '/indexes/{name}/{objectID}', method: 'DELETE', url: '/indexes/some-index/1}'},
      {routeName: '/indexes/{name}/{objectID}', method: 'PUT', url: '/indexes/some-index/1'},
      {routeName: '/indexes/{name}/batch', method: 'POST', url: '/indexes/some-index/batch'},
      {routeName: '/indexes/{name}/query', method: 'POST', url: '/indexes/some-index/query'},
      {routeName: '/indexes/{name}/move', method: 'POST', url: '/indexes/some-index/move'}
    ];

    tests.forEach(test => {
      it(`requires api key for ${test.method} on ${test.routeName}`, () => {
        return specRequest({url: test.url, method: test.method})
          .then(result => {
            expect(result.statusCode).to.equal(401);
          });
      });
    });
  });

  describe('indexing scope', () => {
    const nonIndexScopeToken = 'NG0TuV~u2ni#BP|';
    const tests = [
      {routeName: '/indexes/{name}', method: 'POST', url: '/indexes/some-index', payload: {}},
      {routeName: '/indexes/{name}', method: 'DELETE', url: '/indexes/some-index', payload: {}},
      {routeName: '/indexes/{name}/settings', method: 'PUT', url: '/indexes/some-index/settings', payload: {searchable_fields: [], facets: []}},
      {routeName: '/indexes/{name}/settings', method: 'GET', url: '/indexes/some-index/settings', payload: {}},
      {routeName: '/indexes/{name}/{objectID}', method: 'DELETE', url: '/indexes/some-index/1', payload: {}},
      {routeName: '/indexes/{name}/{objectID}', method: 'PUT', url: '/indexes/some-index/1', payload: {}},
      {routeName: '/indexes/{name}/batch', method: 'POST', url: '/indexes/some-index/batch', payload: {requests: []}},
      {routeName: '/indexes/{name}/move', method: 'POST', url: '/indexes/some-index/move', payload: {destination: '123'}}
    ];

    tests.forEach(test => {
      it(`requires index scope for ${test.method} on ${test.routeName}`, () => {
        return specRequest({url: test.url, method: test.method, headers: {Authorization: `Bearer ${nonIndexScopeToken}`}, payload: test.payload})
          .then(response => {
            expect(response.statusCode).to.equal(403);
            expect(response.result.message).to.equal('Insufficient privileges for index management.');
          });
      });
    });
  });
});
