'use strict';

const Index = require('../../index');

module.exports = {
  post: function (req, reply) {
    const index = new Index(req.params.name);

    index.insert(req.payload).then(reply, function (err) {
      console.error(err);
      reply(err);
    });
  }
};
