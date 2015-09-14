'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const expect = require('chai').expect;

class DynamoDocumentClientStub {
  constructor() {
    this._items = [];
  }

  put(item, callback) {
    this._items.push(item);
    callback(null, {});
  }

  get(query, callback) {
    const item = this._items.find(i => {
      return i.Item.id === query.Key.id;
    });

    callback(null, item);
  }
}

const dynamoDbStub = {
  documentClient: () => {
    return new DynamoDocumentClientStub();
  },
  tables: require('../lib/dynamodb').tables
};

const indexingTask = proxyquire('../lib/indexing_task', {'./dynamodb': dynamoDbStub});

describe('Indexing task', () => {
  let clock;
  const testDate = new Date();

  before(() => {
    clock = sinon.useFakeTimers(testDate.getTime(), 'Date');
  });

  after(() => {
    clock.restore();
  });

  describe('create', () => {
    it('assigns an id', done => {
      indexingTask.create({name: 'an object'}).then(task => {
        expect(task).to.have.property('id');
        done();
      }, done);
    });

    it('assigns unique ids', done => {
      const indexingTasks = [];

      for (let i = 0, len = 1000; i < len; i++) {
        indexingTasks.push(indexingTask.create({number: i}));
      }

      Promise.all(indexingTasks).then(tasks => {
        const uniqueIDs = _.uniq(tasks, t => {
          return t.id;
        });

        expect(uniqueIDs).to.have.length(indexingTasks.length);
        done();
      }, done);
    });

    it('assigns createdAt date', done => {
      indexingTask.create({name: 'an object'}).then(task => {
        expect(task).to.have.property('createdAt');
        done();
      }, done);
    });

    it('createdDate is an ISO format date string', done => {
      indexingTask.create({name: 'an object'}).then(task => {
        expect(task).to.have.property('createdAt', testDate.toISOString());
        done();
      }, done);
    });

    it('assigns an objectID', done => {
      indexingTask.create({name: 'an object'}).then(task => {
        expect(task).to.have.property('objectID');
        done();
      }, done);
    });

    it('assigns unique objectIDs', done => {
      const indexingTasks = [];

      for (let i = 0, len = 1000; i < len; i++) {
        indexingTasks.push(indexingTask.create({number: i}));
      }

      Promise.all(indexingTasks).then(tasks => {
        const uniqueIDs = _.uniq(tasks, t => {
          return t.objectID;
        });

        expect(uniqueIDs).to.have.length(indexingTasks.length);
        done();
      }, done);
    });
  });

  describe('get', () => {
    let createdTask;

    before(done => {
      indexingTask.create({name: 'an object'}).then(task => {
        createdTask = task;
        done();
      }, done);
    });

    it('retrieves task information by id', done => {
      indexingTask.get(createdTask.id).then(task => {
        expect(task).to.be.eql(createdTask);
        done();
      }, done);
    });
  });
});
