'use strict';

const _ = require('lodash');
const Path = require('path');
const Hapi = require('hapi');
const Boom = require('boom');
const Swaggerize = require('swaggerize-hapi');
const HapiAuthBearerToken = require('hapi-auth-bearer-token');
const Version = require('./version');

const plugins = [
  {register: Version},
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

  server.decorate('reply', 'objectSizeExceeded', function (additionalInfo) {
    const message = _.compact(['Object exceeds 10k size limit', additionalInfo]).join(' - ');
    this.response(Boom.entityTooLarge(message));
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
