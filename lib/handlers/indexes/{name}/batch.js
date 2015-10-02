'use strict';

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

      index.batchOperation(req.payload.requests)
        .then(result => {
          reply({objectIDs: result.inserted.concat(result.upserted)});
        }, reply.error.bind(reply));
    });
  }
};
