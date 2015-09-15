'use strict';

const elasticsearchClient = require('../../lib/elasticsearchClient');

const _ = require('lodash');
const sinon = require('sinon');

const expect = require('chai').expect;

const indexData = [{
  indexName: 'one',
  data: []
}, {
  indexName: 'two',
  data: [{
    _id: '1',
    _source: {}
  }, {
    _id: '2',
    _source: {}
  }, {
    _id: '3',
    _source: {
      name: 'test'
    }
  }]
}];

describe('Index', () => {
  describe('getObject', () => {
    let elasticStub;
    let retrievedObject;

    before(() => {
      elasticStub = sinon.stub(elasticsearchClient, 'get', args => {
        return new Promise(resolve => {
          const index = _.find(indexData, {indexName: args.index});

          if (!index) {
            throw new Error(`index ${args.index} not found in test data`);
          }

          const o = _.find(index.data, {_id: args.id});

          resolve(o);
        });
      });

      const Index = require('../../lib/index');
      const index = new Index('two');

      return index.getObject('3')
        .then(o => {
          retrievedObject = o;
        });
    });

    after(() => {
      elasticStub.restore();
    });

    it('returns the object fields from the index', () => {
      const expectedData = indexData[1].data[2]._source;

      _.forOwn(expectedData, (value, property) => {
        expect(retrievedObject).to.have.property(property, value);
      });
    });

    it('returns the objectID', () => {
      const expectedId = indexData[1].data[2]._id;
      expect(retrievedObject).to.have.property('objectID', expectedId);
    });
  });
});
