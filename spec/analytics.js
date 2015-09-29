'use strict';

const expect = require('chai').expect;
const specRequest = require('./spec_request');
const dgram = require('dgram');
const udpServer = dgram.createSocket('udp4');

describe('analytics', () => {
  afterEach(done => {
    udpServer.close(done);
  });

  it('records analytics', done => {
    udpServer.on('message', message => {
      const analyticsRecord = JSON.parse(message);
      expect(analyticsRecord.route).to.equal('/1/indexes/{name}/query');
      done();
    });

    udpServer.bind(9999, '0.0.0.0', () => {
      specRequest({url: `/1/indexes/some-index/query`, method: 'post', payload: {}});
    });
  });
});
