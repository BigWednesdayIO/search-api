'use strict';

const _ = require('lodash');

const elasticsearchClient = require('../elasticsearchClient');
const indexErrors = require('./index_errors');
const queryBuilder = require('./query_builder');

const ObjectNotFoundError = indexErrors.ObjectNotFoundError;
const IndexNotFoundError = indexErrors.IndexNotFoundError;

const objectTypeInIndex = 'object';

const defaultIndexSettings = {
  settings: {
    analysis: {
      filter: {
        instant_search_filter: {
          type: 'edgeNGram',
          min_gram: 1,
          max_gram: 20
        }
      },
      analyzer: {
        instant_search: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'instant_search_filter']
        }
      }
    }
  },
  mappings: {
    [objectTypeInIndex]: {
      _all: {enabled: false},
      dynamic_templates: [
        {
          string_fields: {
            match: '*',
            match_mapping_type: 'string',
            mapping: {
              fields: {
                '{name}': {
                  type: 'string',
                  search_analyzer: 'standard',
                  analyzer: 'instant_search'
                },
                'raw': {
                  type: 'string',
                  index: 'not_analyzed'
                }
              }
            }
          }
        }
      ]
    }
  }
};

const mapResults = function (results, settings) {
  return {
    hits: _.pluck(results.hits.hits, '_source'),
    facets: _(results.aggregations)
      .map((aggregation, key) => {
        return {
          key,
          values: aggregation.buckets.map(b => {
            return {value: b.key, count: b.doc_count};
          })
        };
      })
      .sortBy(facet => settings.facet_fields.indexOf(facet.key))
      .value()
  };
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

const uniquifyIndexName = indexName => {
  const date = new Date();
  const dateString = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.${date.getMilliseconds()}`;
  return `${indexName}_${dateString}`;
};

const createIndexIfNotExists = indexName => {
  return elasticsearchClient.indices.getAlias({name: indexName})
    .then(() => {
      return true;
    }, err => {
      if (err.status === 404) {
        // create the index with a unique name and assign the requested name as an alias
        // this allows us to support live moving/renaming by just modifying aliases
        const uniqueName = uniquifyIndexName(indexName);

        return elasticsearchClient.indices.create({index: uniqueName, body: defaultIndexSettings})
          .then(() => {
            return elasticsearchClient.indices.putAlias({index: uniqueName, name: indexName});
          })
          .then(() => {
            return false;
          });
      }

      console.error('Failed to check if index exists by getAlias.');
      throw err;
    });
};

const extractObjectMapping = mapping => {
  const mappingKeys = Object.keys(mapping);

  if (mappingKeys.length === 0) {
    return null;
  }

  const mappingIndexName = mappingKeys[0];
  return mapping[mappingIndexName].mappings[objectTypeInIndex];
};

const extractSettingsFromMapping = mapping => {
  const mappingKeys = Object.keys(mapping);

  if (mappingKeys.length === 0) {
    return null;
  }

  const objectMapping = extractObjectMapping(mapping);

  if (!objectMapping) {
    return null;
  }

  return objectMapping._meta ? objectMapping._meta.indexSettings : null;
};

const buildDefaultSettings = mapping => {
  const objectMapping = extractObjectMapping(mapping);
  return objectMapping ? {searchable_fields: Object.keys(objectMapping.properties)} : null;
};

class SearchIndex {
  constructor(name) {
    this._indexName = name;
  }

  get name() {
    return this._indexName;
  }

  insertObject(o) {
    return createIndexIfNotExists(this._indexName)
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
    return createIndexIfNotExists(this._indexName)
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
    return elasticsearchClient.indices.getMapping({index: this._indexName, type: objectTypeInIndex})
      .then(mapping => {
        return extractSettingsFromMapping(mapping) || buildDefaultSettings(mapping);
      })
      .then(settings => {
        if (!settings) {
          // cannot provide our desired search behaviour without settings
          return {hits: []};
        }

        return elasticsearchClient.search({
          index: this._indexName,
          expandWildcards: 'none',
          allowNoIndices: false,
          body: queryBuilder.build(body, settings)
        })
        .then(results => mapResults(results, settings));
      })
      .catch(err => {
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
    return elasticsearchClient.indices.getAlias({name: [destinationIndex.name, this._indexName]})
      .then(indexes => {
        indexes = _.map(indexes, (index, key) => {
          return {name: key, alias: Object.keys(index.aliases)[0]};
        });

        const source = _.find(indexes, {alias: this._indexName});

        if (!source) {
          throw new IndexNotFoundError('Index not found');
        }

        return {
          source,
          destination: _.find(indexes, {alias: destinationIndex.name}) || {alias: destinationIndex.name}
        };
      }, err => {
        if (err.status === 404) {
          throw new IndexNotFoundError('Index not found');
        }

        throw err;
      })
      .then(indexes => {
        const updateAliases = {body: {actions: []}};

        if (indexes.destination.name) {
          updateAliases.body.actions.push({remove: {index: indexes.destination.name, alias: indexes.destination.alias}});
        }

        updateAliases.body.actions.push(
          {add: {index: indexes.source.name, alias: indexes.destination.alias}},
          {remove: {index: indexes.source.name, alias: indexes.source.alias}}
        );

        return elasticsearchClient.indices.updateAliases(updateAliases)
          .then(() => {
            return indexes;
          });
      })
      .then(indexes => {
        if (indexes.destination.name) {
          return elasticsearchClient.indices.delete({index: indexes.destination.name});
        }
      });
  }

  batchOperation(operations) {
    const creates = _.filter(operations, {action: 'create'});
    const upserts = _.filter(operations, {action: 'upsert'});
    const deletes = _.filter(operations, {action: 'delete'});

    return createIndexIfNotExists(this._indexName)
      .then(indexExists => {
        const bulkArgs = {body: []};

        if (creates.length) {
          const createHeader = {index: {_index: this._indexName, _type: objectTypeInIndex}};

          creates.forEach(create => {
            bulkArgs.body.push(createHeader, create.body);
          });
        }

        upserts.forEach(upsert => {
          bulkArgs.body.push({index: {_index: this._indexName, _type: objectTypeInIndex, _id: upsert.objectID}}, upsert.body);
        });

        if (indexExists) {
          deletes.forEach(del => {
            bulkArgs.body.push({'delete': {_index: this._indexName, _type: objectTypeInIndex, _id: del.objectID}});
          });
        }

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

  saveSettings(settings) {
    return createIndexIfNotExists(this._indexName)
      .then(() => {
        const mapping = {
          [objectTypeInIndex]: {
            _meta: {indexSettings: settings}
          }
        };

        return elasticsearchClient.indices.putMapping({body: mapping, index: this._indexName, type: objectTypeInIndex});
      })
      .then(() => {
        return settings;
      });
  }

  getSettings() {
    return elasticsearchClient.indices.getMapping({index: this._indexName, type: objectTypeInIndex})
      .then(extractSettingsFromMapping, err => {
        if (err.status === 404) {
          return Promise.reject(new IndexNotFoundError('Index not found'));
        }

        console.error('Error getting mapping for settings');
        throw err;
      });
  }
}

module.exports = SearchIndex;
