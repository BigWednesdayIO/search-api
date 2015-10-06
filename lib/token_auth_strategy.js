'use strict';

module.exports = function (keys) {
  return (token, callback) => {
    if (keys.indexOf(token) >= 0) {
      return callback(null, true, {token});
    }

    callback(null, false);
  };
};

