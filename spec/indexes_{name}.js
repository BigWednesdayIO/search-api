'use strict';

const cuid = require('cuid');

const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('Indexes', () => {
  const payload = {name: 'object', field: 'value'};
  const testIndexName = 'test_index_' + cuid();
  let createResponse;

  before(() => {
    return specRequest({url: '/1/indexes/' + testIndexName, method: 'post', payload: payload})
      .then(response => {
        createResponse = response;
      });
  });

  it('accepts a new object', () => {
    expect(createResponse.statusCode).to.equal(201);
  });

  describe('indexing tasks', () => {
    it('can be retrieved', () => {
      return specRequest({url: createResponse.headers.location})
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result.id).to.equal(createResponse.result.taskID);
          expect(response.result.objectID).to.equal(createResponse.result.objectID);
        });
    });
  });
});
