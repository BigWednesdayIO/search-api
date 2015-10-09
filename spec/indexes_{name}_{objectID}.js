'use strict';

const _ = require('lodash');
const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/{objectID}', () => {
  const testIndexName = `test_index_${cuid()}`;
  const testObject = {name: 'an object', field1: 'some value', field2: false};
  let indexedObject;

  before(() => {
    return specRequest({
      url: `/1/indexes/${testIndexName}`,
      method: 'POST',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
      payload: testObject
    })
    .then(response => {
      indexedObject = response.result;

      return elasticsearchClient.indices.refresh();
    });
  });

  after(() => {
    return specRequest({
      url: `/1/indexes/${testIndexName}`,
      method: 'DELETE',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    });
  });

  describe('get', () => {
    it('indexed objects can be retrieved', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/${indexedObject.objectID}`,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result.objectID).to.equal(indexedObject.objectID);

          _.forOwn(testObject, (value, property) => {
            expect(response.result).to.have.property(property, value);
          });
        });
    });

    it('returns a 404 when the index does not contain the identified object', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/12345`,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index does not contain object with identifier 12345');
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: '/1/indexes/nonexistantindex/12345',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index nonexistantindex does not exist');
        });
    });
  });

  describe('put', () => {
    it('indexes new objects into an index', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/12345`,
        method: 'put',
        payload: testObject,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(201);
          expect(response.headers.location).to.equal(`/1/indexes/${testIndexName}/12345`);

          return specRequest({
            url: `/1/indexes/${testIndexName}/12345`,
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
          });
        })
        .then(response => {
          expect(response.result.objectID).to.equal('12345');
          expect(_.omit(response.result, 'objectID')).to.deep.equal(testObject);
        });
    });

    it('updates existing objects in an index', () => {
      const update = {name: 'another object', aField: 'value'};

      return specRequest({
        url: `/1/indexes/${testIndexName}/${indexedObject.objectID}`,
        method: 'put',
        payload: update,
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);

          return specRequest({
            url: `/1/indexes/${testIndexName}/${indexedObject.objectID}`,
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
          });
        })
        .then(response => {
          expect(response.result.objectID).to.equal(indexedObject.objectID);
          expect(_.omit(response.result, 'objectID')).to.deep.equal(update);
        });
    });
  });

  describe('delete', () => {
    it('removes the object from the index', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/${indexedObject.objectID}`,
        method: 'delete',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(204);

          return specRequest({
            url: `/1/indexes/${testIndexName}/${indexedObject.objectID}`,
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
          });
        })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.match(/Index does not contain object with identifier/);
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: '/1/indexes/nonexistantindex/12345',
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
