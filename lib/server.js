'use strict';

const Path = require('path');
const Hapi = require('hapi');
const Boom = require('boom');
const Swaggerize = require('swaggerize-hapi');
const HapiAuthBearerToken = require('hapi-auth-bearer-token');
const Version = require('./version');
const AnalyticsLogger = require('./analytics_logger');

const plugins = [
  {register: Version},
  {register: AnalyticsLogger},
  {
    register: Swaggerize,
    options: {
      api: require('../swagger.json'),
      handlers: Path.join(__dirname, './handlers')
    }
  }
];

const tokenStrategy = require('../lib/token_auth_strategy')(require('./auth_tokens'));

module.exports = callback => {
  const server = new Hapi.Server();

  server.connection({port: 8080});

  server.decorate('reply', 'error', function (err) {
    console.error(err);
    this.response(err);
  });

  server.decorate('reply', 'indexingForbidden', function () {
    this.response(Boom.forbidden('Insufficient privileges for index management.'));
  });

  const searchMatcher = /^\/indexes\/[^\/]+\/query$/
  server.ext('onRequest', (request, reply) => {
    if (searchMatcher.test(request.path) && request.method === 'post') {
      request.headers['content-type'] = 'application/json';
    }

    reply.continue();
  });

  server.register({register: HapiAuthBearerToken}, err => {
    if (err) {
      return callback(err);
    }

    server.auth.strategy('api_key', 'bearer-access-token', {
      allowQueryToken: true,
      accessTokenName: 'authorization',
      validateFunc: tokenStrategy
    });

    server.register(plugins, err => {
      if (err) {
        return callback(err);
      }

      callback(null, server);
    });
  });
};
