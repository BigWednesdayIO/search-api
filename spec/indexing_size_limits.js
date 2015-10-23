'use strict';

const cuid = require('cuid');
const expect = require('chai').expect;
const specRequest = require('./spec_request');

const constructObjectOfSize = size => {
  let part1 = '{"field1":"';
  const part2 = '"}';

  while (part1.length + part2.length < size) {
    part1 += '1';
  }

  return JSON.parse(part1 + part2);
};

describe('indexing size limits', () => {
  const testIndexName = `test_index_${cuid()}`;

  after(() => {
    return specRequest({
      url: `/indexes/${testIndexName}`,
      method: 'DELETE',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    });
  });

  describe('/indexes/{name}', () => {
    describe('post', () => {
      it('returns a 413 response when the object size exceeds the 10kb limit', () => {
        return specRequest({
          url: `/indexes/${testIndexName}`,
          method: 'post',
          payload: constructObjectOfSize(10001),
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
        })
        .then(response => {
          expect(response.statusCode).to.equal(413);
          expect(response.result.message).to.equal('Object exceeds 10k size limit');
        });
      });
    });
  });

  describe('/indexes/{name}/{objectID}', () => {
    describe('put', () => {
      it('returns a 413 response when the object size exceeds the 10kb limit', () => {
        return specRequest({
          url: `/indexes/${testIndexName}/1`,
          method: 'put',
          payload: constructObjectOfSize(10001),
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
        })
        .then(response => {
          expect(response.statusCode).to.equal(413);
          expect(response.result.message).to.equal('Object exceeds 10k size limit');
        });
      });
    });
  });

  describe('/indexes/{name}/batch', () => {
    describe('post', () => {
      it('returns a 413 response when a create object size exceeds the 10kb limit', () => {
        const payload = {
          requests: [
            {action: 'create', body: {name: 'ok'}},
            {action: 'upsert', body: {name: 'ok'}, objectID: '1'},
            {action: 'create', body: constructObjectOfSize(10001)},
            {action: 'create', body: {name: 'ok'}}
          ]
        };

        return specRequest({
          url: `/indexes/${testIndexName}/batch`,
          method: 'post',
          payload,
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
        })
        .then(response => {
          expect(response.statusCode).to.equal(413);
          expect(response.result.message).to.equal('Object exceeds 10k size limit - at position 2');
        });
      });

      it('returns a 413 response when an upsert object size exceeds the 10kb limit', () => {
        const payload = {
          requests: [
            {action: 'create', body: {name: 'ok'}},
            {action: 'upsert', body: constructObjectOfSize(10001), objectID: '1'},
            {action: 'create', body: {name: 'ok'}},
            {action: 'create', body: {name: 'ok'}}
          ]
        };

        return specRequest({
          url: `/indexes/${testIndexName}/batch`,
          method: 'post',
          payload,
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
        })
        .then(response => {
          expect(response.statusCode).to.equal(413);
          expect(response.result.message).to.equal('Object exceeds 10k size limit - at position 1');
        });
      });
    });
  });
});
