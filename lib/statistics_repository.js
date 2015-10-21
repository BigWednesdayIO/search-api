'use strict';

const _ = require('lodash');

const elasticsearchClient = require('./elasticsearchClient');

module.exports.get = clientId => {
  return elasticsearchClient.indices.stats({index: `${clientId}_*`, metric: 'docs'})
    .then(stats => {
      const docsStats = _.get(stats, '_all.primaries.docs', {count: 0, deleted: 0});

      return {
        totalRecords: docsStats.count - docsStats.deleted
      };
    });
};
