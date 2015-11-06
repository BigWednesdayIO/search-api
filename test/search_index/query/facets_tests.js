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
          string_facet: {
            buckets: [{key: 'two', doc_count: 3}, {key: 'one', doc_count: 5}]
          },
          value_desc: {
            buckets: [{key: 'bar', doc_count: 1}, {key: 'Foo', doc_count: 8}, {key: 'baz', doc_count: 1}]
          },
          num_facet: {
            buckets: [{key: 1, doc_count: 1}, {key: 2, doc_count: 9}]
          },
          value_asc: {
            buckets: [{key: 'Foo', doc_count: 2}, {key: 'baz', doc_count: 1}, {key: 'bar', doc_count: 1}]
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
                      {field: 'string_facet', order: 'count'},
                      {field: 'num_facet', order: 'countDESC'},
                      {field: 'value_asc', order: 'value'},
                      {field: 'value_desc', order: 'valueDESC'}
                    ]
                  }
                },
                properties: {
                  string_facet: {
                    type: 'string'
                  },
                  num_facet: {
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
          field: 'string_facet.raw',
          size: 0
        }
      };

      sinon.assert.calledWith(searchStub, sinon.match(value => {
        return _.eq(value.body.aggregations.string_facet, expectedAggregation);
      }, 'string aggregation'));
    });

    it('retrieves non-string facets from default field', () => {
      const expectedAggregation = {
        terms: {
          field: 'num_facet',
          size: 0
        }
      };

      sinon.assert.calledWith(searchStub, sinon.match(value => {
        return _.eq(value.body.aggregations.num_facet, expectedAggregation);
      }, 'non-string aggregation'));
    });

    it('returns count sorted aggregations as facets', () => {
      const facet1 = _.find(returnedFacets, {field: 'string_facet'});
      expect(facet1).to.deep.eql({field: 'string_facet', values: [{value: 'two', count: 3}, {value: 'one', count: 5}]});
    });

    it('returns count DESC sorted aggregations as facets', () => {
      const facet1 = _.find(returnedFacets, {field: 'num_facet'});
      expect(facet1).to.deep.eql({field: 'num_facet', values: [{value: 2, count: 9}, {value: 1, count: 1}]});
    });

    it('returns value sorted aggregations as facets', () => {
      const facet1 = _.find(returnedFacets, {field: 'value_asc'});
      expect(facet1).to.deep.eql({field: 'value_asc', values: [{value: 'bar', count: 1}, {value: 'baz', count: 1}, {value: 'Foo', count: 2}]});
    });

    it('returns value DESC sorted aggregations as facets', () => {
      const facet1 = _.find(returnedFacets, {field: 'value_desc'});
      expect(facet1).to.deep.eql({field: 'value_desc', values: [{value: 'Foo', count: 8}, {value: 'baz', count: 1}, {value: 'bar', count: 1}]});
    });

    it('returns facets in their configured order', () => {
      expect(_.map(returnedFacets, 'field')).to.deep.equal(['string_facet', 'num_facet', 'value_asc', 'value_desc']);
    });
  });
});
