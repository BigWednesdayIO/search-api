'use strict';

const Boom = require('boom');

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../search_index'));

module.exports = {
  put(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
    }

    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.saveSettings(req.payload)
      .then(reply, reply.error.bind(reply));
  },

  get(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
    }

    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.getSettings()
      .then(reply, err => {
        if (err.indexFound === false) {
          return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
        }

        reply.error(err);
      });
  }
};
