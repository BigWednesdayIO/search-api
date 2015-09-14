'use strict';

const indexingTask = require('../../indexing_task');

module.exports = {
  post(req, reply) {
    indexingTask.create(req.params.name, req.payload).then(task => {
      reply({
        taskID: task.id,
        objectID: task.objectID,
        createdAt: task.createdAt
      }).created(req.path + '/tasks/' + task.id);
    }, reply.error.bind(reply));
  }
};
