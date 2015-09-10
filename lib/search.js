'use strict';

const _ = require('lodash');
const elasticsearch = require('elasticsearch');

const elasticsearchClient = new elasticsearch.Client({
  host: 'https://8cb61d59cb8ad994a65a3233948325a0.eu-bbwest-1.aws.found.io:9243/'
});

const mapResults = function (results) {
  return _.pluck(results, '_source');
};

class Search {
  query(indexName, query) {
    let searchArgs = {
      index: indexName,
      body: {
        query: {
          match: {_all: query.keywords}
        }
      }
    };

    return elasticsearchClient.search(searchArgs)
      .then(mapResults);
  }
}

module.exports = Search;
