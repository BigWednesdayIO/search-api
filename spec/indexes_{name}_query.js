'use strict';

const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/query', () => {
  const testIndexName = 'test_index_' + cuid();
  const testIndexType = 'test_type';
  const document1 = {sku: '12345', price: 1};
  const document2 = {sku: '98765', price: 5};

  beforeEach(() => {
    return elasticsearchClient.bulk({
      body: [
        {index: {_index: testIndexName, _type: testIndexType, _id: 1}},
        document1,
        {index: {_index: testIndexName, _type: testIndexType, _id: 2}},
        document2
      ]
    }).then(() => elasticsearchClient.indices.refresh({index: testIndexName}));
  });

  afterEach(() => {
    return elasticsearchClient.indices.delete({index: testIndexName});
  });

  describe('post', () => {
    it('queries by keyword', () => {
      const payload = {query: '12345'};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload: payload})
        .then(response => {
          expect(response.result).to.be.deep.equal([document1]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by terms', () => {
      const payload = {filters: [{field: 'sku', term: '12345'}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload: payload})
        .then(response => {
          expect(response.result).to.be.deep.equal([document1]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by ranges', () => {
      const payload = {filters: [{field: 'sku', range: {from: 2}}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload: payload})
        .then(response => {
          expect(response.result).to.be.deep.equal([document2]);
          expect(response.statusCode).to.equal(200);
        });
    });
  });
});
