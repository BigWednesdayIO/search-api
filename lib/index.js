'use strict';

var elasticsearch = require('elasticsearch');
var elasticsearchClient = new elasticsearch.Client();

module.exports = {
  insert: function (o) {
    return elasticsearchClient.index({
      index: 'myindex',
      type: 'object',
      body: o
    });
  }
};
