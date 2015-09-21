'use strict';

module.exports = function (keyData) {
  return (token, callback) => {
    if (keyData[token]) {
      return callback(null, true, {name: keyData[token], token});
    }

    callback(null, false);
  };
};

