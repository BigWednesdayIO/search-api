'use strict';

var elasticsearch = require('elasticsearch');

var elasticsearchClient = new elasticsearch.Client({
  host: 'https://8cb61d59cb8ad994a65a3233948325a0.eu-west-1.aws.found.io:9243/'
});

var Index = function (name) {
  this._indexName = name;
};

Index.prototype.insert = function (o) {
  var self = this;

  return elasticsearchClient.index({
    index: self._indexName,
    type: 'object',
    body: o
  });
};

module.exports = Index;
