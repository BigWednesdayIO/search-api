'use strict';

class SearchIndexFactory {
  constructor(T) {
    this.T = T;
  }

  build(name, clientCredentials) {
    const indexName = [clientCredentials.clientId, name].join('_');
    return new this.T(indexName);
  }
}

module.exports = SearchIndexFactory;
