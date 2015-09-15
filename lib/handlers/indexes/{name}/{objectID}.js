'use strict';

const boom = require('boom');

const Index = require('../../../index');

module.exports = {
  get(req, reply) {
    const index = new Index(req.params.name);

    index.getObject(req.params.objectID)
      .then(reply, err => {
        if (err.body && err.body.found === false) {
          return reply(boom.notFound());
        }

        reply.error(err);
      });
  }
};
