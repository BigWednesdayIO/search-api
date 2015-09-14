'use strict';

const buildTermFilter = function (filterParams) {
  // Can't currenlty be a 1 liner due to https://github.com/nodejs/node/issues/2507
  const term = {[filterParams.field]: filterParams.term};
  return {term: term};
};

const buildQuery = function (searchParams) {
  const query = {query: {filtered: {}}};

  if (searchParams.query) {
    query.query.filtered.query = {match: {_all: searchParams.query}};
  }

  if (searchParams.filters && searchParams.filters.length) {
    query.query.filtered = {filter: {and: searchParams.filters.map(buildTermFilter)}};
  }

  return query;
};

module.exports = {
  build: buildQuery
};
