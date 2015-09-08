'use strict';

const elasticsearch = require('elasticsearch');

const elasticsearchClient = new elasticsearch.Client({
  host: 'https://8cb61d59cb8ad994a65a3233948325a0.eu-west-1.aws.found.io:9243/'
});

class Index {
  constructor(name) {
    this._indexName = name;
  }

  insert(o) {
    return elasticsearchClient.index({
      index: this._indexName,
      type: 'object',
      body: o
    });
  }
}

module.exports = Index;
