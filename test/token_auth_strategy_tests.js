'use strict';

const expect = require('chai').expect;
const authenticatorFactory = require('../lib/token_auth_strategy');

describe('token authenticator', () => {
  let authenticator;

  before(() => {
    authenticator = authenticatorFactory([{token: '123456', clientId: 'bigwednesday.io'}]);
  });

  it('returns true when token is found', () => {
    authenticator('123456', (err, valid) => {
      expect(err).not.to.be.ok;
      expect(valid).to.equal(true);
    });
  });

  it('returns credentials when token is found', () => {
    authenticator('123456', (err, valid, credentials) => {
      expect(err).not.to.be.ok;
      expect(credentials).to.deep.equal({clientId: 'bigwednesday.io', token: '123456'});
    });
  });

  it('returns false when token not found', () => {
    authenticator('unknown', (err, valid) => {
      expect(err).not.to.be.ok;
      expect(valid).to.equal(false);
    });
  });

  it('does not return credentials when token not found', () => {
    authenticator('unknown', (err, valid, credentials) => {
      expect(err).not.to.be.ok;
      expect(credentials).not.to.be.ok;
    });
  });
});
