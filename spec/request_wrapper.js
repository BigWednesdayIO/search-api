'use strict';

const server = require('../lib/server');
const swagger = require('../swagger.json');

module.exports = function (options) {
  return new Promise(function (resolve, reject) {
    server.inject(options, function (response) {
      if (!response.request.route || response.request.route.path === '/{p*}') {
        return reject(new Error(`Undefined route {$options.url}`));
      }

      const apiBasePath = swagger.basePath || '';
      const route = response.request.route.path.replace(new RegExp('^' + apiBasePath), '');
      const method = response.request.method;

      const swaggerPath = swagger.paths[route];

      if (!swaggerPath) {
        return reject(new Error(`Route ${route} is undocumented. Please add to swagger.json.`));
      }

      const swaggerMethod = swaggerPath[method];

      if (!swaggerMethod) {
        return reject(new Error(`${method} for route ${route} is undocumented. Please add to swagger.json.`));
      }

      const swaggerResponse = swaggerMethod.responses[response.statusCode];

      if (response.statusCode !== 404 && !swaggerResponse) {
        return reject(new Error(`${response.statusCode} result for ${method} of route ${route} is undocumented. Please add to swagger.json.`));
      }

      return resolve(response);
    });
  });
};
