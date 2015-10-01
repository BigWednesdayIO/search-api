'use strict';

const _ = require('lodash');

const Index = require('../../../index');

module.exports = {
  post(req, reply) {
    const index = new Index(req.params.name);
    const batchRequests = _(req.payload.requests);

    const batchArgs = {
      insert: batchRequests
        .filter({action: 'create'})
        .map('body')
        .value(),
      upsert: batchRequests
        .filter({action: 'upsert'})
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
        reply({objectIDs: _.union(result.inserted, result.upserted)});
      }, reply.error.bind(reply));
  }
};
