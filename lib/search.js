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
        query: {filtered: {}}
      }
    };

    if (body.query) {
      searchArgs.body.query.filtered.query = {match: {_all: body.query}};
    }

    if (body.filters && body.filters.length) {
      searchArgs.body.query.filtered = {filter: {and: undefined}};
      searchArgs.body.query.filtered.filter.and = body.filters.map(f => {
        // Can't currenlty be a 1 liner due to https://github.com/nodejs/node/issues/2507
        const term = {[f.field]: f.term};
        return {term: term};
      });
    }

    return elasticsearchClient.search(searchArgs)
      .then(mapResults);
  }
}

module.exports = Search;
