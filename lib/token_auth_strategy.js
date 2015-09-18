'use strict';

module.exports = function (token, callback) {
  // TODO check token and get client. Move to seperate file.
  if (token === '12345') {
    const name = 'bigwednesday.io';
    return callback(null, true, {name, token});
  }

  callback(null, false);
};
