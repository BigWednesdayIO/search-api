'use strict';

const cuid = require('cuid');

const elasticsearchClient = require('../lib/elasticsearchClient');
const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/query', () => {
  const testIndexName = `test_index_${cuid()}`;
  const testIndexType = 'test_type';
  const document1 = {sku: '12345', price: 1};
  const document2 = {sku: '98765', price: 5};

  before(() => {
    return elasticsearchClient.bulk({
      body: [
        {index: {_index: testIndexName, _type: testIndexType, _id: 1}},
        document1,
        {index: {_index: testIndexName, _type: testIndexType, _id: 2}},
        document2
      ]
    }).then(() => elasticsearchClient.indices.refresh({index: testIndexName}));
  });

  after(() => {
    return elasticsearchClient.indices.delete({index: testIndexName});
  });

  describe('post', () => {
    it('queries by keyword', () => {
      const payload = {query: '12345'};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result).to.be.deep.equal([document1]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by terms', () => {
      const payload = {filters: [{field: 'sku', term: '12345'}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result).to.be.deep.equal([document1]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by ranges', () => {
      const payload = {filters: [{field: 'sku', range: {from: 2}}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result).to.be.deep.equal([document2]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('performs paging', () => {
      const payload = {page: 2, hitsPerPage: 1};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result.length).to.equal(1);
          expect(response.statusCode).to.equal(200);
        });
    });

    describe('validation', () => {
      it('ensures query is a string', () => {
        const payload = {query: {}};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"query" must be a string]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures filters is an array', () => {
        const payload = {filters: {}};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"filters" must be an array]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures filter has field', () => {
        const payload = {filters: [{term: '12345'}]};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"field" is required]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures filter has term or range', () => {
        const payload = {filters: [{field: 'sku'}]};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"0" must have at least 2 children/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures range filter has at least 1 bound', () => {
        const payload = {filters: [{field: 'sku', range: {}}]};

        return specRequest({url: `/1/indexes/test-index/query`, method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"range" must have at least 1 children/);
            expect(response.statusCode).to.equal(400);
          });
      });
    });

    it('ensures page is integer', () => {
      const payload = {page: 1.5};

      return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
        .then(response => {
          expect(response.result.message).to.match(/"page" must be an integer/);
          expect(response.statusCode).to.equal(400);
        });
    });

    it('ensures hitsPerPage is integer', () => {
      const payload = {hitsPerPage: 25.5};

      return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
        .then(response => {
          expect(response.result.message).to.match(/"hitsPerPage" must be an integer/);
          expect(response.statusCode).to.equal(400);
        });
    });
  });
});

