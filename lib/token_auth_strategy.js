'use strict';

const _ = require('lodash');

module.exports = function (authTokenData) {
  return (token, callback) => {
    const credentials = _.find(authTokenData, {token});

    if (credentials) {
      return callback(null, true, credentials);
    }

    callback(null, false);
  };
};
