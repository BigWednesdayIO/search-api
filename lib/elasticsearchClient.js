'use strict';

const elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
  host: 'https://8cb61d59cb8ad994a65a3233948325a0.eu-west-1.aws.found.io:9243/'
});
