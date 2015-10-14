'use strict';

const cuid = require('cuid');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const specRequest = require('../spec_request');

describe('/indexes/{name}/query - search settings', () => {
  describe('post', () => {
    const testIndexName = `test_index_${cuid()}`;
    const document1 = {field1: 'blue', field2: 'red'};
    const document2 = {field1: 'red', field2: 'blue'};
    const document3 = {field1: 'turquoise', field2: 'turquoise', field3: 'blue'};

    const reindexTestDocuments = () => {
      const batch = {
        requests: [
          {action: 'upsert', body: document1, objectID: '1'},
          {action: 'upsert', body: document2, objectID: '2'},
          {action: 'upsert', body: document3, objectID: '3'}
        ]
      };

      return specRequest({
        url: `/indexes/${testIndexName}/batch`,
        method: 'POST',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
        payload: batch
      })
      .then(() => {
        return elasticsearchClient.indices.refresh();
      });
    };

    after(() => {
      return specRequest({
        url: `/indexes/${testIndexName}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      });
    });

    describe('searchable_fields', () => {
      before(() => {
        return specRequest({
          url: `/indexes/${testIndexName}/settings`,
          method: 'put',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload: {searchable_fields: ['field1', 'field2']}
        })
        .then(reindexTestDocuments);
      });

      it('returns results that match only fields from searchable_fields setting', () => {
        return specRequest({
          url: `/indexes/${testIndexName}/query`,
          method: 'post',
          headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
          payload: {query: 'blue'}
        })
        .then(response => {
          expect(response.result.hits).to.be.deep.equal([document1, document2]);
          expect(response.statusCode).to.equal(200);
        });
      });
    });

    describe('default ranking', () => {
      // by flipping the order of searchable_fields we should be able to reverse
      // the order of the results using the default ranking behaviour
      before(() => {
        return specRequest({
          url: `/indexes/${testIndexName}/settings`,
          method: 'put',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload: {searchable_fields: ['field2', 'field1']}
        })
        .then(reindexTestDocuments);
      });

      it('returns results that match only fields from searchable_fields setting', () => {
        return specRequest({
          url: `/indexes/${testIndexName}/query`,
          method: 'post',
          headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
          payload: {query: 'blue'}
        })
        .then(response => {
          expect(response.result.hits).to.be.deep.equal([document2, document1]);
          expect(response.statusCode).to.equal(200);
        });
      });
    });
  });
});
