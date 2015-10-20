'use strict';

const Boom = require('boom');
const Joi = require('joi');

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../search_index'));
const decodeUri = require('../../../uri_decoder');

const executeSearch = function (req, reply, searchParams) {
  const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

  return index.query(searchParams)
    .then(reply, err => {
      if (err.indexFound === false) {
        return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
      }

      reply.error(err);
    });
};

module.exports = {
  post(req, reply) {
    if (req.payload.params) {
      if (Object.keys(req.payload).length > 1) {
        return reply(Boom.badRequest('"params" cannot be combined with other keys'));
      }

      const searchParams = decodeUri(req.payload.params);

      Joi.validate(searchParams, req.route.settings.validate.payload, err => {
        if (err) {
          return reply(Boom.badRequest(err.message));
        }

        executeSearch(req, reply, searchParams);
      });
    } else {
      executeSearch(req, reply, req.payload);
    }
  }
};
