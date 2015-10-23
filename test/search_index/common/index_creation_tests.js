'use strict';

const _ = require('lodash');
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

      createIndexStub = sandbox.stub(elasticsearchClient.indices, 'create', () => Promise.resolve({}));
      putAliasStub = sandbox.stub(elasticsearchClient.indices, 'putAlias', () => Promise.resolve({}));

      sandbox.stub(elasticsearchClient, 'index', () => Promise.resolve({}));
      sandbox.stub(elasticsearchClient, 'bulk', () => Promise.resolve({items: []}));
      sandbox.stub(elasticsearchClient.indices, 'putMapping', () => Promise.resolve({}));
      sandbox.stub(elasticsearchClient.indices, 'getMapping', () => Promise.resolve({testIndex: {}}));
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('when the index does not exist', () => {
      let index;

      beforeEach(() => {
        index = new SearchIndex(newIndexName);
      });

      tests.forEach(test => {
        it(`creates an index with a unique name when ${test.functionName} is called`, () => {
          return index[test.functionName].apply(index, test.arguments)
            .then(() => {
              sinon.assert.calledOnce(createIndexStub);
              sinon.assert.calledWithMatch(createIndexStub, sinon.match({index: expectedUniqueIndexName}));
            });
        });

        it(`applies default index settings when ${test.functionName} is called`, () => {
          const defaultSettings = {
            analysis: {
              filter: {
                instant_search_filter: {
                  type: 'edge_nGram',
                  min_gram: 1,
                  max_gram: 20
                }
              },
              analyzer: {
                instant_search: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'instant_search_filter']
                }
              }
            }
          };

          return index[test.functionName].apply(index, test.arguments)
            .then(() => {
              sinon.assert.calledWithMatch(createIndexStub, sinon.match(value => {
                return _.eq(value.body.settings, defaultSettings);
              }, 'default settings'));
            });
        });

        it(`applies default index mappings when ${test.functionName} is called`, () => {
          const defaultMappings = {
            object: {
              _all: {enabled: false},
              dynamic_templates: [
                {
                  'default': {
                    match: '*',
                    match_mapping_type: 'string',
                    mapping: {
                      search_analyzer: 'standard',
                      index_analyzer: 'instant_search'
                    }
                  }
                }
              ]
            }
          };

          return index[test.functionName].apply(index, test.arguments)
            .then(() => {
              sinon.assert.calledWithMatch(createIndexStub, sinon.match(value => {
                return _.eq(value.body.mappings, defaultMappings);
              }, 'default mappings'));
            });
        });

        it(`sets the index name as an alias when ${test.functionName} is called`, () => {
          return index[test.functionName].apply(index, test.arguments)
            .then(() => {
              sinon.assert.calledOnce(createIndexStub);
              sinon.assert.calledWith(createIndexStub, sinon.match({index: expectedUniqueIndexName}));
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
