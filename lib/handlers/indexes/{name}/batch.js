'use strict';

const Boom = require('boom');
const Joi = require('joi');

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../index'));

const extensionSchema = Joi.object({
  requests: Joi.array().items(Joi.object({
    action: Joi.string().valid('create', 'upsert', 'delete'),
    body: Joi.object({}).unknown().when('action', {is: 'delete', then: Joi.any().forbidden(), otherwise: Joi.any().required()}),
    objectID: Joi.string().when('action', {is: 'create', then: Joi.any().forbidden(), otherwise: Joi.any().required()})
  }).unknown())
}).unknown();

module.exports = {
  post(req, reply) {
    Joi.validate(req.payload, extensionSchema, err => {
      if (err) {
        return reply(Boom.badRequest(err.message));
      }

      const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

      index.batchOperation(req.payload.requests)
        .then(result => {
          reply({objectIDs: result.inserted.concat(result.upserted)});
        }, reply.error.bind(reply));
    });
  }
};
