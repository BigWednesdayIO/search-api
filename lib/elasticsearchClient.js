'use strict';

const elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
  host: 'https://87a4e5f9c57a4bb50454348998c03dff.eu-west-1.aws.found.io:9243/'
});
