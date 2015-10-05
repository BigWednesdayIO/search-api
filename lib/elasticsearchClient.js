'use strict';

const elasticsearch = require('elasticsearch');
const elasticHost = process.env.ELASTICSEARCH_PORT_9200_TCP_ADDR || '87a4e5f9c57a4bb50454348998c03dff.eu-west-1.aws.found.io';

module.exports = new elasticsearch.Client({
  host: `http://${elasticHost}:9200/`
});
