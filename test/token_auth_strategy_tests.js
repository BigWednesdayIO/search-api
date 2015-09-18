'use strict';

const expect = require('chai').expect;
const authenticator = require('../lib/token_auth_strategy');

describe('token authenticator', () => {
  it('exists', () => {
    expect(authenticator).to.not.equal(undefined);
  });
});
