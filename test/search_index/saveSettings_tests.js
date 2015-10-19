'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');

const SearchIndex = require('../../lib/search_index');

const testExistingIndexName = 'existing-index-name';

describe('Search Index', () => {
  describe('saveSettings', () => {
    let sandbox;
    let putMappingStub;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      putMappingStub = sandbox.stub(elasticsearchClient.indices, 'putMapping', () => Promise.resolve({}));

      sandbox.stub(elasticsearchClient.indices, 'getMapping', () => {
        const mapping = {
          testIndex: {
            mappings: {
              object: {
                dynamic_templates: [],
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
    });

    afterEach(() => {
      sandbox.restore();
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
            const fieldTemplate = _.find(value.body.object.dynamic_templates, t => t[field]);

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
        const index = new SearchIndex(testExistingIndexName);
        return index.saveSettings({});
      });

      it('enables search on existing mapping properties', () => {
        sinon.assert.calledWithMatch(putMappingStub, sinon.match(value => {
          return value.body.object.properties.previously_unsearchable.index === 'analyzed';
        }, 'enable all fields'));
      });

      it('removes all templates', () => {
        sinon.assert.calledWithMatch(putMappingStub, sinon.match(value => {
          return value.body.object.dynamic_templates.length === 0;
        }, 'remove templates'));
      });
    });

    it('records the current settings in a meta field in the mapping', () => {
      const index = new SearchIndex(testExistingIndexName);
      const settings = {searchable_fields: ['one'], another_setting: true};

      return index.saveSettings(settings)
        .then(() => {
          sinon.assert.calledWithMatch(putMappingStub, sinon.match(value => {
            return _.eq(value.body.object._meta.indexSettings, settings);
          }, 'searchable_fields meta'));
        });
    });

    it('returns the settings', () => {
      const index = new SearchIndex(testExistingIndexName);
      return index.saveSettings({searchable_fields: ['one'], another_setting: true})
        .then(settings => {
          expect(settings).to.deep.equal({searchable_fields: ['one'], another_setting: true});
        });
    });
  });
});
