'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const expect = require('chai').expect;

const elasticsearchClient = require('../../../lib/elasticsearchClient');
const SearchIndex = require('../../../lib/search_index');

describe('Search Index', () => {
  describe('query - facets', () => {
    let searchStub;
    let getMappingStub;
    let returnedFacets;

    before(() => {
      const stubSearchResults = {
        hits: {hits: []},
        aggregations: {
          facet2: {
            buckets: [{key: 'a', doc_count: 9}, {key: 'b', doc_count: 1}]
          },
          facet1: {
            buckets: [{key: 'one', doc_count: 5}, {key: 'two', doc_count: 3}]
          },
          num: {
            buckets: [{key: 1, doc_count: 1}]
          }
        }
      };

      searchStub = sinon.stub(elasticsearchClient, 'search', () => Promise.resolve(stubSearchResults));

      getMappingStub = sinon.stub(elasticsearchClient.indices, 'getMapping', () => {
        const mapping = {
          testIndex: {
            mappings: {
              object: {
                _meta: {
                  indexSettings: {
                    searchable_fields: ['a'],
                    facets: [
                      {field: 'facet1', order: 'count'},
                      {field: 'facet2', order: 'count'},
                      {field: 'num', order: 'count'},
                      {field: 'count_desc', order: 'countDESC'},
                      {field: 'value_asc', order: 'value'},
                      {field: 'value_desc', order: 'valueDESC'}
                    ]
                  }
                },
                properties: {
                  facet1: {
                    type: 'string'
                  },
                  facet2: {
                    type: 'string'
                  },
                  num: {
                    type: 'double'
                  },
                  count_desc: {
                    type: 'double'
                  },
                  value_asc: {
                    type: 'double'
                  },
                  value_desc: {
                    type: 'double'
                  }
                }
              }
            }
          }
        };

        return Promise.resolve(mapping);
      });

      return new SearchIndex('index').query({query: 'abc'})
        .then(results => {
          returnedFacets = results.facets;
        });
    });

    after(() => {
      searchStub.restore();
      getMappingStub.restore();
    });

    it('retrieves string facets from raw multi-field', () => {
      const expectedAggregation = {
        terms: {
          field: 'facet1.raw',
          size: 0,
          order: {_count: 'asc'}
        }
      };

      sinon.assert.calledWith(searchStub, sinon.match(value => {
        return _.eq(value.body.aggregations.facet1, expectedAggregation);
      }, 'string aggregation'));
    });

    it('retrieves non-string facets from default field', () => {
      const expectedAggregation = {
        terms: {
          field: 'num',
          size: 0,
          order: {_count: 'asc'}
        }
      };

      sinon.assert.calledWith(searchStub, sinon.match(value => {
        return _.eq(value.body.aggregations.num, expectedAggregation);
      }, 'non-string aggregation'));
    });

    it('retrieves facets in count DESC order', () => {
      const expectedAggregation = {
        terms: {
          field: 'count_desc',
          size: 0,
          order: {_count: 'desc'}
        }
      };

      sinon.assert.calledWith(searchStub, sinon.match(value => {
        return _.eq(value.body.aggregations.count_desc, expectedAggregation);
      }, 'count DESC order aggregation'));
    });

    it('retrieves facets in value order', () => {
      const expectedAggregation = {
        terms: {
          field: 'value_asc',
          size: 0,
          order: {_term: 'asc'}
        }
      };

      sinon.assert.calledWith(searchStub, sinon.match(value => {
        return _.eq(value.body.aggregations.value_asc, expectedAggregation);
      }, 'value order aggregation'));
    });

    it('retrieves facets in value DESC order', () => {
      const expectedAggregation = {
        terms: {
          field: 'value_desc',
          size: 0,
          order: {_term: 'desc'}
        }
      };

      sinon.assert.calledWith(searchStub, sinon.match(value => {
        return _.eq(value.body.aggregations.value_desc, expectedAggregation);
      }, 'value DESC order aggregation'));
    });

    it('return aggregations as facets', () => {
      const facet1 = _.find(returnedFacets, {field: 'facet1'});
      expect(facet1).to.deep.eql({field: 'facet1', values: [{value: 'one', count: 5}, {value: 'two', count: 3}]});

      const facet2 = _.find(returnedFacets, {field: 'facet2'});
      expect(facet2).to.deep.eql({field: 'facet2', values: [{value: 'a', count: 9}, {value: 'b', count: 1}]});

      const num = _.find(returnedFacets, {field: 'num'});
      expect(num).to.deep.eql({field: 'num', values: [{value: 1, count: 1}]});
    });

    it('returns facets in their configured order', () => {
      expect(_.map(returnedFacets, 'field')).to.deep.equal(['facet1', 'facet2', 'num']);
    });
  });
});
