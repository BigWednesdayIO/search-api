'use strict';

const _ = require('lodash');
const sinon = require('sinon');

const indexingTask = require('../lib/indexing_task');

const expect = require('chai').expect;

describe('Indexing task', function () {
  let clock;
  const testDate = new Date();

  before(function () {
    clock = sinon.useFakeTimers(testDate.getTime(), 'Date');
  });

  after(function () {
    clock.restore();
  });

  describe('taskID', function () {
    it('is returned', function (done) {
      indexingTask({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('taskID');
        done();
      }, done);
    });

    it('is unique for each indexing task', function (done) {
      const indexingTasks = [];

      for (let i = 0, len = 1000; i < len; i++) {
        indexingTasks.push(indexingTask({number: i}));
      }

      Promise.all(indexingTasks).then(function (tasks) {
        const uniqueIDs = _.uniq(tasks, function (t) {
          return t.taskID;
        });

        expect(uniqueIDs).to.have.length(indexingTasks.length);
        done();
      }, done);
    });
  });

  describe('createdAt', function () {
    it('is returned', function (done) {
      indexingTask({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('createdAt');
        done();
      }, done);
    });

    it('is an ISO format date string', function (done) {
      indexingTask({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('createdAt', testDate.toISOString());
        done();
      }, done);
    });
  });

  describe('objectID', function () {
    it('is returned', function (done) {
      indexingTask({name: 'an object'}).then(function (task) {
        expect(task).to.have.property('objectID');
        done();
      }, done);
    });

    it('is unique for each indexing task', function (done) {
      const indexingTasks = [];

      for (let i = 0, len = 1000; i < len; i++) {
        indexingTasks.push(indexingTask({number: i}));
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
});
