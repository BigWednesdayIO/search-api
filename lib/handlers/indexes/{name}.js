'use strict';

const indexingTask = require('../../indexing_task');

module.exports = {
  post: function (req, reply) {
    indexingTask.create(req.params.name, req.payload).then(function (task) {
      reply({
        taskID: task.id,
        objectID: task.objectID,
        createdAt: task.createdAt
      }).created(req.path + '/tasks/' + task.id);
    }, function (err) {
      console.error(err);
      reply(err);
    });
  }
};
