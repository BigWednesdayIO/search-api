'use strict';

const Index = require('../../index');

module.exports = {
  post(req, reply) {
    const index = new Index(req.params.name);

    index.insert(req.payload)
      .then(o => {
        reply(o).created(req.path + '/' + o.objectID);
      }, reply.error.bind(reply));
  }
};
