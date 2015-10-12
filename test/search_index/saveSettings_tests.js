'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');

const SearchIndex = require('../../lib/search_index');

const testNewIndexName = 'my-index-name';
const testExistingIndexName = 'existing-index-name';

describe('Search Index', () => {
  describe('saveSettings', () => {
    let sandbox;
    let createIndexStub;
    let putAliasStub;
    let putMappingStub;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      putMappingStub = sandbox.stub(elasticsearchClient.indices, 'putMapping', () => {
        return Promise.resolve({});
      });

      sandbox.stub(elasticsearchClient.indices, 'getMapping', () => {
        const mapping = {
          testIndex: {
            mappings: {
              object: {
                dynamic_templates: []
              },
              properties: {
                previously_searchable: {
                  type: 'string',
                  index: 'analyzed'
                },
                previously_unsearchable: {
                  type: 'string',
                  index: 'no'
                }
              }
            }
          }
        };

        return Promise.resolve(mapping);
      });

      sandbox.stub(elasticsearchClient.indices, 'getAlias', args => {
        if (args.name === testExistingIndexName) {
          return Promise.resolve({
            anIndex: {
              aliases: {
                [testExistingIndexName]: {}
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
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('when the index does not exist', () => {
      let expectedUniqueIndexName;

      beforeEach(() => {
        const testDate = new Date();
        sandbox.useFakeTimers(testDate.getTime());

        expectedUniqueIndexName = `${testNewIndexName}_${testDate.getFullYear()}.${testDate.getMonth() + 1}.${testDate.getDate()}.${testDate.getMilliseconds()}`;

        const index = new SearchIndex(testNewIndexName);
        return index.saveSettings({});
      });

      it('creates the index with a unique name', () => {
        sinon.assert.calledOnce(createIndexStub);
        sinon.assert.calledWith(createIndexStub, {index: expectedUniqueIndexName});
      });

      it('sets the index name as an alias', () => {
        sinon.assert.calledOnce(putAliasStub);
        sinon.assert.calledWith(putAliasStub, {index: expectedUniqueIndexName, name: testNewIndexName});
      });
    });

    describe('when the index exists', () => {
      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);
        return index.saveSettings({});
      });

      it('does not create a new index', () => {
        sinon.assert.notCalled(createIndexStub);
        sinon.assert.notCalled(putAliasStub);
      });
    });

    describe('when searchable_fields is set', () => {
      const newFields = ['one', 'two'];
      const oldFields = ['previously_unsearchable'];

      beforeEach(() => {
        const index = new SearchIndex(testExistingIndexName);
        return index.saveSettings({searchable_fields: newFields.concat(oldFields)});
      });

      it('creates an index mapping', () => {
        sinon.assert.calledOnce(putMappingStub);
        sinon.assert.calledWithMatch(putMappingStub, {index: testExistingIndexName, type: 'object'});
      });

      it('defines new searchable fields in the mapping using templates', () => {
        newFields.forEach(field => {
          sinon.assert.calledWithMatch(putMappingStub, sinon.match(value => {
            const fieldTemplate = _.find(value.body.object.dynamic_templates, t => {
              return t[field];
            });

            if (!fieldTemplate) {
              console.error(`Template for ${field} not found`);
              return false;
            }

            const expectedTemplate = {
              [field]: {
                match: field,
                mapping: {
                  index: 'analyzed',
                  type: '{dynamic_type}'
                }
              }
            };

            return _.eq(fieldTemplate, expectedTemplate);
          }, `${field} template`));
        });
      });

      it('makes all other fields not searchable in the mapping using a template', () => {
        sinon.assert.calledWithMatch(putMappingStub, sinon.match(value => {
          const disableDefaultTemplate = {
            not_searchable: {
              match: '*',
              mapping: {
                index: 'no'
              }
            }
          };

          return _.eq(_.last(value.body.object.dynamic_templates), disableDefaultTemplate);
        }, 'not searchable template'));
      });

      it('disables previously searchable fields in the mapping properties', () => {
        sinon.assert.calledWithMatch(putMappingStub, sinon.match(value => {
          return value.body.object.properties.previously_searchable.index === 'no';
        }, 'disable searchable field'));
      });

      it('enables previously unsearchable fields in the mapping properties', () => {
        sinon.assert.calledWithMatch(putMappingStub, sinon.match(value => {
          return value.body.object.properties.previously_unsearchable.index === 'analyzed';
        }, 'enable unsearchable field'));
      });
    });

    describe('when searchable_fields is not set', () => {
      beforeEach(() => {
        const index = new SearchIndex(testNewIndexName);
        return index.saveSettings({});
      });

      it('does not disable any fields with a mapping', () => {
        sinon.assert.notCalled(putMappingStub);
      });
    });

    it('returns the settings', () => {
      const index = new SearchIndex(testNewIndexName);
      return index.saveSettings({searchable_fields: ['one'], another_setting: true})
        .then(settings => {
          expect(settings).to.deep.equal({searchable_fields: ['one'], another_setting: true});
        });
    });
  });
});
