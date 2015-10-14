'use strict';

const Boom = require('boom');
const Joi = require('joi');

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../search_index'));

// Required until fix https://github.com/tlivings/enjoi/pull/10 lands
// Then this validation can be safely removed as it will be present based on swagger.json
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

      const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

      index.query(req.payload)
        .then(reply, err => {
          if (err.indexFound === false) {
            return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
          }

          reply.error(err);
        });
    });
  }
};
