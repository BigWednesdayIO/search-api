'use strict';

const _ = require('lodash');

const elasticsearchClient = require('./elasticsearchClient');
const indexErrors = require('./index_errors');
const ObjectNotFoundError = indexErrors.ObjectNotFoundError;
const IndexNotFoundError = indexErrors.IndexNotFoundError;

const objectTypeInIndex = 'object';

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

  batchOperation(operations) {
    const bulkArgs = {body: []};

    const creates = _.filter(operations, {action: 'create'});

    if (creates.length) {
      const createHeader = {index: {_index: this._indexName, _type: objectTypeInIndex}};

      creates.forEach(create => {
        bulkArgs.body.push(createHeader, create.body);
      });
    }

    const upserts = _.filter(operations, {action: 'upsert'});

    upserts.forEach(upsert => {
      bulkArgs.body.push({index: {_index: this._indexName, _type: objectTypeInIndex, _id: upsert.objectID}}, upsert.body);
    });

    const deletes = _.filter(operations, {action: 'delete'});

    deletes.forEach(del => {
      bulkArgs.body.push({'delete': {_index: this._indexName, _type: objectTypeInIndex, _id: del.objectID}});
    });

    return elasticsearchClient.bulk(bulkArgs)
      .then(res => {
        return {
          inserted: _.map(res.items.slice(0, creates.length), 'create._id'),
          upserted: _.map(res.items.slice(creates.length, upserts.length), 'index._id'),
          deleted: _.map(res.items.slice(upserts.length, deletes.length), 'delete._id')
        };
      });
  }
}

module.exports = Index;
