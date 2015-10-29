'use strict';

const buildTermFilter = function (filterParams) {
  // Can't currenlty be a 1 liner due to https://github.com/nodejs/node/issues/2507
  const term = {[filterParams.field]: filterParams.term};
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

const buildFilter = function (filterParams) {
  if (filterParams.term) {
    return buildTermFilter(filterParams);
  }

  if (filterParams.range) {
    return buildRangeFilter(filterParams);
  }
};

const buildSort = function (sortParams) {
  if (sortParams.direction) {
    return {[sortParams.field]: {order: sortParams.direction}};
  }

  return sortParams.field;
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

const buildQuery = function (searchParams, settings) {
  const query = {
    query: {bool: {}},
    size: searchParams.hitsPerPage || 10
  };

  if (searchParams.query) {
    const queryString = {query: fuzzyMatch(searchParams.query), default_operator: 'and'};

    if (settings && settings.searchable_fields) {
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
    query.query.bool.filter = searchParams.filters.map(buildFilter);
  }

  if (searchParams.page) {
    query.from = (searchParams.page - 1) * query.size;
  }

  if (searchParams.sort && searchParams.sort.length) {
    query.sort = searchParams.sort.map(buildSort);
  }

  return query;
};

module.exports = {
  build: buildQuery
};
