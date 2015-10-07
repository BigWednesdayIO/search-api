'use strict';

const sinon = require('sinon');

const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');

const SearchIndex = require('../../lib/search_index');
let sourceIndex;
let newDestinationIndex;
let existingDestinationIndex;

describe('Search Index', () => {
  describe('move', () => {
    let updateAliasesStub;
    let getAliasStub;
    let updateAliasesArgs;

    before(() => {
      updateAliasesStub = sinon.stub(elasticsearchClient.indices, 'updateAliases', args => {
        updateAliasesArgs = args;
        return Promise.resolve({});
      });

      getAliasStub = sinon.stub(elasticsearchClient.indices, 'getAlias', () => {
        return Promise.resolve({existingindex: {}});
      });

      sourceIndex = new SearchIndex('movedindex');
      newDestinationIndex = new SearchIndex('myindex');
      existingDestinationIndex = new SearchIndex('existingindex');
    });

    after(() => {
      updateAliasesStub.restore();
      getAliasStub.restore();
    });

    it('assigns the destination\'s name as an alias to the source index', () => {
      return sourceIndex.move(newDestinationIndex)
        .then(() => {
          const addAction = updateAliasesArgs.body.actions.find(action => {
            return action.hasOwnProperty('add');
          });

          expect(addAction).to.exist;
          expect(addAction.add.index).to.equal('movedindex');
          expect(addAction.add.alias).to.equal('myindex');
        });
    });

    describe('when the destination exists', () => {
      it('removes the alias from the destination', () => {
        return sourceIndex.move(existingDestinationIndex)
          .then(() => {
            const removeAction = updateAliasesArgs.body.actions.find(action => {
              return action.hasOwnProperty('remove');
            });

            expect(removeAction).to.exist;
            expect(removeAction.remove.index).to.equal('existingindex');
            expect(removeAction.remove.alias).to.equal('existingindex');
          });
      });
    });
  });
});
