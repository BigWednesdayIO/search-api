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
