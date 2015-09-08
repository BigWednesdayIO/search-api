'use strict';

var Index = require('../../index');

module.exports = {
  post: function (req, reply) {
    var index = new Index(req.params.name);

    index.insert(req.payload).then(reply, function (err) {
      console.error(err);
      reply(err);
    });
  }
};
