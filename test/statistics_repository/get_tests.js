'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../lib/elasticsearchClient');
const StatisticsRepository = require('../../lib/statistics_repository');

describe('Statistics repository', () => {
  describe('get', () => {
    let statsStub;

    beforeEach(() => {
      statsStub = sinon.stub(elasticsearchClient.indices, 'stats', args => {
        if (args.index === '1_*') {
          return Promise.resolve({_all: {primaries: {docs: {count: 15, deleted: 0}}}});
        }

        return Promise.resolve({_all: {primaries: {docs: {count: 15, deleted: 5}}}});
      });
    });

    afterEach(() => {
      statsStub.restore();
    });

    it('queries elasticsearch for the stats for the clientId', () => {
      return new StatisticsRepository().get('2')
        .then(() => {
          // getting stats for 2_* will return only stats for indexes prefixed with that clientId, it does not match x2_x
          sinon.assert.calledWithMatch(statsStub, sinon.match({index: '2_*', metric: 'docs'}));
        });
    });

    it('returns total number of records', () => {
      return new StatisticsRepository().get('1')
        .then(stats => {
          expect(stats.totalRecords).to.equal(15);
        });
    });

    it('does not include deleted records in the total', () => {
      return new StatisticsRepository().get('2')
        .then(stats => {
          expect(stats.totalRecords).to.equal(10);
        });
    });
  });
});
