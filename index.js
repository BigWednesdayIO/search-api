'use strict';

require('./lib/server')(function (err, server) {
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
