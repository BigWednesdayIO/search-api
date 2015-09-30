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
      refresh: true,
      body: [
        {index: {_index: testIndexName, _type: testIndexType, _id: 1}},
        document1,
        {index: {_index: testIndexName, _type: testIndexType, _id: 2}},
        document2
      ]
    });
  });

  after(() => {
    return elasticsearchClient.indices.delete({index: testIndexName});
  });

  describe('post', () => {
    it('queries by keyword', () => {
      const payload = {query: '12345'};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result.hits).to.be.deep.equal([document1]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by terms', () => {
      const payload = {filters: [{field: 'sku', term: '12345'}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result.hits).to.be.deep.equal([document1]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by ranges', () => {
      const payload = {filters: [{field: 'sku', range: {from: 2}}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result.hits).to.be.deep.equal([document2]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('performs paging', () => {
      const payload = {page: 2, hitsPerPage: 1};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result.hits.length).to.equal(1);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('sorts results with default order', () => {
      const payload = {sort: [{field: 'price'}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result.hits[0].price).to.equal(1);
          expect(response.result.hits[1].price).to.equal(5);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('sorts results with specified order', () => {
      const payload = {sort: [{field: 'price', direction: 'desc'}]};

      return specRequest({url: `/1/indexes/${testIndexName}/query`, method: 'post', payload})
        .then(response => {
          expect(response.result.hits[0].price).to.equal(5);
          expect(response.result.hits[1].price).to.equal(1);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('returns a 404 when the index does not exist', () => {
      return specRequest({url: '/1/indexes/nonexistantindex/query', method: 'post', payload: {}})
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index nonexistantindex does not exist');
        });
    });

    it('returns a 404 when index wildcard is used', () => {
      return specRequest({url: '/1/indexes/*/query', method: 'post', payload: {}})
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index * does not exist');
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

      it('ensures filter has only 1 of term or range', () => {
        const payload = {filters: [{field: 'sku', term: '12345', range: {from: 1}}]};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"0" must have less than or equal to 2 children/);
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

      it('ensures sort is array', () => {
        const payload = {sort: 'sku'};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"sort" must be an array/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures sort field is present', () => {
        const payload = {sort: [{}]};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"field" is required]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures sort direction is "asc" or "desc"', () => {
        const payload = {sort: [{field: 'sku', direction: 'upwards'}]};

        return specRequest({url: '/1/indexes/test-index/query', method: 'post', payload})
          .then(response => {
            expect(response.result.message).to.match(/"direction" must be one of \[asc, desc\]/);
            expect(response.statusCode).to.equal(400);
          });
      });
    });
  });
});

