'use strict';

var elasticsearch = require('elasticsearch');

var elasticsearchClient = new elasticsearch.Client({
  host: 'https://8cb61d59cb8ad994a65a3233948325a0.eu-west-1.aws.found.io:9243/'
});

module.exports = {
  insert: function (o) {
    return elasticsearchClient.index({
      index: 'myindex',
      type: 'object',
      body: o
    });
  }
};
