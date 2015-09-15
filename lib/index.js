'use strict';

const _ = require('lodash');

const elasticsearchClient = require('./elasticsearchClient');

class Index {
  constructor(name) {
    this._indexName = name;
  }

  insert(o) {
    return elasticsearchClient.index({
      index: this._indexName,
      type: 'object',
      body: o
    }).then(created => {
      const result = _.cloneDeep(o);
      result.objectID = created._id;

      return result;
    });
  }
}

module.exports = Index;
