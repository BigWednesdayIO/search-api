'use strict';

const _ = require('lodash');
const Boom = require('boom');
const Joi = require('joi');

const Index = require('../../../index');

const extensionSchema = Joi.object({
  requests: Joi.array().items(Joi.object({
    action: Joi.string().valid('create', 'upsert'),
    objectID: Joi.string().when('action', {is: 'create', then: Joi.any().forbidden(), otherwise: Joi.any()})
  }).unknown())
}).unknown();

module.exports = {
  post(req, reply) {
    Joi.validate(req.payload, extensionSchema, err => {
      if (err) {
        return reply(Boom.badRequest(err.message));
      }

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
    });
  }
};
