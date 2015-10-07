'use strict';

const cuid = require('cuid');

const expect = require('chai').expect;

const specRequest = require('./spec_request');

describe('/indexes/{name}/move', () => {
  const testIndexName = `test_index_${cuid()}`;
  const newIndexName = `new_index_${cuid()}`;

  before(() => {
    return Promise.all([
      specRequest({
        url: `/1/indexes/${testIndexName}/1`,
        method: 'put',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
        payload: {name: 'object 1'}}),

      specRequest({
        url: `/1/indexes/${newIndexName}/1`,
        method: 'put',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
        payload: {name: 'existing object 1'}})
    ]);
  });

  after(() => {
    return Promise.all([
      specRequest({
        url: `/1/indexes/${testIndexName}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}}),

      specRequest({
        url: `/1/indexes/${newIndexName}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}})
    ]);
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

          return specRequest({
            url: `/1/indexes/${newIndexName}/1`,
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
          });
        })
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.result).to.have.property('name', 'object 1');

          return specRequest({
            url: `/1/indexes/${testIndexName}/1`,
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
          });
        })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal(`Index ${testIndexName} does not exist`);
        });
    });
  });
});
