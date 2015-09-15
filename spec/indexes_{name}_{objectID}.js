'use strict';

const _ = require('lodash');
const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/{objectID}', () => {
  const testIndexName = `test_index_${cuid()}`;
  let indexedObject;

  before(() => {
    return elasticsearchClient.index({
      index: testIndexName,
      type: 'object',
      body: {name: 'an object'}
    })
    .then(o => {
      indexedObject = o;
      elasticsearchClient.indices.refresh({index: testIndexName});
    });
  });

  after(() => {
    return elasticsearchClient.indices.delete({index: testIndexName});
  });

  describe('get', () => {
    it('indexed objects can be retrieved', () => {
      return specRequest({url: `/1/indexes/${testIndexName}/${indexedObject._id}`})
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result.objectID).to.equal(indexedObject._id);

          _.forOwn(indexedObject._source, (value, property) => {
            expect(response.result).to.have.property(property, value);
          });
        });
    });

    it('returns a 404 when the index does not contain the identified object', () => {
      return specRequest({url: `/1/indexes/${testIndexName}/12345`})
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
