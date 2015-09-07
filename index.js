'use strict';

var Hapi = require('hapi');
var server = new Hapi.Server();

// Hapi allocates an available port if PORT is not set
server.connection({ port: process.env.PORT });

server.route({
    method: 'GET',
    path: '/',
    config: {
      description: 'Test endpoint'
    },
    handler: function (request, reply) {
      return reply({ message: 'Endpoint OK' });
    }
});

server.start(function (err) {
  if(err) {
    console.log('Error starting server', err);
  }

  console.log('Server listening on port', server.info.port);
});
