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

const buildQuery = function (searchParams) {
  const query = {
    query: {filtered: {}},
    size: searchParams.hitsPerPage || 10
  };

  if (searchParams.query) {
    query.query.filtered.query = {match: {_all: searchParams.query}};
  }

  if (searchParams.filters && searchParams.filters.length) {
    query.query.filtered = {
      filter: {and: searchParams.filters.map(buildFilter)}
    };
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
