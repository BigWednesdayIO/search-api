'use strict';

const _ = require('lodash');

const getUntokenizedField = function (field, mapping) {
  return mapping.properties[field].type === 'string' ? `${field}.raw` : field;
};

const buildTermFilter = function (filterParams, mapping) {
  const term = {[getUntokenizedField(filterParams.field, mapping)]: filterParams.term};
  return {term};
};

const buildRangeFilter = function (filterParams) {
  const range = {[filterParams.field]: {}};
  if (filterParams.range.from) {
    range[filterParams.field].gte = filterParams.range.from;
  }
  if (filterParams.range.to) {
    range[filterParams.field].lte = filterParams.range.to;
  }

  return {range};
};

const buildFilter = function (filterParams, mapping) {
  if (filterParams.term) {
    return buildTermFilter(filterParams, mapping);
  }

  if (filterParams.range) {
    return buildRangeFilter(filterParams);
  }
};

const buildSort = function (field, direction) {
  if (direction) {
    return {[field]: {order: direction}};
  }

  return field;
};

const buildFacetAggregation = function (field) {
  return {terms: {field, size: 0, order: {_count: 'asc'}}};
};

const getFuzzyDistance = function (keyword) {
  // TODO - make fuzziness amount configurable
  const length = keyword.length;

  if (length < 4) {
    return 0;
  }

  return length < 8 ? 1 : 2;
};

const fuzzyMatch = function (query) {
  return query.split(' ')
    .map(word => {
      const distance = getFuzzyDistance(word);

      return distance === 0 ? word : `${word}~${distance}`;
    })
    .join(' ');
};

const buildQuery = function (searchParams, context) {
  const settings = _.get(context, 'settings', {});
  const mapping = context.mapping;

  const query = {
    query: {bool: {}},
    size: searchParams.hitsPerPage || 10
  };

  if (searchParams.query) {
    const queryString = {query: fuzzyMatch(searchParams.query), default_operator: 'and', lenient: true};

    if (settings.searchable_fields) {
      queryString.fields = settings.searchable_fields
        .slice()
        .reverse()
        .map((field, index) => {
          if (index === 0) {
            return field;
          }

          let boost = 1;
          boost += index / 10;
          return `${field}^${boost}`;
        });
    }

    query.query.bool.must = {simple_query_string: queryString};
  }

  if (searchParams.filters && searchParams.filters.length) {
    query.query.bool.filter = searchParams.filters.map(filter => buildFilter(filter, mapping));
  }

  if (settings.facets) {
    query.aggregations = {};

    settings.facets.forEach(facet => {
      query.aggregations[facet.field] = buildFacetAggregation(getUntokenizedField(facet.field, mapping));
    });
  }

  if (searchParams.page) {
    query.from = (searchParams.page - 1) * query.size;
  }

  if (searchParams.sort && searchParams.sort.length) {
    query.sort = searchParams.sort.map(sort => buildSort(getUntokenizedField(sort.field, mapping), sort.direction));
  }

  return query;
};

module.exports = {
  build: buildQuery
};
