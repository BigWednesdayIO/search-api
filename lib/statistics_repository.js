'use strict';

const elasticsearchClient = require('./elasticsearchClient');

class StatisticsRepository {
  get(clientId) {
    return elasticsearchClient.indices.stats({index: `${clientId}_*`, metric: 'docs'})
      .then(stats => {
        const docsStats = stats._all.primaries.docs;

        return {
          totalRecords: docsStats.count - docsStats.deleted
        };
      });
  }
}

module.exports = StatisticsRepository;
