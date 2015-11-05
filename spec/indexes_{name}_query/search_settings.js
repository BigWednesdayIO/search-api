'use strict';

const _ = require('lodash');
const cuid = require('cuid');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const specRequest = require('../spec_request');

describe('/indexes/{name}/query - search settings', () => {
  describe('post', () => {
    const testIndexName = `test_index_${cuid()}`;
    const document1 = {field1: 'blue', field2: 'red', rating: 1};
    const document2 = {field1: 'red', field2: 'blue', rating: 1};
    const document3 = {field1: 'turquoise', field2: 'turquoise', field3: 'blue', rating: 10};

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
          payload: {searchable_fields: ['field1', 'field2'], facets: []}
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
          const expectedHits = [{objectID: '1'}, {objectID: '2'}];
          _.assign(expectedHits[0], document1);
          _.assign(expectedHits[1], document2);

          expect(response.result.hits).to.be.deep.equal(expectedHits);
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
          payload: {searchable_fields: ['field2', 'field1'], facets: []}
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
          const expectedHits = [{objectID: '2'}, {objectID: '1'}];
          _.assign(expectedHits[0], document2);
          _.assign(expectedHits[1], document1);

          expect(response.result.hits).to.be.deep.equal(expectedHits);
          expect(response.statusCode).to.equal(200);
        });
      });
    });

    describe('facets', () => {
      before(() => {
        return specRequest({
          url: `/indexes/${testIndexName}/settings`,
          method: 'put',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload: {searchable_fields: ['field1', 'field2'], facets: [{field: 'field2', order: 'valueDESC'}, {field: 'field3', order: 'count'}, {field: 'rating', order: 'count'}]}
        })
        .then(reindexTestDocuments);
      });

      it('returns configured facets', () => {
        return specRequest({
          url: `/indexes/${testIndexName}/query`,
          method: 'post',
          headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
          payload: {query: 'blue'}
        })
        .then(response => {
          expect(response.result.facets).to.be.deep.equal([
            {field: 'field2', values: [{value: 'red', count: 1}, {value: 'blue', count: 1}]},
            {field: 'field3', values: []},
            {field: 'rating', values: [{value: 1, count: 2}]}
          ]);

          expect(response.statusCode).to.equal(200);
        });
      });
    });
  });
});
