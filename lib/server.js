'use strict';

const Path = require('path');
const Hapi = require('hapi');
const Swaggerize = require('swaggerize-hapi');
const Version = require('./version');

module.exports = callback => {
  const server = new Hapi.Server();

  server.connection({port: 8080});

  const plugins = [{
    register: Version
  }, {
    register: Swaggerize,
    options: {
      api: require('../swagger.json'),
      handlers: Path.join(__dirname, './handlers')
    }
  }];

  server.register(plugins, err => {
    if (err) {
      return callback(err);
    }

    callback(null, server);
  });
};
