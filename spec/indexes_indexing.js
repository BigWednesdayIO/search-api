'use strict';

const _ = require('lodash');
const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('Indexes', () => {
  const testIndexName = 'test_index_' + cuid();
  const testObject = {name: 'object', field: 'value'};
  let createResponse;

  before(() => {
    return specRequest({url: '/1/indexes/' + testIndexName, method: 'post', payload: testObject})
      .then(response => {
        createResponse = response;
      });
  });

  after(() => {
    return elasticsearchClient.indices.delete({index: testIndexName});
  });

  describe('indexing', () => {
    it('accepts a new object', () => {
      expect(createResponse.statusCode).to.equal(201);
    });
  });

  describe('retrieving objects', () => {
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

    it('returns a 404 when the index does not contain the identified object', () => {
      return specRequest({url: '/1/indexes/' + testIndexName + '/12345'})
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index does not contain object with identifier 12345');
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({url: '/1/indexes/nonexistantindex/12345'})
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index nonexistantindex does not exist');
        });
    });
  });
});
