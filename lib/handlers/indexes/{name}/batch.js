'use strict';

const _ = require('lodash');

const Index = require('../../../index');

module.exports = {
  post(req, reply) {
    const index = new Index(req.params.name);

    const batchArgs = {
      insert: _(req.payload.requests)
        .filter({action: 'addObject'})
        .map('body')
        .value()
    };

    index.batchOperation(batchArgs)
      .then(result => {
        reply({objectIDs: result.inserted});
      }, reply.error.bind(reply));
  }
};
