'use strict';

const cuid = require('cuid');
const expect = require('chai').expect;

const specRequest = require('./spec_request');

describe('/indexes/{name}', () => {
  const testIndexName = `test_index_${cuid()}`;
  const testObject = {name: 'object', field: 'value'};
  let createResponse;

  before(() => {
    return specRequest({
      url: `/indexes/${testIndexName}`,
      method: 'post',
      payload: testObject,
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    })
    .then(response => {
      createResponse = response;
    });
  });

  after(() => {
    return specRequest({
      url: `/indexes/${testIndexName}`,
      method: 'DELETE',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    });
  });

  describe('get', () => {
    let indexedObjects;

    before(() => {
      return Promise.all([0, 1, 2].map(i =>
        specRequest({
          url: `/indexes/${testIndexName}`,
          method: 'POST',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload: {test: i}}))
      ).then(responses => indexedObjects = responses.map(r => r.result));
    });

    it('returns objects with ids', () => {
      const objectIds = indexedObjects.map(o => o.objectID);

      return specRequest({
        url: `/indexes/${testIndexName}?id[]=missing&id[]=${objectIds.join('&id[]=')}`,
        method: 'GET',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      }).then(response => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.deep.equal(indexedObjects);
      });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: `/indexes/nonexistantindex?id[]=1`,
        method: 'get',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index nonexistantindex does not exist');
        });
    });
  });

  describe('post', () => {
    it('indexes a new object', () => {
      expect(createResponse.statusCode).to.equal(201);
      expect(createResponse.headers.location).to.equal(`/indexes/${testIndexName}/${createResponse.result.objectID}`);

      return specRequest({
        url: createResponse.headers.location,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result).to.have.property('field', 'value');
        });
    });
  });

  describe('delete', () => {
    const deleteIndexName = `test_index_${cuid()}`;

    before(() => {
      return specRequest({
        url: `/indexes/${deleteIndexName}`,
        method: 'post',
        payload: testObject,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      });
    });

    it('deletes the index', () => {
      return specRequest({
        url: `/indexes/${deleteIndexName}`,
        method: 'delete',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(204);

          return specRequest({
            url: `/indexes/${deleteIndexName}/1`,
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
          })
            .then(response => {
              expect(response.statusCode).to.equal(404);
              expect(response.result.message).to.equal(`Index ${deleteIndexName} does not exist`);
            });
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: `/indexes/nonexistantindex`,
        method: 'delete',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index nonexistantindex does not exist');
        });
    });
  });
});
