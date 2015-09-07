'use strict';

var Path = require('path');
var Hapi = require('hapi');
var Swaggerize = require('swaggerize-hapi');

var server = new Hapi.Server();

server.connection({port: process.env.PORT | 8000});

server.register({
  register: Swaggerize,
  options: {
    api: require('../swagger.json'),
    handlers: Path.join(__dirname, './handlers')
  }
}, function (err) {
  if (err) {
    return console.error(err);
  }

  server.start(function (err) {
    if (err) {
      return console.error(err);
    }

    console.log('Server listening on port', server.info.port);
  });
});
