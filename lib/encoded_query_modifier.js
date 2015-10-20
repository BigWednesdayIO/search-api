'use strict';

const queryRouteMatcher = /^\/indexes\/[^\/]+\/query$/;

const isEncodedQueryRequest = function (request) {
  return queryRouteMatcher.test(request.path) &&
      request.method === 'post' &&
      request.headers['content-type'] === 'application/x-www-form-urlencoded';
};

exports.register = function (server, options, next) {
  server.ext('onRequest', (request, reply) => {
    if (isEncodedQueryRequest(request)) {
      request.headers['content-type'] = 'application/json';
    }

    reply.continue();
  });

  return next();
};

exports.register.attributes = {
  name: 'encoded-query'
};
