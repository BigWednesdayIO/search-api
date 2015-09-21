'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const api = require('../swagger.json');
const serverFactory = require('../lib/server');

describe('endpoint authentcation', () => {
  const hasSecurity = function (route) {
    return route.security && route.security.length;
  };
  const handlerDefined = function (handlerPath, method) {
    try {
      const routes = require(`../lib/handlers${handlerPath}.js`);
      return Boolean(routes[method]);
    } catch (e) {
      return false;
    }
  };
  const buildUrl = function (base, path) {
    return `${base}${path}`;
  };
  const tests = [];

  _.forOwn(api.paths, (path, pathName) => {
    _.forOwn(path, (route, method) => {
      if (hasSecurity(route) && handlerDefined(pathName, method)) {
        tests.push({method, url: buildUrl(api.basePath, pathName)});
      }
    });
  });

  let server;

  before(done => {
    serverFactory((err, s) => {
      if (err) {
        return console.error(err);
      }
      server = s;
      done();
    });
  });

  tests.forEach(test => {
    it(`${test.method} on ${test.url} requires api key`, done => {
      server.inject(test, err => {
        expect(err.result.statusCode).to.equal(401);
        done();
      });
    });
  });
});
