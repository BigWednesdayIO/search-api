'use strict';

const expect = require('chai').expect;
const decodeUri = require('../lib/uri_decoder');

describe('URI decoder', () => {
  it('decodes string value', () => {
    expect(decodeUri('query=blonde%20beer'))
      .to.eql({query: 'blonde beer'});
  });

  it('decodes multiple attributes', () => {
    expect(decodeUri('query=beer&hitsPerPage=5'))
      .to.eql({query: 'beer', hitsPerPage: '5'});
  });

  it('decodes array value', () => {
    expect(decodeUri('filters=%5B%7B%22field%22%3A%22field1%22%2C%22term%22%3A%22value1%22%7D%5D'))
      .to.eql({filters: [{field: 'field1', term: 'value1'}]});
  });
});
