'use strict';

const indexingTask = require('../../../../indexing_task');

module.exports = {
  get: function (req, reply) {
    indexingTask.get(req.params.id).then(function (task) {
      reply(task);
    }, function (err) {
      console.error(err);
      reply(err);
    });
  }
};
