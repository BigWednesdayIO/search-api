'use strict';

const _ = require('lodash');

const Index = require('../../../index');

module.exports = {
  post(req, reply) {
    const index = new Index(req.params.name);
    const batchRequests = _(req.payload.requests);

    const batchArgs = {
      insert: batchRequests
        .filter({action: 'addObject'})
        .map('body')
        .value(),
      update: batchRequests
        .filter({action: 'updateObject'})
        .map(request => {
          return {
            data: request.body,
            objectID: request.objectID
          };
        })
        .value()
    };

    index.batchOperation(batchArgs)
      .then(result => {
        reply({objectIDs: _.union(result.inserted, result.updated)});
      }, reply.error.bind(reply));
  }
};
