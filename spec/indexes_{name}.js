'use strict';

const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}', () => {
  const testIndexName = `test_index_${cuid()}`;
  const clientIndexName = `1_${testIndexName}`;
  const testObject = {name: 'object', field: 'value'};
  let createResponse;

  before(() => {
    return specRequest({
      url: `/1/indexes/${testIndexName}`,
      method: 'post',
      payload: testObject,
      headers: {Authorization: 'Bearer 12345'}
    })
      .then(response => {
        createResponse = response;
      });
  });

  after(() => {
    return elasticsearchClient.indices.delete({index: clientIndexName});
  });

  describe('post', () => {
    it('indexes a new object', () => {
      expect(createResponse.statusCode).to.equal(201);
      expect(createResponse.headers.location).to.equal(`/1/indexes/${testIndexName}/${createResponse.result.objectID}`);

      // TODO: replace once async indexing is in place
      return elasticsearchClient.get({
        index: clientIndexName,
        type: 'object',
        id: createResponse.result.objectID
      }).then(o => {
        expect(o._source).to.be.deep.equal(testObject);
      });
    });
  });

  describe('delete', () => {
    const deleteIndexName = `test_index_${cuid()}`;
    const deleteClientIndexName = `1_${deleteIndexName}`;

    before(() => {
      return specRequest({
        url: `/1/indexes/${deleteIndexName}`,
        method: 'post',
        payload: testObject,
        headers: {Authorization: 'Bearer 12345'}
      });
    });

    it('deletes the index', () => {
      return specRequest({
        url: `/1/indexes/${deleteIndexName}`,
        method: 'delete',
        headers: {Authorization: 'Bearer 12345'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(204);

          // TODO: replace once async indexing is in place
          return elasticsearchClient.indices.get({index: deleteClientIndexName})
            .then(() => {
              throw new Error('Expected index to not exist');
            }, err => {
              expect(err.status).to.equal(404);
            });
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: `/1/indexes/nonexistantindex`,
        method: 'delete',
        headers: {Authorization: 'Bearer 12345'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index nonexistantindex does not exist');
        });
    });
  });
});
