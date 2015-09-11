'use strict';

const _ = require('lodash');
const elasticsearchClient = require('./elasticsearchClient');

const mapResults = function (results) {
  return _.pluck(results.hits.hits, '_source');
};

class Search {
  query(indexName, body) {
    const searchArgs = {
      index: indexName,
      body: {
        query: {
          match: {_all: body.query}
        }
      }
    };

    return elasticsearchClient.search(searchArgs)
      .then(mapResults);
  }
}

module.exports = Search;
