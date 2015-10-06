'use strict';

const Boom = require('boom');

module.exports = {
  put(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply(Boom.forbidden('Insufficient privileges for index management.'));
    }

    reply({});
  },

  get(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply(Boom.forbidden('Insufficient privileges for index management.'));
    }

    reply({});
  }
};
