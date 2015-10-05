'use strict';

const elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
  host: process.env.ELASTICSEARCH_HOST || 'http://elasticsearch:9200/'
});
