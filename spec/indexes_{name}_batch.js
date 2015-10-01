'use strict';

const cuid = require('cuid');

const specRequest = require('./spec_request');
const elasticsearchClient = require('../lib/elasticsearchClient');

const expect = require('chai').expect;

describe('/indexes/{name}/batch', () => {
  let testIndexName;

  describe('post', () => {
    beforeEach(() => {
      testIndexName = `test_index_${cuid()}`;
    });

    afterEach(() => {
      return elasticsearchClient.indices.delete({index: testIndexName, ignore: 404});
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

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 12345'},
          payload
        })
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

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 12345'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.have.property('objectIDs');

            return elasticsearchClient.mget({index: testIndexName, body: {ids: response.result.objectIDs}})
              .then(result => {
                expect(result.docs).to.have.length(2);
              });
          });
      });

      it('replaces existing objects in the index', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            body: {
              name: 'object 1 new name'
            },
            objectID: '1'
          }, {
            action: 'upsert',
            body: {
              name: 'object 2 new name'
            },
            objectID: '2'
          }]
        };

        const existingData = {
          body: [
            {index: {_index: testIndexName, _type: 'object', _id: '1'}},
            {name: 'object 1'},
            {index: {_index: testIndexName, _type: 'object', _id: '2'}},
            {name: 'object 2'}
          ]
        };

        return elasticsearchClient.bulk(existingData)
          .then(() => {
            return specRequest({
              url: `/1/indexes/${testIndexName}/batch`,
              method: 'post',
              headers: {Authorization: 'Bearer 12345'},
              payload
            })
              .then(response => {
                expect(response.statusCode).to.equal(200);
                expect(response.result).to.have.property('objectIDs');

                return elasticsearchClient.mget({index: testIndexName, body: {ids: response.result.objectIDs}})
                  .then(result => {
                    expect(result.docs[0]._source).to.deep.equal(payload.requests[0].body);
                    expect(result.docs[1]._source).to.deep.equal(payload.requests[1].body);
                  });
              });
          });
      });
    });

    describe('validation', () => {
      it('does not allow objectID to be sent for create operations', () => {
        const payload = {
          requests: [{
            action: 'create',
            body: {name: 'something'},
            objectID: 'myid'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 12345'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"objectID" is not allowed]/);
          });
      });
    });
  });
});
