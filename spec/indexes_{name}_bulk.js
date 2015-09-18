'use strict';

const cuid = require('cuid');

const specRequest = require('./spec_request');
const elasticsearchClient = require('../lib/elasticsearchClient');

const expect = require('chai').expect;

describe('/indexes/{name}/bulk', () => {
  const testIndexName = `test_index_${cuid()}`;

  describe('post', () => {
    after(() => {
      return elasticsearchClient.indices.delete({index: testIndexName});
    });

    describe('addObject operation', () => {
      it('adds multiple objects to the index', () => {
        const payload = {
          requests: [{
            action: 'addObject',
            body: {
              name: 'object 1'
            }
          }, {
            action: 'addObject',
            body: {
              name: 'object 2'
            }
          }]
        };

        return specRequest({url: `/1/indexes/${testIndexName}/batch`, method: 'post', payload})
          .then(response => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.have.property('objectIDs');

            // TODO: replace once async indexing is in place
            return elasticsearchClient.mget({index: testIndexName, body: {ids: response.result.objectIDs}})
              .then(result => {
                expect(result.docs).to.have.length(2);
              });
          });
      });
    });
  });
});
