'use strict';

const Boom = require('boom');

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../search_index'));

module.exports = {
  get(req, reply) {
    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.getObject(req.params.objectID)
      .then(reply, err => {
        if (err.indexFound === false) {
          return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
        }

        if (err.objectFound === false) {
          return reply(Boom.notFound(`Index does not contain object with identifier ${req.params.objectID}`));
        }

        reply.error(err);
      });
  },

  put(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
    }

    const size = Buffer.byteLength(JSON.stringify(req.payload));

    if (size > 10000) {
      return reply(Boom.entityTooLarge('Object exceeds 10k size limit'));
    }

    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.upsertObject(req.params.objectID, req.payload)
      .then(result => {
        const response = reply(result.upserted);

        if (result.version === 1) {
          response.created(req.path);
        }
      });
  },

  delete(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
    }

    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.deleteObject(req.params.objectID)
      .then(() => {
        reply().code(204);
      }, err => {
        if (err.indexFound === false) {
          return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
        }

        reply.error(err);
      });
  }
};
