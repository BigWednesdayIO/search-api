'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const SearchOperationEvent = require('../lib/search_operation_event');

describe('SearchOperationEvent', () => {
  let searchOpEvent;
  let clock;

  const requestTimeISO = '2015-09-29T16:54:22.655Z';
  const requestTime = new Date(requestTimeISO);

  const testRequest = {
    path: '/indexes/big-wednesday-io-products/query',
    params: {name: 'big-wednesday-io-products'},
    payload: {query: 'API'},
    query: {},
    method: 'post',
    route: {path: '/indexes/{name}/query'},
    info: {
      received: requestTime.getTime(),
      remoteAddress: '1.2.3.4'
    },
    headers: {
      'user-agent': 'Chrome567'
    },
    raw: {res: {statusCode: 200}}
  };

  beforeEach(() => {
    const eigthyMsAfterRequest = requestTime.getTime() + 80;
    clock = sinon.useFakeTimers(eigthyMsAfterRequest);
    searchOpEvent = new SearchOperationEvent(testRequest);
  });

  afterEach(() => {
    searchOpEvent = undefined;
    clock.restore();
  });

  it('has path', () => {
    expect(searchOpEvent.path).to.equal('/indexes/big-wednesday-io-products/query');
  });

  it('has params', () => {
    expect(searchOpEvent.params).to.eql({name: 'big-wednesday-io-products'});
  });

  it('has payload', () => {
    expect(searchOpEvent.payload).to.eql({query: 'API'});
  });

  it('has query', () => {
    expect(searchOpEvent.query).to.eql({});
  });

  it('has method', () => {
    expect(searchOpEvent.method).to.equal('post');
  });

  it('has status', () => {
    expect(searchOpEvent.statusCode).to.equal(200);
  });

  it('has route', () => {
    expect(searchOpEvent.route).to.equal('/indexes/{name}/query');
  });

  it('has requestReceived', () => {
    expect(searchOpEvent.requestReceived).to.equal(requestTimeISO);
  });

  it('has requestTime', () => {
    expect(searchOpEvent.responseTime).to.equal(80);
  });

  it('has sourceIp', () => {
    expect(searchOpEvent.sourceIp).to.equal('1.2.3.4');
  });

  it('has userAgent', () => {
    expect(searchOpEvent.userAgent).to.equal('Chrome567');
  });
});
