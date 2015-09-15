'use strict';

const Index = require('../../../index');

module.exports = {
  get(req, reply) {
    const index = new Index(req.params.name);

    index.getObject(req.params.objectID)
      .then(reply, reply.error.bind(reply));
  }
};
