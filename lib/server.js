'use strict';

const Path = require('path');
const Hapi = require('hapi');
const Swaggerize = require('swaggerize-hapi');
const HapiAuthBearerToken = require('hapi-auth-bearer-token');
const Version = require('./version');

const authKeys = require('./config/keys.json');
const tokenStrategy = require('../lib/token_auth_strategy')(authKeys);

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

module.exports = callback => {
  const server = new Hapi.Server();

  server.connection({port: 8080});

  server.decorate('reply', 'error', function (err) {
    console.error(err);
    this.response(err);
  });

  server.register({register: HapiAuthBearerToken}, err => {
    if (err) {
      return callback(err);
    }

    server.auth.strategy('api_key', 'bearer-access-token', {
      allowQueryToken: false,
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
