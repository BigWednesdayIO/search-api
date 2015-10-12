'use strict';

const cuid = require('cuid');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const specRequest = require('../spec_request');

describe('/indexes/{name}/query - search settings', () => {
  describe('post', () => {
    const testIndexName = `test_index_${cuid()}`;
    const document1 = {name: 'blue dress', colour: 'blue', colour_group: 'blue'};
    const document2 = {name: 'navy blue dress', colour: 'navy', colour_group: 'blue'};
    const document3 = {name: 'turquoise dress', colour: 'turquoise', colour_group: 'blue'};

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

    before(() => {
      return specRequest({
        url: `/indexes/${testIndexName}/settings`,
        method: 'put',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
        payload: {searchable_fields: ['name', 'colour']}
      })
      .then(() => {
        return reindexTestDocuments();
      });
    });

    after(() => {
      return specRequest({
        url: `/indexes/${testIndexName}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      });
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
});
