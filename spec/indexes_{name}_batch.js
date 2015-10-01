'use strict';

const cuid = require('cuid');

const specRequest = require('./spec_request');
const elasticsearchClient = require('../lib/elasticsearchClient');

const expect = require('chai').expect;

describe('/indexes/{name}/batch', () => {
  const testIndexName = `test_index_${cuid()}`;

  describe('post', () => {
    after(() => {
      return elasticsearchClient.indices.delete({index: testIndexName});
    });

    describe('create operation', () => {
      it('adds new objects to the index', () => {
        const payload = {
          requests: [{
            action: 'create',
            body: {
              name: 'object 1'
            }
          }, {
            action: 'create',
            body: {
              name: 'object 2'
            }
          }]
        };

        return specRequest({url: `/1/indexes/${testIndexName}/batch`, method: 'post', payload})
          .then(response => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.have.property('objectIDs');

            // TODO: replace once async indexing is in place
            return elasticsearchClient.mget({index: testIndexName, body: {ids: response.result.objectIDs}})
              .then(result => {
                expect(result.docs).to.have.length(2);
              });
          });
      });
    });

    describe('upsert operation', () => {
      it('adds new objects to the index', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            body: {
              name: 'object 1'
            },
            objectID: '1'
          }, {
            action: 'upsert',
            body: {
              name: 'object 2'
            },
            objectID: '2'
          }]
        };

        return specRequest({url: `/1/indexes/${testIndexName}/batch`, method: 'post', payload})
          .then(response => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.have.property('objectIDs');

            return elasticsearchClient.mget({index: testIndexName, body: {ids: response.result.objectIDs}})
              .then(result => {
                expect(result.docs).to.have.length(2);
              });
          });
      });
    });
  });
});
