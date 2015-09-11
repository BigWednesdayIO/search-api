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
    callback(null, item);
  }

  get(query, callback) {
    const item = this._items.find(function (i) {
      return i.Item.id === query.Key.id;
    });

    callback(null, item);
  }
}

class DynamoDBStub {}
DynamoDBStub.DocumentClient = DynamoDocumentClientStub;

const indexingTask = proxyquire('../lib/indexing_task', {'aws-sdk': {DynamoDB: DynamoDBStub}});

describe('Indexing task', function () {
  let clock;
  const testDate = new Date();

  before(function () {
    clock = sinon.useFakeTimers(testDate.getTime(), 'Date');
  });

  after(function () {
    clock.restore();
  });

  describe('create', function () {
    it('assigns an id', function (done) {
      indexingTask.create({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('id');
        done();
      }, done);
    });

    it('assigns unique ids', function (done) {
      const indexingTasks = [];

      for (let i = 0, len = 1000; i < len; i++) {
        indexingTasks.push(indexingTask.create({number: i}));
      }

      Promise.all(indexingTasks).then(function (tasks) {
        const uniqueIDs = _.uniq(tasks, function (t) {
          return t.id;
        });

        expect(uniqueIDs).to.have.length(indexingTasks.length);
        done();
      }, done);
    });

    it('assigns createdAt date', function (done) {
      indexingTask.create({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('createdAt');
        done();
      }, done);
    });

    it('createdDate is an ISO format date string', function (done) {
      indexingTask.create({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('createdAt', testDate.toISOString());
        done();
      }, done);
    });

    it('assigns an objectID', function (done) {
      indexingTask.create({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('objectID');
        done();
      }, done);
    });

    it('assigns unique objectIDs', function (done) {
      const indexingTasks = [];

      for (let i = 0, len = 1000; i < len; i++) {
        indexingTasks.push(indexingTask.create({number: i}));
      }

      Promise.all(indexingTasks).then(function (tasks) {
        const uniqueIDs = _.uniq(tasks, function (t) {
          return t.objectID;
        });

        expect(uniqueIDs).to.have.length(indexingTasks.length);
        done();
      }, done);
    });
  });

  describe('get', function () {
    let createdTask;

    before(function (done) {
      indexingTask.create({name: 'an object'}).then(function (task) {
        createdTask = task;
        done();
      }, done);
    });

    it('retrieves task information by id', function (done) {
      indexingTask.get(createdTask.id).then(function (task) {
        expect(task).to.be.eql(createdTask);
        done();
      }, done);
    });
  });
});
