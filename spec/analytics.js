'use strict';

const expect = require('chai').expect;
const cuid = require('cuid');
const specRequest = require('./spec_request');
const elasticsearchClient = require('../lib/elasticsearchClient');
const generateOpsIndexName = require('../lib/analytics_logger').generateIndexName;

describe('analytics', () => {
  const testIndexName = `test_index_${cuid()}`;

  before(() => {
    return specRequest({
      url: `/indexes/${testIndexName}`,
      method: 'POST',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
      payload: {name: 'test data'}
    });
  });

  after(() => {
    return specRequest({
      url: `/indexes/${testIndexName}`,
      method: 'DELETE',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    });
  });

  it('records analytics for successful operation', () => {
    const opsIndexName = generateOpsIndexName();
    let opsRecordId;

    return specRequest({
      url: `/indexes/${testIndexName}/query`,
      method: 'post',
      headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
      payload: {}
    })
      .then(resp => {
        opsRecordId = resp.request.id;
        return elasticsearchClient.indices.refresh({index: opsIndexName})
          .then(() => {
            // give refresh a chance to work
            return new Promise(resolve => {
              setTimeout(resolve, 1000);
            });
          });
      })
      .then(() => {
        return elasticsearchClient.exists({
          index: opsIndexName,
          type: 'SearchOperationEvent',
          id: opsRecordId,
          realtime: true
        });
      })
      .then(result => {
        expect(result).to.equal(true);
      });
  });

  it('does not record analytics for unsuccessful operation', () => {
    const opsIndexName = generateOpsIndexName();
    let opsRecordId;

    return specRequest({
      url: '/indexes/some-index/query',
      method: 'post',
      headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
      payload: {}
    })
      .then(resp => {
        opsRecordId = resp.request.id;
        return elasticsearchClient.indices.refresh({index: opsIndexName});
      })
      .then(() => {
        return elasticsearchClient.exists({
          index: opsIndexName,
          type: 'SearchOperationEvent',
          id: opsRecordId,
          realtime: true
        });
      })
      .then(result => {
        expect(result).to.equal(false);
      });
  });
});
