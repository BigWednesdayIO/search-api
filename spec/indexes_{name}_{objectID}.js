'use strict';

const _ = require('lodash');
const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/{objectID}', () => {
  const testIndexName = `test_index_${cuid()}`;
  const clientIndexName = `1_${testIndexName}`;
  const testObject = {name: 'an object', field1: 'some value', field2: false};
  let indexedObject;

  before(() => {
    return elasticsearchClient.index({
      index: clientIndexName,
      type: 'object',
      body: testObject,
      refresh: true
    })
    .then(o => {
      indexedObject = o;
    });
  });

  after(() => {
    return elasticsearchClient.indices.delete({index: clientIndexName});
  });

  describe('get', () => {
    it('indexed objects can be retrieved', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/${indexedObject._id}`,
        headers: {Authorization: 'Bearer 12345'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result.objectID).to.equal(indexedObject._id);

          _.forOwn(testObject, (value, property) => {
            expect(response.result).to.have.property(property, value);
          });
        });
    });

    it('returns a 404 when the index does not contain the identified object', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/12345`,
        headers: {Authorization: 'Bearer 12345'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index does not contain object with identifier 12345');
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: '/1/indexes/nonexistantindex/12345',
        headers: {Authorization: 'Bearer 12345'}
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
        headers: {Authorization: 'Bearer 12345'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(201);
          expect(response.headers.location).to.equal(`/1/indexes/${testIndexName}/12345`);
        })
        .then(() => {
          // TODO: replace once async indexing is in place
          return elasticsearchClient.get({
            index: clientIndexName,
            type: 'object',
            id: '12345'
          }).then(o => {
            expect(o._source).to.be.deep.equal(testObject);
          });
        });
    });

    it('updates existing objects in an index', () => {
      const update = {name: 'another object', aField: 'value'};
      return specRequest({
        url: `/1/indexes/${testIndexName}/${indexedObject._id}`,
        method: 'put',
        payload: update,
        headers: {Authorization: 'Bearer 12345'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);
        })
        .then(() => {
          // TODO: replace once async indexing is in place
          return elasticsearchClient.get({
            index: clientIndexName,
            type: 'object',
            id: indexedObject._id
          }).then(o => {
            expect(o._source).to.be.deep.equal(update);
          });
        });
    });
  });

  describe('delete', () => {
    it('removes the object from the index', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/${indexedObject._id}`,
        method: 'delete',
        headers: {Authorization: 'Bearer 12345'}
      })
        .then(response => {
          expect(response.statusCode).to.equal(204);

          // TODO: replace once async indexing is in place
          return elasticsearchClient.get({
            index: clientIndexName,
            type: 'object',
            id: indexedObject._id
          }).then(() => {
            throw new Error('Object not removed from index');
          }, err => {
            expect(err).to.have.deep.property('body.found', false);
          });
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: '/1/indexes/nonexistantindex/12345',
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
