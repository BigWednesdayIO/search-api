'use strict';

const elasticSearchClient = require('./elasticsearchClient');
const SearchOperationEvent = require('./search_operation_event');

const generateIndexName = function () {
  const today = new Date();
  return `search-ops${process.env.OPS_INDEX_SUFFIX || ''}-${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
};

exports.register = function (server, options, next) {
  server.on('response', request => {
    const searchOpEvent = new SearchOperationEvent(request);

    // Only log successful queries as invalid payloads could contain anything.
    if (searchOpEvent.statusCode !== 200) {
      return;
    }

    elasticSearchClient.index({
      index: generateIndexName(),
      id: request.id,
      type: 'SearchOperationEvent',
      body: new SearchOperationEvent(request)
    })
    .catch(err => {
      // Log error but don't kill entire process.
      console.error(err);
    });
  });

  return next();
};

exports.register.attributes = {
  name: 'analytics_logger'
};

exports.generateIndexName = generateIndexName;
