'use strict';

const Boom = require('boom');

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../search_index'));

module.exports = {
  post(req, reply) {
    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    return index.query(req.payload)
      .then(reply, err => {
        if (err.indexFound === false) {
          return reply(Boom.notFound(`Index ${req.params.name} does not exist`));
        }

        reply.error(err);
      });
  }
};
