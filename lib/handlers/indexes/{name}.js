'use strict';

const Index = require('../../index');

module.exports = {
  post(req, reply) {
    const index = new Index(req.params.name);

    index.insertObject(req.payload)
      .then(o => {
        reply(o).created(`${req.path}/${o.objectID}`);
      }, reply.error.bind(reply));
  },

  delete(req, reply) {
    const index = new Index(req.params.name);

    index.drop().then(() => {
      reply().code(204);
    }, reply.error.bind(reply));
  }
};
