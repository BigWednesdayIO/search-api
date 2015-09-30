'use strict';

const elasticsearchClient = require('../lib/elasticsearchClient');
const cuid = require('cuid');

const today = new Date();

let searchOpsIndexName;

before(() => {
  process.env.OPS_INDEX_SUFFIX = cuid();
  searchOpsIndexName = `search-ops${process.env.OPS_INDEX_SUFFIX}-${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

  return elasticsearchClient.indices.create({index: searchOpsIndexName, refresh: true});
});

after(() => {
  return elasticsearchClient.indices.delete({index: searchOpsIndexName});
});
