'use strict';

const cuid = require('cuid');

const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('Indexes', function () {
  describe('indexing', function () {
    const payload = {name: 'object', field: 'value'};
    const testIndexName = 'test_index_' + cuid();
    let createResponse;

    before(function () {
      return specRequest({url: '/1/indexes/' + testIndexName, method: 'post', payload: payload})
        .then(function (response) {
          createResponse = response;
        });
    });

    it('accepts a new object', function () {
      expect(createResponse.statusCode).to.equal(201);
    });

    describe('indexing task', function () {
      it('can be retrieved', function () {
        return specRequest({url: createResponse.headers.location})
          .then(function (response) {
            expect(response.statusCode).to.equal(200);
            expect(response.id).to.equal(createResponse.taskID);
            expect(response.objectID).to.equal(createResponse.objectID);
          });
      });
    });
  });
});
