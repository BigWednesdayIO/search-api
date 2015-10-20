'use strict';

const cuid = require('cuid');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const specRequest = require('../spec_request');

describe('/indexes/{name}/query - basic search', () => {
  const testIndexName = `test_index_${cuid()}`;
  const document1 = {sku: '12345', price: 1};
  const document2 = {sku: '98765', price: 5};

  const reindexTestDocuments = () => {
    const batch = {
      requests: [
        {action: 'upsert', body: document1, objectID: '1'},
        {action: 'upsert', body: document2, objectID: '2'}
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

    it('rejects combiniation of parameter formats', () => {
      const payload = {
        filters: [{field: 'sku', term: '12345'}],
        params: 'query=1'
      };

      return specRequest({
        url: `/indexes/${testIndexName}/query`,
        method: 'post',
        headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'},
        payload
      })
      .then(response => {
        expect(response.statusCode).to.equal(400);
        expect(response.result.message).to.equal('"params" cannot be combined with other keys');
      });
    });

    const jsonPayload = {
      name: 'JSON payload',
      payloadBuilder(payloadParams) {
        return payloadParams;
      },
      headers: {Authorization: 'Bearer NG0TuV~u2ni#BP|'}
    };

    const uriEncodedPayload = {
      name: 'URI encoded payload',
      payloadBuilder(payloadParams) {
        // Extracted from BigWednesdayIO/searchful-client-js/blob/master/src/AlgoliaSearch.js
        let params = '';

        if (!payloadParams) {
          return params;
        }

        for (const key in payloadParams) {
          if (key !== null && payloadParams[key] !== undefined && payloadParams.hasOwnProperty(key)) {
            params += params === '' ? '' : '&';
            params += `${key}=${encodeURIComponent(payloadParams[key] instanceof Array ? JSON.stringify(payloadParams[key]) : payloadParams[key])}`;
          }
        }
        return {params};
      },
      headers: {
        Authorization: 'Bearer NG0TuV~u2ni#BP|',
        ['content-type']: 'application/x-www-form-urlencoded'
      }
    };

    [jsonPayload, uriEncodedPayload].forEach(testSuite => {
      describe(testSuite.name, () => {
        it('queries by keyword', () => {
          const payload = testSuite.payloadBuilder({query: '12345'});

          return specRequest({
            url: `/indexes/${testIndexName}/query`,
            method: 'post',
            headers: testSuite.headers,
            payload
          })
            .then(response => {
              expect(response.result.hits).to.be.deep.equal([document1]);
              expect(response.statusCode).to.equal(200);
            });
        });

        it('filters results by terms', () => {
          const payload = testSuite.payloadBuilder({filters: [{field: 'sku', term: '12345'}]});

          return specRequest({
            url: `/indexes/${testIndexName}/query`,
            method: 'post',
            headers: testSuite.headers,
            payload
          })
            .then(response => {
              expect(response.result.hits).to.be.deep.equal([document1]);
              expect(response.statusCode).to.equal(200);
            });
        });

        it('filters results by ranges', () => {
          const payload = testSuite.payloadBuilder({filters: [{field: 'sku', range: {from: 2}}]});

          return specRequest({
            url: `/indexes/${testIndexName}/query`,
            method: 'post',
            headers: testSuite.headers,
            payload
          })
            .then(response => {
              expect(response.result.hits).to.be.deep.equal([document2]);
              expect(response.statusCode).to.equal(200);
            });
        });

        it('performs paging', () => {
          const payload = testSuite.payloadBuilder({page: 2, hitsPerPage: 1});

          return specRequest({
            url: `/indexes/${testIndexName}/query`,
            method: 'post',
            headers: testSuite.headers,
            payload
          })
            .then(response => {
              expect(response.result.hits.length).to.equal(1);
              expect(response.statusCode).to.equal(200);
            });
        });

        it('sorts results with default order', () => {
          const payload = testSuite.payloadBuilder({sort: [{field: 'price'}]});

          return specRequest({
            url: `/indexes/${testIndexName}/query`,
            method: 'post',
            headers: testSuite.headers,
            payload
          })
            .then(response => {
              expect(response.result.hits[0].price).to.equal(1);
              expect(response.result.hits[1].price).to.equal(5);
              expect(response.statusCode).to.equal(200);
            });
        });

        it('sorts results with specified order', () => {
          const payload = testSuite.payloadBuilder({sort: [{field: 'price', direction: 'desc'}]});

          return specRequest({
            url: `/indexes/${testIndexName}/query`,
            method: 'post',
            headers: testSuite.headers,
            payload
          })
            .then(response => {
              expect(response.result.hits[0].price).to.equal(5);
              expect(response.result.hits[1].price).to.equal(1);
              expect(response.statusCode).to.equal(200);
            });
        });

        describe('validation', () => {
          it('ensures query is a string', () => {
            const payload = testSuite.payloadBuilder({query: {}});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"query" must be a string]/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures filters is an array', () => {
            const payload = testSuite.payloadBuilder({filters: {}});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"filters" must be an array]/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures filter has field', () => {
            const payload = testSuite.payloadBuilder({filters: [{term: '12345'}]});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"field" is required]/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures filter has term or range', () => {
            const payload = testSuite.payloadBuilder({filters: [{field: 'sku'}]});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"0" must have at least 2 children/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures filter has only 1 of term or range', () => {
            const payload = testSuite.payloadBuilder({filters: [{field: 'sku', term: '12345', range: {from: 1}}]});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"0" must have less than or equal to 2 children/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures range filter has at least 1 bound', () => {
            const payload = testSuite.payloadBuilder({filters: [{field: 'sku', range: {}}]});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"range" must have at least 1 children/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures page is integer', () => {
            const payload = testSuite.payloadBuilder({page: 1.5});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"page" must be an integer/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures hitsPerPage is integer', () => {
            const payload = testSuite.payloadBuilder({hitsPerPage: 25.5});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"hitsPerPage" must be an integer/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures sort is array', () => {
            const payload = testSuite.payloadBuilder({sort: 'sku'});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"sort" must be an array/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures sort field is present', () => {
            const payload = testSuite.payloadBuilder({sort: [{}]});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"field" is required]/);
                expect(response.statusCode).to.equal(400);
              });
          });

          it('ensures sort direction is "asc" or "desc"', () => {
            const payload = testSuite.payloadBuilder({sort: [{field: 'sku', direction: 'upwards'}]});

            return specRequest({
              url: '/indexes/test-index/query',
              method: 'post',
              headers: testSuite.headers,
              payload
            })
              .then(response => {
                expect(response.result.message).to.match(/"direction" must be one of \[asc, desc\]/);
                expect(response.statusCode).to.equal(400);
              });
          });
        });
      });
    });
  });
});

