'use strict';

const server = require('./lib/server');

server.start(function (err) {
  if (err) {
    return console.error(err);
  }

  console.log('Server listening on port', server.info.port);
});
