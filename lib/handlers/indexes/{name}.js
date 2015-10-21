'use strict';

const Boom = require('boom');

const SearchIndexFactory = require('../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../search_index'));
const indexObjectVerifier = require('../../index_object_verifier');

module.exports = {
  post(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
    }

    if (indexObjectVerifier.exceedsSizeLimit(req.payload)) {
      return reply(Boom.entityTooLarge('Object exceeds 10k size limit'));
    }

    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.insertObject(req.payload)
      .then(o => {
        reply(o).created(`${req.path}/${o.objectID}`);
      }, reply.error.bind(reply));
  },

  delete(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
    }

    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.drop().then(() => {
      reply().code(204);
    }, err => {
      if (err.indexFound === false) {
        return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
      }

      reply.error(err);
    });
  }
};
