'use strict';

var index = require('../../index');

module.exports = {
  post: function (req, reply) {
    index.insert(req.payload).then(reply, function (err) {
      console.error(err);
      reply(err);
    });
  }
};
