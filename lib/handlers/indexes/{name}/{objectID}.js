'use strict';

const boom = require('boom');

const Index = require('../../../index');

module.exports = {
  get(req, reply) {
    const index = new Index(req.params.name);

    index.getObject(req.params.objectID)
      .then(reply, err => {
        if (err.indexFound === false) {
          return reply(boom.notFound(`Index ${req.params.name} does not exist`));
        }

        if (err.objectFound === false) {
          return reply(boom.notFound(`Index does not contain object with identifier ${req.params.objectID}`));
        }

        reply.error(err);
      });
  },

  put(req, reply) {
    const index = new Index(req.params.name);

    index.upsertObject(req.params.objectID, req.payload)
      .then(result => {
        const response = reply(result.upserted);

        if (result.version === 1) {
          response.created(req.path);
        }
      });
  }
};
