'use strict';

const sinon = require('sinon');

const elasticsearchClient = require('../../lib/elasticsearchClient');

const SearchIndex = require('../../lib/search_index');
const searchIndex = new SearchIndex('myindex');
const movedIndex = new SearchIndex('movedindex');

describe('Search Index', () => {
  describe('move', () => {
    let updateAliasesStub;

    before(() => {
      updateAliasesStub = sinon.stub(elasticsearchClient.indices, 'updateAliases', () => {
        return Promise.resolve({});
      });
    });

    after(() => {
      updateAliasesStub.restore();
    });

    it('should assign the new name as an alias', () => {
      return searchIndex.move(movedIndex)
        .then(() => {
          const expectedAliasUpdate = {
            body: {
              actions: [
                {add: {index: 'myindex', alias: 'movedindex'}}
              ]
            }
          };

          sinon.assert.calledWith(updateAliasesStub, expectedAliasUpdate);
        });
    });
  });
});
