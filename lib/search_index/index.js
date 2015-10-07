'use strict';

const _ = require('lodash');

const elasticsearchClient = require('../elasticsearchClient');
const indexErrors = require('./index_errors');
const queryBuilder = require('./query_builder');

const ObjectNotFoundError = indexErrors.ObjectNotFoundError;
const IndexNotFoundError = indexErrors.IndexNotFoundError;

const objectTypeInIndex = 'object';

const mapResults = function (results) {
  return {hits: _.pluck(results.hits.hits, '_source')};
};

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

const uniquifyIndexName = name => {
  const date = new Date();
  const dateString = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.${date.getMilliseconds()}`;
  return `${name}_${dateString}`;
};

class SearchIndex {
  constructor(name) {
    this._indexName = name;
  }

  insertObject(o) {
    return elasticsearchClient.indices.getAlias({name: this._indexName, ignore: 404})
      .then(aliases => {
        if (Object.keys(aliases).length === 0) {
          const uniqueName = uniquifyIndexName(this._indexName);

          return elasticsearchClient.indices.create({index: uniqueName})
            .then(() => {
              return elasticsearchClient.indices.putAlias({index: uniqueName, name: this._indexName});
            });
        }
      })
      .then(() => {
        return elasticsearchClient.index({index: this._indexName, type: objectTypeInIndex, body: o});
      })
      .then(created => {
        const result = _.cloneDeep(o);
        result.objectID = created._id;

        return result;
      });
  }

  upsertObject(objectID, o) {
    return elasticsearchClient.indices.getAlias({name: this._indexName, ignore: 404})
      .then(aliases => {
        if (Object.keys(aliases).length === 0) {
          const uniqueName = uniquifyIndexName(this._indexName);

          return elasticsearchClient.indices.create({index: uniqueName})
            .then(() => {
              return elasticsearchClient.indices.putAlias({index: uniqueName, name: this._indexName});
            });
        }
      })
      .then(() => {
        return elasticsearchClient.index({index: this._indexName, type: objectTypeInIndex, id: objectID, body: o});
      })
      .then(upserted => {
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

  query(body) {
    return elasticsearchClient.search({
      index: this._indexName,
      expandWildcards: 'none',
      allowNoIndices: false,
      body: queryBuilder.build(body)
    })
    .then(mapResults, err => {
      if (err.status === 404) {
        throw new IndexNotFoundError('Index not found');
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

  move(destinationIndex) {
    return elasticsearchClient.indices.getAlias({name: destinationIndex._indexName})
      .then(aliasResponse => {
        return Object.keys(aliasResponse);
      }, err => {
        if (err.status === 404) {
          // alias does not exist, continue to set alias on destination
          return [];
        }

        throw err;
      })
      .then(existingIndexes => {
        const updateAliasesActions = existingIndexes.map(indexName => {
          return {remove: {index: indexName, alias: destinationIndex._indexName}};
        });

        updateAliasesActions.push({add: {index: this._indexName, alias: destinationIndex._indexName}});

        return elasticsearchClient.indices.updateAliases({body: {actions: updateAliasesActions}});
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

    return elasticsearchClient.indices.getAlias({name: this._indexName, ignore: 404})
      .then(aliases => {
        if (Object.keys(aliases).length === 0) {
          const uniqueName = uniquifyIndexName(this._indexName);

          return elasticsearchClient.indices.create({index: uniqueName})
            .then(() => {
              return elasticsearchClient.indices.putAlias({index: uniqueName, name: this._indexName});
            });
        }
      })
      .then(() => {
        return elasticsearchClient.bulk(bulkArgs);
      })
      .then(res => {
        return {
          inserted: _.map(res.items.slice(0, creates.length), 'create._id'),
          upserted: _.map(res.items.slice(creates.length, upserts.length), 'index._id'),
          deleted: _.map(res.items.slice(upserts.length, deletes.length), 'delete._id')
        };
      });
  }
}

module.exports = SearchIndex;
