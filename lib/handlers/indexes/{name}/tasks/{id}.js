'use strict';

const indexingTask = require('../../../../indexing_task');

module.exports = {
  get(req, reply) {
    indexingTask.get(req.params.id).then(task => {
      reply(task);
    }, reply.error.bind(reply));
  }
};
