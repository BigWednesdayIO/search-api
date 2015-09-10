'use strict';

const elasticsearch = require('elasticsearch');

const elasticsearchClient = new elasticsearch.Client({
  host: 'https://8cb61d59cb8ad994a65a3233948325a0.eu-west-1.aws.found.io:9243/'
});

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

    return elasticsearchClient.search(searchArgs);
  }
}

module.exports = Search;
