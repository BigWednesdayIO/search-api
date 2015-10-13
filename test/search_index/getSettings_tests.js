'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const SearchIndex = require('../../lib/search_index');

describe('Search Index', () => {
  describe('getSettings', () => {
    const currentSettings = {searchable_fields: ['one', 'two']};
    let retrievedSettings;
    let getMappingStub;

    before(() => {
      getMappingStub = sinon.stub(elasticsearchClient.indices, 'getMapping', args => {
        if (args.index === 'index') {
          const mapping = {
            testIndex: {
              mappings: {
                object: {
                  _meta: {indexSettings: currentSettings}
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

    it('returns settings stored in index meta field', () => {
      expect(retrievedSettings).to.deep.equal(currentSettings);
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
