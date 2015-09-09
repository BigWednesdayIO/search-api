'use strict';

const cuid = require('cuid');

module.exports = function () {
  return new Promise(function (resolve) {
    resolve({
      taskID: cuid(),
      objectID: cuid(),
      createdAt: new Date().toISOString()
    });
  });
};
