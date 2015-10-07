'use strict';

const cuid = require('cuid');

const specRequest = require('./spec_request');

const expect = require('chai').expect;

describe('/indexes/{name}/batch', () => {
  let testIndexName;

  describe('post', () => {
    beforeEach(() => {
      testIndexName = `test_index_${cuid()}`;
    });

    afterEach(() => {
      return specRequest({
        url: `/1/indexes/${testIndexName}`,
        method: 'DELETE',
        headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
      });
    });

    describe('create operation', () => {
      it('adds new objects to the index', () => {
        const payload = {
          requests: [{
            action: 'create',
            body: {
              name: 'object 1'
            }
          }, {
            action: 'create',
            body: {
              name: 'object 2'
            }
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.have.property('objectIDs');

            const checkObjects = response.result.objectIDs.map(id => {
              return specRequest({
                url: `/1/indexes/${testIndexName}/${id}`,
                headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
              });
            });

            Promise.all(checkObjects)
              .then(results => {
                results.forEach(response => {
                  expect(response.statusCode).to.equal(200);
                });
              });
          });
      });
    });

    describe('upsert operation', () => {
      it('adds new objects to the index', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            body: {
              name: 'object 1'
            },
            objectID: '1'
          }, {
            action: 'upsert',
            body: {
              name: 'object 2'
            },
            objectID: '2'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.have.property('objectIDs');

            const checkObjects = response.result.objectIDs.map(id => {
              return specRequest({
                url: `/1/indexes/${testIndexName}/${id}`,
                headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
              });
            });

            Promise.all(checkObjects)
              .then(results => {
                results.forEach(response => {
                  expect(response.statusCode).to.equal(200);

                  const expectedName = response.objectID === '1' ? 'object 1' : 'object 2';
                  expect(response.name).to.equal(expectedName);
                });
              });
          });
      });

      it('replaces existing objects in the index', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            body: {
              name: 'object 1'
            },
            objectID: '1'
          }, {
            action: 'upsert',
            body: {
              name: 'object'
            },
            objectID: '2'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
        .then(response => {
          expect(response.statusCode).to.equal(200);

          payload.requests[0].body.name = 'new object 1';
          payload.requests[1].body.name = 'new object 2';

          return specRequest({
            url: `/1/indexes/${testIndexName}/batch`,
            method: 'post',
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
            payload
          });
        })
        .then(response => {
          expect(response.statusCode).to.equal(200);

          const checkObjects = ['1', '2'].map(id => {
            return specRequest({
              url: `/1/indexes/${testIndexName}/${id}`,
              headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
            });
          });

          Promise.all(checkObjects)
            .then(results => {
              results.forEach(response => {
                expect(response.statusCode).to.equal(200);

                const expectedName = response.objectID === '1' ? 'new object 1' : 'new object 2';
                expect(response.name).to.equal(expectedName);
              });
            });
        });
      });
    });

    describe('delete operation', () => {
      it('removes objects from the index', () => {
        const createPayload = {
          requests: [{
            action: 'upsert',
            body: {
              name: 'object 1'
            },
            objectID: '1'
          }, {
            action: 'upsert',
            body: {
              name: 'object'
            },
            objectID: '2'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload: createPayload
        })
        .then(response => {
          expect(response.statusCode).to.equal(200);

          const deletePayload = {
            requests: [{
              action: 'delete',
              objectID: '1'
            }, {
              action: 'delete',
              objectID: '2'
            }]
          };

          return specRequest({
            url: `/1/indexes/${testIndexName}/batch`,
            method: 'post',
            headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
            payload: deletePayload
          });
        })
        .then(response => {
          expect(response.statusCode).to.equal(200);

          const checkObjects = ['1', '2'].map(id => {
            return specRequest({
              url: `/1/indexes/${testIndexName}/${id}`,
              headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'}
            });
          });

          Promise.all(checkObjects)
            .then(results => {
              results.forEach(response => {
                expect(response.statusCode).to.equal(404);
                expect(response.message).to.match(/Index does not contain object with identifier/);
              });
            });
        });
      });
    });

    describe('validation', () => {
      it('does not allow objectID to be sent for create actions', () => {
        const payload = {
          requests: [{
            action: 'create',
            body: {name: 'something'},
            objectID: 'myid'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"objectID" is not allowed]/);
          });
      });

      it('does not allow unknown actions', () => {
        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload: {requests: [{action: 'unknown', body: {}}]}
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"action" must be one of/);
          });
      });

      it('requires body parameter for create actions', () => {
        const payload = {
          requests: [{
            action: 'create'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"body" is required/);
          });
      });

      it('requires body parameter for upsert actions', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            objectID: '1'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"body" is required/);
          });
      });

      it('does not allow body to be sent for delete actions', () => {
        const payload = {
          requests: [{
            action: 'delete',
            body: {name: 'something'},
            objectID: 'myid'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"body" is not allowed]/);
          });
      });

      it('requires objectID parameter for upsert actions', () => {
        const payload = {
          requests: [{
            action: 'upsert',
            body: {name: 'something'}
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"objectID" is required/);
          });
      });

      it('requires objectID parameter for delete actions', () => {
        const payload = {
          requests: [{
            action: 'delete'
          }]
        };

        return specRequest({
          url: `/1/indexes/${testIndexName}/batch`,
          method: 'post',
          headers: {Authorization: 'Bearer 8N*b3i[EX[s*zQ%'},
          payload
        })
          .then(response => {
            expect(response.statusCode).to.equal(400);
            expect(response.result.message).to.match(/"objectID" is required/);
          });
      });
    });
  });
});
