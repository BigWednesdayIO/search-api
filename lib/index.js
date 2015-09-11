'use strict';

const elasticsearchClient = require('./elasticsearchClient')();

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
