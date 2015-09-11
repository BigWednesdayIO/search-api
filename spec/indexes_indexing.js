'use strict';

const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('Indexes', function () {
  describe('indexing', function () {
    const testIndexName = 'test_index_' + cuid();

    afterEach(function () {
      return elasticsearchClient.indices.delete({index: testIndexName});
    });

    it('accepts a new object', function () {
      const payload = {name: 'object', field: 'value'};

      return specRequest({url: '/1/indexes/' + testIndexName, method: 'post', payload: payload})
        .then(function (response) {
          expect(response.statusCode).to.equal(200);
        });
    });
  });
});
