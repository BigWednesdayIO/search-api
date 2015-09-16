'use strict';

const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}', () => {
  const testIndexName = `test_index_${cuid()}`;
  const testObject = {name: 'object', field: 'value'};
  let createResponse;

  before(() => {
    return specRequest({url: `/1/indexes/${testIndexName}`, method: 'post', payload: testObject})
      .then(response => {
        createResponse = response;
      });
  });

  after(() => {
    return elasticsearchClient.indices.delete({index: testIndexName});
  });

  describe('post', () => {
    it('indexes a new object', () => {
      expect(createResponse.statusCode).to.equal(201);
      expect(createResponse.headers.location).to.equal(`/1/indexes/${testIndexName}/${createResponse.result.objectID}`);

      // TODO: replace once async indexing is in place
      return elasticsearchClient.get({
        index: testIndexName,
        type: 'object',
        id: createResponse.result.objectID
      }).then(o => {
        expect(o._source).to.be.deep.equal(testObject);
      });
    });
  });
});
