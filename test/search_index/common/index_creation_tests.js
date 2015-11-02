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
        describe(`and ${test.functionName} is called`, () => {
          it('creates an index with a unique name', () => {
            return index[test.functionName].apply(index, test.arguments)
              .then(() => {
                sinon.assert.calledOnce(createIndexStub);
                sinon.assert.calledWithMatch(createIndexStub, sinon.match({index: expectedUniqueIndexName}));
              });
          });

          it('applies default index settings', () => {
            const defaultSettings = {
              analysis: {
                filter: {
                  instant_search_filter: {
                    type: 'edgeNGram',
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

          it('disables the _all field', () => {
            return index[test.functionName].apply(index, test.arguments)
              .then(() => {
                sinon.assert.calledWithMatch(createIndexStub, sinon.match(value => {
                  return _.eq(value.body.mappings.object._all, {enabled: false});
                }, '_all disabled'));
              });
          });

          it('sets the instant search template for string fields', () => {
            return index[test.functionName].apply(index, test.arguments)
              .then(() => {
                sinon.assert.calledWithMatch(createIndexStub, sinon.match(value => {
                  const template = value.body.mappings.object.dynamic_templates[0].string_fields;

                  return template.match === '*' &&
                    template.match_mapping_type === 'string' &&
                    template.mapping.type === 'string' &&
                    template.mapping.search_analyzer === 'standard' &&
                    template.mapping.analyzer === 'instant_search';
                }, 'string field instant search'));
              });
          });

          it('configures a raw string field for facetting and sorting', () => {
            return index[test.functionName].apply(index, test.arguments)
              .then(() => {
                sinon.assert.calledWithMatch(createIndexStub, sinon.match(value => {
                  const template = value.body.mappings.object.dynamic_templates[0].string_fields;

                  return template.mapping.fields.raw.index === 'not_analyzed' &&
                    template.mapping.fields.raw.type === 'string';
                }, 'raw string field'));
              });
          });

          it('sets the index name as an alias', () => {
            return index[test.functionName].apply(index, test.arguments)
              .then(() => {
                sinon.assert.calledOnce(putAliasStub);
                sinon.assert.calledWith(putAliasStub, sinon.match({index: expectedUniqueIndexName, name: newIndexName}));
              });
          });
        });
      });
    });

    describe('when the index already exists', () => {
      tests.forEach(test => {
        describe(`and ${test.functionName} is called`, () => {
          it('a new index is not created', () => {
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
});
