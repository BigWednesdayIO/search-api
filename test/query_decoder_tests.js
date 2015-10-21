'use strict';

const expect = require('chai').expect;
const decodeQuery = require('../lib/query_decoder');

describe('URI decoder', () => {
  it('decodes string value', () => {
    expect(decodeQuery('query=blonde%20beer'))
      .to.eql({query: 'blonde beer'});
  });

  it('decodes multiple attributes', () => {
    expect(decodeQuery('query=beer&hitsPerPage=5'))
      .to.eql({query: 'beer', hitsPerPage: '5'});
  });

  it('decodes array value', () => {
    expect(decodeQuery('filters=%5B%7B%22field%22%3A%22field1%22%2C%22term%22%3A%22value1%22%7D%5D'))
      .to.eql({filters: [{field: 'field1', term: 'value1'}]});
  });
});
