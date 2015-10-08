'use strict';

const sinon = require('sinon');

const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');

const SearchIndex = require('../../lib/search_index');

describe('Search Index', () => {
  describe('move', () => {
    let sandbox;
    let updateAliasesArgs;
    let deleteIndexStub;
    let sourceIndex;
    let existingDestinationIndex;
    let newDestinationIndex;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      sandbox.stub(elasticsearchClient.indices, 'updateAliases', args => {
        updateAliasesArgs = args;
        return Promise.resolve({});
      });

      sandbox.stub(elasticsearchClient.indices, 'getAlias', args => {
        if (args.name.indexOf('nonexistantsource') >= 0 && args.name.indexOf('newindex') >= 0) {
          const err = new Error('alias [nonexistantsource, newindex] missing');
          err.status = 404;

          return Promise.reject(err);
        }

        if (args.name.indexOf('nonexistantsource') >= 0 && args.name.indexOf('originalindex') >= 0) {
          return Promise.resolve({'1_originalindex': {aliases: {originalindex: {}}}});
        }

        return Promise.resolve({
          '1_existingindex': {aliases: {existingindex: {}}},
          '1_originalindex': {aliases: {originalindex: {}}}
        });
      });

      deleteIndexStub = sandbox.stub(elasticsearchClient.indices, 'delete', () => {
        return Promise.resolve({});
      });

      sourceIndex = new SearchIndex('originalindex');
      existingDestinationIndex = new SearchIndex('existingindex');
      newDestinationIndex = new SearchIndex('newindex');
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('when the destination index exists', () => {
      beforeEach(() => {
        return sourceIndex.move(existingDestinationIndex);
      });

      it('removes the destination alias from the destination index first', () => {
        const removeAction = updateAliasesArgs.body.actions[0];
        expect(removeAction.remove.index).to.equal('1_existingindex');
        expect(removeAction.remove.alias).to.equal('existingindex');
      });

      it('reassigns the destination alias to the source index second', () => {
        const addAction = updateAliasesArgs.body.actions[1];
        expect(addAction.add.index).to.equal('1_originalindex');
        expect(addAction.add.alias).to.equal('existingindex');
      });

      it('removes the source alias from the source index third', () => {
        const addAction = updateAliasesArgs.body.actions[2];
        expect(addAction.remove.index).to.equal('1_originalindex');
        expect(addAction.remove.alias).to.equal('originalindex');
      });

      it('removes the old destination index', () => {
        sinon.assert.calledOnce(deleteIndexStub);
        sinon.assert.calledWith(deleteIndexStub, {index: '1_existingindex'});
      });
    });

    describe('when the destination index does not exist', () => {
      beforeEach(() => {
        return sourceIndex.move(newDestinationIndex);
      });

      it('sets the destination alias on the source index first', () => {
        const addAction = updateAliasesArgs.body.actions[0];
        expect(addAction.add.index).to.equal('1_originalindex');
        expect(addAction.add.alias).to.equal('newindex');
      });

      it('removes the source alias from the source index second', () => {
        const addAction = updateAliasesArgs.body.actions[1];
        expect(addAction.remove.index).to.equal('1_originalindex');
        expect(addAction.remove.alias).to.equal('originalindex');
      });

      it('does not remove any indexes', () => {
        sinon.assert.notCalled(deleteIndexStub);
      });
    });

    describe('errors', () => {
      it('returns index not found error when source does not exist, and neither does destination', () => {
        const nonExistantSource = new SearchIndex('nonexistantsource');

        return nonExistantSource.move(newDestinationIndex)
          .then(() => {
            throw new Error('Expected index not found error');
          }, err => {
            expect(err).to.have.property('indexFound', false);
          });
      });

      it('returns index not found error when source does not exist, but destination does', () => {
        const nonExistantSource = new SearchIndex('nonexistantsource');

        return nonExistantSource.move(existingDestinationIndex)
          .then(() => {
            throw new Error('Expected index not found error');
          }, err => {
            expect(err).to.have.property('indexFound', false);
          });
      });
    });
  });
});
