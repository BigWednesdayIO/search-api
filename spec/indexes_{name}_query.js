'use strict';

const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('Basic search', () => {
  const testIndexName = 'test_index_' + cuid();
  const testDocument = {sku: '12345'};

  beforeEach(() => {
    return elasticsearchClient.index({
      index: testIndexName,
      type: 'test_type',
      body: {sku: '12345'}
    })
    .then(() => elasticsearchClient.indices.refresh({index: testIndexName}));
  });

  afterEach(() => {
    return elasticsearchClient.indices.delete({index: testIndexName});
  });

  it('queries by keyword', () => {
    const payload = {query: '12345'};

    return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload: payload})
      .then(response => {
        expect(response.result).to.be.deep.equal([testDocument]);
        expect(response.statusCode).to.equal(200);
      });
  });
});
