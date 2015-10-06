'use strict';

const boom = require('boom');

const SearchIndexFactory = require('../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../index'));

module.exports = {
  post(req, reply) {
    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.insertObject(req.payload)
      .then(o => {
        reply(o).created(`${req.path}/${o.objectID}`);
      }, reply.error.bind(reply));
  },

  delete(req, reply) {
    const index = searchIndexFactory.build(req.params.name, req.auth.credentials);

    index.drop().then(() => {
      reply().code(204);
    }, err => {
      if (err.indexFound === false) {
        return reply(boom.notFound(`Index ${req.params.name} does not exist`));
      }

      reply.error(err);
    });
  }
};
