'use strict';

const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const SearchOperationEvent = require('./search_operation_event');

let host;
if (process.env.LOGSTASH_HOST) {
  host = process.env.LOGSTASH_HOST;
} else {
  throw new Error('Environment variable LOGSTASH_HOST not set');
}

let port;
if (process.env.LOGSTASH_PORT) {
  port = process.env.LOGSTASH_PORT;
} else {
  throw new Error('Environment variable LOGSTASH_PORT not set');
}

exports.register = function (server, options, next) {
  server.on('response', request => {
    const packet = new Buffer(JSON.stringify(new SearchOperationEvent(request)));
    client.send(packet, 0, packet.length, port, host);
  });

  return next();
};

exports.register.attributes = {
  name: 'analytics_logger'
};
