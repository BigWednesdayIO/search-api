'use strict';

const cuid = require('cuid');
const expect = require('chai').expect;

const specRequest = require('./spec_request');
const elasticsearchClient = require('../lib/elasticsearchClient');

describe('indexing record limits', () => {
  const testIndexName1 = `test_index_${cuid()}`;
  const testIndexName2 = `test_index_${cuid()}`;
  const testIndexName3 = `test_index_${cuid()}`;

  // NOTE: jQeaXOmEYpVTsb3 auth token is configured to allow only 5 records across all indexes
  before(() => {
    return Promise.all([
      specRequest({
        url: `/indexes/${testIndexName1}`,
        method: 'POST',
        payload: {name: 'one'},
        headers: {Authorization: 'Bearer jQeaXOmEYpVTsb3'}
      }),

      specRequest({
        url: `/indexes/${testIndexName2}`,
        method: 'POST',
        payload: {name: 'two'},
        headers: {Authorization: 'Bearer jQeaXOmEYpVTsb3'}
      }),

      specRequest({
        url: `/indexes/${testIndexName3}/batch`,
        method: 'POST',
        payload: {requests: [
          {action: 'create', body: {name: 'three'}},
          {action: 'create', body: {name: 'four'}},
          {action: 'create', body: {name: 'five'}}
        ]},
        headers: {Authorization: 'Bearer jQeaXOmEYpVTsb3'}
      })
    ])
    .then(() => {
      // stats are dependent on elastic refresh interval
      // https://trello.com/c/XtGUAjIu/71-more-accurate-record-limits
      return elasticsearchClient.indices.refresh();
    });
  });

  after(() => {
    return Promise.all([
      specRequest({
        url: `/indexes/${testIndexName1}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer jQeaXOmEYpVTsb3'}
      }),

      specRequest({
        url: `/indexes/${testIndexName2}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer jQeaXOmEYpVTsb3'}
      }),

      specRequest({
        url: `/indexes/${testIndexName3}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer jQeaXOmEYpVTsb3'}
      })
    ]);
  });

  describe('/indexes/{name}', () => {
    describe('post', () => {
      it('returns a 403 response when the number of objects indexed reaches the indexing limit', () => {
        return specRequest({
          url: `/indexes/${testIndexName1}`,
          method: 'post',
          payload: {name: 'six'},
          headers: {Authorization: 'Bearer jQeaXOmEYpVTsb3'}
        })
        .then(response => {
          expect(response.statusCode).to.equal(403);
          expect(response.result.message).to.equal('Maximum number of records reached');
        });
      });
    });
  });
});
