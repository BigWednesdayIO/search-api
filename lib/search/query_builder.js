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

const buildQuery = function (searchParams) {
  const query = {query: {filtered: {}}};

  if (searchParams.query) {
    query.query.filtered.query = {match: {_all: searchParams.query}};
  }

  if (searchParams.filters && searchParams.filters.length) {
    query.query.filtered = {
      filter: {and: searchParams.filters.map(buildFilter)}
    };
  }

  return query;
};

module.exports = {
  build: buildQuery
};
