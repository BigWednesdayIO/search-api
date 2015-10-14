'use strict';

const sinon = require('sinon');

const elasticsearchClient = require('../../../lib/elasticsearchClient');
const SearchIndex = require('../../../lib/search_index');
const newIndexName = 'newindex';
const existingIndexName = 'existingindex';

describe('Search Index', () => {
  describe('index creation', () => {
    const tests = [
      {functionName: 'insertObject', arguments: [{name: 'object'}]},
      {functionName: 'upsertObject', arguments: ['123', {name: 'object'}]},
      {functionName: 'batchOperation', arguments: [{requests: {}}]},
      {functionName: 'saveSettings', arguments: [{}]}
    ];

    let sandbox;
    let createIndexStub;
    let putAliasStub;
    let expectedUniqueIndexName;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      const testDate = new Date();
      sandbox.useFakeTimers(testDate.getTime());

      expectedUniqueIndexName = `${newIndexName}_${testDate.getFullYear()}.${testDate.getMonth() + 1}.${testDate.getDate()}.${testDate.getMilliseconds()}`;

      sandbox.stub(elasticsearchClient.indices, 'getAlias', args => {
        if (args.name === existingIndexName) {
          return Promise.resolve({
            anIndex: {
              aliases: {
                [existingIndexName]: {}
              }
            }
          });
        }

        const err = new Error();
        err.error = `alias [${args.name}] missing`;
        err.status = 404;

        return Promise.reject(err);
      });

      createIndexStub = sandbox.stub(elasticsearchClient.indices, 'create', () => {
        return Promise.resolve({});
      });

      putAliasStub = sandbox.stub(elasticsearchClient.indices, 'putAlias', () => {
        return Promise.resolve({});
      });

      sandbox.stub(elasticsearchClient, 'index', () => {
        return Promise.resolve({});
      });

      sandbox.stub(elasticsearchClient, 'bulk', () => {
        return Promise.resolve({items: []});
      });

      sandbox.stub(elasticsearchClient.indices, 'putMapping', () => {
        return Promise.resolve({});
      });
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('when the index does not exist', () => {
      tests.forEach(test => {
        it(`creates an index with a unique name when ${test.functionName} is called`, () => {
          const index = new SearchIndex(newIndexName);
          return index[test.functionName].apply(index, test.arguments)
            .then(() => {
              sinon.assert.calledOnce(createIndexStub);
              sinon.assert.calledWith(createIndexStub, {index: expectedUniqueIndexName});
            });
        });

        it(`sets the index name as an alias when ${test.functionName} is called`, () => {
          const index = new SearchIndex(newIndexName);
          return index[test.functionName].apply(index, test.arguments)
            .then(() => {
              sinon.assert.calledOnce(createIndexStub);
              sinon.assert.calledWith(createIndexStub, {index: expectedUniqueIndexName});
            });
        });
      });
    });

    describe('when the index already exists', () => {
      tests.forEach(test => {
        it(`a new index is not created when ${test.functionName} is called`, () => {
          const index = new SearchIndex(existingIndexName);
          return index[test.functionName].apply(index, test.arguments)
            .then(() => {
              sinon.assert.notCalled(createIndexStub);
              sinon.assert.notCalled(putAliasStub);
            });
        });
      });
    });
  });
});
