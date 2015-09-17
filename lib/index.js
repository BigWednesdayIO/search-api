'use strict';

const _ = require('lodash');

const elasticsearchClient = require('./elasticsearchClient');

const objectTypeInIndex = 'object';

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

  insertObject(o) {
    return elasticsearchClient.index({
      index: this._indexName,
      type: objectTypeInIndex,
      body: o
    }).then(created => {
      const result = _.cloneDeep(o);
      result.objectID = created._id;

      return result;
    });
  }

  upsertObject(objectID, o) {
    return elasticsearchClient.index({
      index: this._indexName,
      type: objectTypeInIndex,
      id: objectID,
      body: o
    }).then(upserted => {
      const result = {
        upserted: _.cloneDeep(o),
        version: upserted._version
      };

      result.upserted.objectID = objectID;

      return result;
    });
  }

  getObject(objectID) {
    return elasticsearchClient.get({
      index: this._indexName,
      type: objectTypeInIndex,
      id: objectID
    }).then(found => {
      const result = found._source;
      result.objectID = found._id;

      return result;
    }, err => {
      throw mapError(err);
    });
  }

  deleteObject(objectID) {
    const deleteParams = {
      index: this._indexName,
      type: objectTypeInIndex,
      id: objectID
    };

    // check index exists before issuing delete command, otherwise it will create an empty index
    return elasticsearchClient.indices.get({index: this._indexName})
      .then(() => {
        return elasticsearchClient.delete(deleteParams);
      }, err => {
        if (err.status === 404) {
          throw new IndexNotFoundError();
        }

        throw err;
      });
  }

  drop() {
    return elasticsearchClient.indices.delete({index: this._indexName})
      .then(() => {
        return;
      }, err => {
        if (err.status === 404) {
          throw new IndexNotFoundError();
        }

        throw err;
      });
  }
}

module.exports = Index;
