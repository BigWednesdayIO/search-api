'use strict';

const Search = require('../../../search');
const search = new Search();

module.exports = {
  post: function (req, reply) {
    search.query(req.params.name, req.payload)
      .then(reply, err => {
        console.error(err);
        reply(err);
      });
  }
};
