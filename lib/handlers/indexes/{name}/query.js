'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Search = require('../../../search');

const search = new Search();

// Required until this fix lands https://github.com/tlivings/enjoi/pull/10
// after this validation can be safely removed as it will be present based on swagger.json
const extensionSchema = Joi.object({
  sort: Joi.array().items(Joi.object({
    direction: Joi.string().valid('asc', 'desc')
  }).unknown())
}).unknown();

module.exports = {
  post(req, reply) {
    Joi.validate(req.payload, extensionSchema, err => {
      if (err) {
        return reply(Boom.badRequest(err.message));
      }

      search.query(req.params.name, req.payload)
        .then(reply, reply.error.bind(reply));
    });
  }
};
