'use strict';

const SearchIndexFactory = require('../../../search_index_factory');
const searchIndexFactory = new SearchIndexFactory(require('../../../search_index'));

module.exports = {
  post(req, reply) {
    const sourceIndex = searchIndexFactory.build(req.params.name, req.auth.credentials);
    const destinationIndex = searchIndexFactory.build(req.payload.destination, req.auth.credentials);

    sourceIndex.move(destinationIndex)
      .then(reply, reply.error.bind(reply));
  }
};
