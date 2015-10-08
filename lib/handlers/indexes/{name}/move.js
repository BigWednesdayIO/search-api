'use strict';

const Boom = require('boom');

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../search_index'));

module.exports = {
  post(req, reply) {
    if (req.auth.credentials.scope.indexOf('indexing') < 0) {
      return reply.indexingForbidden();
    }

    const sourceIndex = searchIndexFactory.build(req.params.name, req.auth.credentials);
    const destinationIndex = searchIndexFactory.build(req.payload.destination, req.auth.credentials);

    sourceIndex.move(destinationIndex)
      .then(reply, err => {
        if (err.indexFound === false) {
          return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
        }

        reply.error(err);
      });
  }
};
