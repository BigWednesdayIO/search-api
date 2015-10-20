'use strict';

const qs = require('querystring');
const _ = require('lodash');

module.exports = function (encoded) {
  const stingifiedArray = /^\[.*\]$/;
  const firstPass = qs.parse(encoded);

  return _.mapValues(firstPass, value => {
    if (stingifiedArray.test(value)) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    }
    return value;
  });
};
