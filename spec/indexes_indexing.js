'use strict';

const _ = require('lodash');
const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('Indexes', () => {
  describe('indexing', () => {
    let createResponse;
    const testObject = {name: 'object', field: 'value'};
    const testIndexName = 'test_index_' + cuid();

    before(() => {
      return specRequest({url: '/1/indexes/' + testIndexName, method: 'post', payload: testObject})
        .then(response => {
          createResponse = response;
        });
    });

    after(() => {
      return elasticsearchClient.indices.delete({index: testIndexName});
    });

    it('accepts a new object', () => {
      expect(createResponse.statusCode).to.equal(201);
    });

    it('allows indexed objects to be retrieved', () => {
      return specRequest({url: createResponse.headers.location})
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result.objectID).to.equal(createResponse.result.objectID);

          _.forOwn(testObject, (value, property) => {
            expect(response.result).to.have.property(property, value);
          });
        });
    });
  });
});
