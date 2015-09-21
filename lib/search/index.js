'use strict';

const _ = require('lodash');
const elasticsearchClient = require('../elasticsearchClient');
const queryBuilder = require('./query_builder');
const IndexNotFoundError = require('../index_errors').IndexNotFoundError;

const mapResults = function (results) {
  return {hits: _.pluck(results.hits.hits, '_source')};
};

class Search {
  query(indexName, body) {
    return elasticsearchClient.search({
      index: indexName,
      body: queryBuilder.build(body)
    })
    .then(mapResults, err => {
      if (err.status === 404) {
        throw new IndexNotFoundError('Index not found');
      }
      throw err;
    });
  }
}

module.exports = Search;
