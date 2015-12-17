'use strict';

const Boom = require('boom');

const SearchIndexFactory = require('../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../search_index'));

module.exports = {
  post(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
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
  },

  get(req, reply) {
    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.getManyObjects(req.query.id)
      .then(reply, err => {
        if (err.indexFound === false) {
          return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
        }

        reply.error(err);
      });
  }
};
