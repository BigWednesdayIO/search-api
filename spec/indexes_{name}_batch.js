'use strict';

const _ = require('lodash');
const cuid = require('cuid');

const specRequest = require('./spec_request');
const elasticsearchClient = require('../lib/elasticsearchClient');

const expect = require('chai').expect;

describe('/indexes/{name}/batch', () => {
  let testIndexName;
  let clientIndexName;

  describe('post', () => {
    beforeEach(() => {
      testIndexName = `test_index_${cuid()}`;
      clientIndexName = `1_${testIndexName}`;
    });

    afterEach(() => {
      return elasticsearchClient.indices.delete({index: clientIndexName, ignore: 404});
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
            return elasticsearchClient.mget({index: clientIndexName, body: {ids: response.result.objectIDs}})
              .then(result => {
                expect(result.docs).to.have.length(2);
                expect(_.every(result.docs, {found: true})).to.equal(true, 'Created documents not found');
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

            return elasticsearchClient.mget({index: clientIndexName, body: {ids: response.result.objectIDs}})
              .then(result => {
                expect(result.docs).to.have.length(2);
                expect(_.every(result.docs, {found: true})).to.equal(true, 'Created documents not found');
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
            {index: {_index: clientIndexName, _type: 'object', _id: '1'}},
            {name: 'object 1'},
            {index: {_index: clientIndexName, _type: 'object', _id: '2'}},
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

                return elasticsearchClient.mget({index: clientIndexName, body: {ids: response.result.objectIDs}})
                  .then(result => {
                    expect(result.docs[0]._source).to.deep.equal(payload.requests[0].body);
                    expect(result.docs[1]._source).to.deep.equal(payload.requests[1].body);
                  });
              });
          });
      });
    });

    describe('delete operation', () => {
      it('removes objects from the index', () => {
        const payload = {
          requests: [{
            action: 'delete',
            objectID: '1'
          }, {
            action: 'delete',
            objectID: '2'
          }]
        };

        const existingData = {
          body: [
            {index: {_index: clientIndexName, _type: 'object', _id: '1'}},
            {name: 'object 1'},
            {index: {_index: clientIndexName, _type: 'object', _id: '2'}},
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

                return elasticsearchClient.mget({index: clientIndexName, body: {ids: ['1', '2']}})
                  .then(result => {
                    expect(_.every(result.docs, {found: false})).to.equal(true, 'Deleted documents still exist in index');
                  });
              });
          });
      });
    });

    describe('validation', () => {
      it('does not allow objectID to be sent for create actions', () => {
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

      it('does not allow unknown actions', () => {
        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 12345'},
          payload: {requests: [{action: 'unknown', body: {}}]}
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"action" must be one of/);
          });
      });

      it('requires body parameter for create actions', () => {
        const payload = {
          requests: [{
            action: 'create'
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
            expect(response.result.message).to.match(/"body" is required/);
          });
      });

      it('requires body parameter for upsert actions', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            objectID: '1'
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
            expect(response.result.message).to.match(/"body" is required/);
          });
      });

      it('does not allow body to be sent for delete actions', () => {
        const payload = {
          requests: [{
            action: 'delete',
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
            expect(response.result.message).to.match(/"body" is not allowed]/);
          });
      });

      it('requires objectID parameter for upsert actions', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            body: {name: 'something'}
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
            expect(response.result.message).to.match(/"objectID" is required/);
          });
      });

      it('requires objectID parameter for delete actions', () => {
        const payload = {
          requests: [{
            action: 'delete'
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
            expect(response.result.message).to.match(/"objectID" is required/);
          });
      });
    });
  });
});
