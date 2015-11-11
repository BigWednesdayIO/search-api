'use strict';

const _ = require('lodash');
const cuid = require('cuid');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const specRequest = require('../spec_request');

describe('/indexes/{name}/query - basic search', () => {
  const testHeaders = {Authorization: 'Bearer NG0TuV~u2ni#BP|'};

  const testIndexName = `test_index_${cuid()}`;
  const document1 = {sku: 'ABCDEF', price: 1, quantity: 1};
  const document2 = {sku: 'GHIJKL', price: 5, quantity: 8};
  const document3 = {sku: 'MNGOPQ', price: 2, quantity: 1};

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

  before(reindexTestDocuments);

  after(() => {
    return specRequest({
      url: `/indexes/${testIndexName}`,
      method: 'DELETE',
      headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
    });
  });

  describe('post', () => {
    it('returns a 404 when the index does not exist', () => {
      return specRequest({
        url: '/indexes/nonexistantindex/query',
        method: 'post',
        headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
        payload: {}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index nonexistantindex does not exist');
        });
    });

    it('returns a 404 when index wildcard is used', () => {
      return specRequest({
        url: '/indexes/*/query',
        method: 'post',
        headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
        payload: {}
      })
        .then(response => {
          expect(response.statusCode).to.equal(404);
          expect(response.result.message).to.equal('Index * does not exist');
        });
    });

    it('returns results with a full keyword match', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {query: 'ABCDEF'}
      })
        .then(response => {
          const expectedHit = {objectID: '1'};
          _.assign(expectedHit, document1);

          expect(response.result.hits).to.be.deep.equal([expectedHit]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('returns results with a partial keyword match', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {query: 'AB'}
      })
        .then(response => {
          const expectedHit = {objectID: '1'};
          _.assign(expectedHit, document1);

          expect(response.result.hits).to.be.deep.equal([expectedHit]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by term', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {filters: [{field: 'sku', term: 'ABCDEF'}]}
      })
        .then(response => {
          const expectedHit = {objectID: '1'};
          _.assign(expectedHit, document1);

          expect(response.result.hits).to.be.deep.equal([expectedHit]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by multiple terms', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {filters: [{field: 'sku', terms: ['ABCDEF', 'MNGOPQ']}]}
      })
        .then(response => {
          const expectedHits = [
            _.assign({objectID: '1'}, document1),
            _.assign({objectID: '3'}, document3)
          ];

          expect(response.result.hits).to.be.deep.have.members(expectedHits);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('filters results by ranges', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {filters: [{field: 'quantity', range: {from: 2}}]}
      })
        .then(response => {
          const expectedHit = {objectID: '2'};
          _.assign(expectedHit, document2);

          expect(response.result.hits).to.be.deep.equal([expectedHit]);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('performs paging', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {page: 2, hitsPerPage: 1}
      })
        .then(response => {
          expect(response.result.hits.length).to.equal(1);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('sorts results with default order', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {sort: [{field: 'price'}]}
      })
        .then(response => {
          expect(response.result.hits[0].price).to.equal(1);
          expect(response.result.hits[1].price).to.equal(2);
          expect(response.result.hits[2].price).to.equal(5);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('sorts results with specified order', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {sort: [{field: 'price', direction: 'desc'}]}
      })
        .then(response => {
          expect(response.result.hits[0].price).to.equal(5);
          expect(response.result.hits[1].price).to.equal(2);
          expect(response.result.hits[2].price).to.equal(1);
          expect(response.statusCode).to.equal(200);
        });
    });

    it('returns total hits', () => {
      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: testHeaders,
        payload: {query: 'ABCDEF'}
      })
        .then(response => {
          expect(response.result.totalHits).to.equal(1);
        });
    });

    describe('validation', () => {
      it('ensures query is a string', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {query: {}}
        })
          .then(response => {
            expect(response.result.message).to.match(/"query" must be a string]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures filters is an array', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {filters: {}}
        })
          .then(response => {
            expect(response.result.message).to.match(/"filters" must be an array]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures filter has field', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {filters: [{term: '12345'}]}
        })
          .then(response => {
            expect(response.result.message).to.match(/"field" is required]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures terms filter is array', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {filters: [{field: 'sku', terms: '12345'}]}
        })
          .then(response => {
            expect(response.result.message).to.match(/"terms" must be an array/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures filter has value specifier', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {filters: [{field: 'sku'}]}
        })
          .then(response => {
            expect(response.result.message).to.match(/"0" must have at least 2 children/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures filter has only 1 value specifier', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {filters: [{field: 'sku', term: '12345', terms: ['12345'], range: {from: 1}}]}
        })
          .then(response => {
            expect(response.result.message).to.match(/"0" must have less than or equal to 2 children/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures range filter has at least 1 bound', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {filters: [{field: 'sku', range: {}}]}
        })
          .then(response => {
            expect(response.result.message).to.match(/"range" must have at least 1 children/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures page is integer', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {page: 1.5}
        })
          .then(response => {
            expect(response.result.message).to.match(/"page" must be an integer/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures hitsPerPage is integer', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {hitsPerPage: 25.5}
        })
          .then(response => {
            expect(response.result.message).to.match(/"hitsPerPage" must be an integer/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures sort is array', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {sort: 'sku'}
        })
          .then(response => {
            expect(response.result.message).to.match(/"sort" must be an array/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures sort field is present', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {sort: [{}]}
        })
          .then(response => {
            expect(response.result.message).to.match(/"field" is required]/);
            expect(response.statusCode).to.equal(400);
          });
      });

      it('ensures sort direction is "asc" or "desc"', () => {
        return specRequest({
          url: '/indexes/test-index/query',
          method: 'post',
          headers: testHeaders,
          payload: {sort: [{field: 'sku', direction: 'upwards'}]}
        })
          .then(response => {
            expect(response.result.message).to.match(/"direction" must be one of \[asc, desc\]/);
            expect(response.statusCode).to.equal(400);
          });
      });
    });
  });
});
