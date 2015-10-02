'use strict';

const expect = require('chai').expect;
const specRequest = require('./spec_request');

describe('endpoint authentcation', () => {
  const tests = [
    {routeName: '/1/indexes/{name}', method: 'POST', url: '/1/indexes/some-index'},
    {routeName: '/1/indexes/{name}', method: 'DELETE', url: '/1/indexes/some-index'},
    {routeName: '/1/indexes/{name}/settings', method: 'PUT', url: '/1/indexes/some-index/settings'},
    {routeName: '/1/indexes/{name}/settings', method: 'GET', url: '/1/indexes/some-index/settings'},
    {routeName: '/1/indexes/{name}/{objectID}', method: 'DELETE', url: '/1/indexes/some-index/1}'},
    {routeName: '/1/indexes/{name}/{objectID}', method: 'PUT', url: '/1/indexes/some-index/1'},
    {routeName: '/1/indexes/{name}/batch', method: 'POST', url: '/1/indexes/some-index/batch'}
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
