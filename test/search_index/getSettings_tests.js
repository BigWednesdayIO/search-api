'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');

describe('Search Index', () => {
  describe('getSettings', () => {
    let retrievedSettings;
    let getMappingStub;

    before(() => {
      getMappingStub = sinon.stub(elasticsearchClient.indices, 'getMapping', args => {
        if (args.index === 'index') {
          const mapping = {
            testIndex: {
              mappings: {
                object: {
                  dynamic_templates: [
                    {three: {}},
                    {not_searchable: {}}
                  ],
                  properties: {
                    one: {
                      index: 'analyzed'
                    },
                    two: {
                      index: 'analyzed'
                    },
                    four: {
                      index: 'no'
                    }
                  }
                }
              }
            }
          };

          return Promise.resolve(mapping);
        }

        const err = new Error('index missing');
        err.status = 404;

        return Promise.reject(err);
      });

      const index = new SearchIndex('index');
      return index.getSettings()
        .then(settings => {
          retrievedSettings = settings;
        });
    });

    after(() => {
      getMappingStub.restore();
    });

    it('returns searchable_fields', () => {
      expect(retrievedSettings.searchable_fields).to.exist;
    });

    it('returns searchable_fields that exist in the mapping properties', () => {
      expect(retrievedSettings.searchable_fields).to.include('one');
      expect(retrievedSettings.searchable_fields).to.include('two');
    });

    it('returns searchable_fields that exist in the mapping templates', () => {
      expect(retrievedSettings.searchable_fields).to.include('three');
    });

    it('does not return fields that are not searchable in searchable_fields', () => {
      expect(retrievedSettings.searchable_fields).to.not.include('four');
    });

    it('does not return the not_searchable template as a searchable_field name', () => {
      expect(retrievedSettings.searchable_fields).to.not.include('not_searchable');
    });

    it('returns index not found errors', () => {
      const index = new SearchIndex('nonexistantindex');

      return index.getSettings()
        .then(() => {
          throw new Error('expected index not found error');
        }, err => {
          expect(err).to.have.property('objectFound', false);
          expect(err).to.have.property('indexFound', false);
        });
    });
  });
});
