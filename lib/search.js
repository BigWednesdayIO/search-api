'use strict';

const _ = require('lodash');
const elasticsearchClient = require('./elasticsearchClient');
const queryBuilder = require('./query_builder');

const mapResults = function (results) {
  return _.pluck(results.hits.hits, '_source');
};

class Search {
  query(indexName, body) {
    return elasticsearchClient.search({
      index: indexName,
      body: queryBuilder.build(body)
    })
    .then(mapResults);
  }
}

module.exports = Search;
