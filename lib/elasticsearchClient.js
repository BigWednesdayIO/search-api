'use strict';

const elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
  host: 'https://0ca1fafc6967eec1688b3d3e5dfe685e.eu-west-1.aws.found.io:9243/'
});
