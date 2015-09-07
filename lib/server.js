'use strict';

var Path = require('path');
var Hapi = require('hapi');
var Swaggerize = require('swaggerize-hapi');
var Version = require('./version');

var server = new Hapi.Server();

server.connection({port: 8080});

var plugins = [{
  register: Version
}, {
  register: Swaggerize,
  options: {
    api: require('../swagger.json'),
    handlers: Path.join(__dirname, './handlers')
  }
}];

server.register(plugins, function (err) {
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
