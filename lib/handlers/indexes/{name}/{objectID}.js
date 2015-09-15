'use strict';

const boom = require('boom');

const Index = require('../../../index');

module.exports = {
  get(req, reply) {
    const index = new Index(req.params.name);

    index.getObject(req.params.objectID)
      .then(reply, err => {
        if (err.body && err.body.found === false) {
          return reply(boom.notFound(`Index does not contain object with identifier ${req.params.objectID}`));
        }

        if (err.status === 404) {
          return reply(boom.notFound(`Index ${req.params.name} does not exist`));
        }

        reply.error(err);
      });
  }
};
