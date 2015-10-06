'use strict';

const cuid = require('cuid');

const expect = require('chai').expect;

const specRequest = require('./spec_request');
const elasticsearchClient = require('../lib/elasticsearchClient');

describe('/indexes/{name}/move', () => {
  const testIndexName = `test_index_${cuid()}`;
  const newIndexName = `new_index_${cuid()}`;

  const clientIndexName = `1_${testIndexName}`;
  const clientNewIndexName = `1_${newIndexName}`;

  const existingData = {
    body: [
      {index: {_index: clientIndexName, _type: 'object', _id: '1'}},
      {name: 'object 1'}
    ],
    refresh: true
  };

  before(() => {
    return elasticsearchClient.bulk(existingData);
  });

  after(() => {
    elasticsearchClient.indices.delete({index: clientIndexName, ignore: 404});
    elasticsearchClient.indices.delete({index: clientNewIndexName, ignore: 404});
  });

  describe('post', () => {
    it('moves an index to a new index', () => {
      return specRequest({
        url: `/1/indexes/${testIndexName}/move`,
        method: 'post',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
        payload: {destination: newIndexName}
      })
        .then(response => {
          expect(response.statusCode).to.equal(200);

          return elasticsearchClient.exists({index: clientNewIndexName, type: '_all', id: '1'})
            .then(result => {
              expect(result).to.equal(true, 'Document does not exist in moved index');
            });
        });
    });
  });
});
