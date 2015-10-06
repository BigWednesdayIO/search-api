'use strict';

const expect = require('chai').expect;
const specRequest = require('./spec_request');

describe('endpoint authentication', () => {
  const tests = [
    {routeName: '/1/indexes/{name}', method: 'POST', url: '/1/indexes/some-index'},
    {routeName: '/1/indexes/{name}', method: 'DELETE', url: '/1/indexes/some-index'},
    {routeName: '/1/indexes/{name}/settings', method: 'PUT', url: '/1/indexes/some-index/settings'},
    {routeName: '/1/indexes/{name}/settings', method: 'GET', url: '/1/indexes/some-index/settings'},
    {routeName: '/1/indexes/{name}/{objectID}', method: 'GET', url: '/1/indexes/some-index/1}'},
    {routeName: '/1/indexes/{name}/{objectID}', method: 'DELETE', url: '/1/indexes/some-index/1}'},
    {routeName: '/1/indexes/{name}/{objectID}', method: 'PUT', url: '/1/indexes/some-index/1'},
    {routeName: '/1/indexes/{name}/batch', method: 'POST', url: '/1/indexes/some-index/batch'},
    {routeName: '/1/indexes/{name}/query', method: 'POST', url: '/1/indexes/some-index/batch'}
  ];

  tests.forEach(test => {
    it(`requires api key for ${test.method} on ${test.routeName}`, () => {
      return specRequest({url: test.url, method: test.method})
        .then(result => {
          expect(result.statusCode).to.equal(401);
        });
    });
  });

  describe('indexing scope', () => {
    const nonIndexScopeToken = 'NG0TuV~u2ni#BP|';
    const tests = [
      {routeName: '/1/indexes/{name}', method: 'POST', url: '/1/indexes/some-index', payload: {}},
      {routeName: '/1/indexes/{name}', method: 'DELETE', url: '/1/indexes/some-index', payload: {}},
      {routeName: '/1/indexes/{name}/settings', method: 'PUT', url: '/1/indexes/some-index/settings', payload: {}},
      {routeName: '/1/indexes/{name}/settings', method: 'GET', url: '/1/indexes/some-index/settings', payload: {}},
      {routeName: '/1/indexes/{name}/{objectID}', method: 'DELETE', url: '/1/indexes/some-index/1', payload: {}},
      {routeName: '/1/indexes/{name}/{objectID}', method: 'PUT', url: '/1/indexes/some-index/1', payload: {}},
      {routeName: '/1/indexes/{name}/batch', method: 'POST', url: '/1/indexes/some-index/batch', payload: {requests: []}}
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
