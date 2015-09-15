'use strict';

const _ = require('lodash');

const elasticsearchClient = require('./elasticsearchClient');

class ObjectNotFoundError extends Error {
  constructor() {
    super(arguments);

    this.indexFound = true;
    this.objectFound = false;
  }
}

class IndexNotFoundError extends ObjectNotFoundError {
  constructor() {
    super(arguments);

    this.indexFound = false;
  }
}

const mapError = err => {
  if (!err.body) {
    return err;
  }

  const index = err.body._index;

  if (index && err.body.found === false) {
    return new ObjectNotFoundError('Object not found in index');
  }

  if (!index && err.status === 404) {
    return new IndexNotFoundError('Index not found');
  }

  return err;
};

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

  getObject(objectID) {
    return elasticsearchClient.get({
      index: this._indexName,
      type: 'object',
      id: objectID
    }).then(found => {
      const result = found._source;
      result.objectID = found._id;

      return result;
    }, err => {
      throw mapError(err);
    });
  }
}

module.exports = Index;
