'use strict';

const expect = require('chai').expect;
const indexObjectVerifier = require('../lib/index_object_verifier');

const constructObjectOfSize = size => {
  let part1 = '{"field1":"';
  const part2 = '"}';

  while (part1.length + part2.length < size) {
    part1 += '1';
  }

  return JSON.parse(part1 + part2);
};

describe('Index object verifier', () => {
  describe('exceedsSizeLimit', () => {
    it('returns true when object is over 10k size limit', () => {
      expect(indexObjectVerifier.exceedsSizeLimit(constructObjectOfSize(10001))).to.equal(true);
    });

    it('returns false when object size is 10k', () => {
      expect(indexObjectVerifier.exceedsSizeLimit(constructObjectOfSize(10000))).to.equal(false);
    });

    it('returns false when object size is under 10k', () => {
      expect(indexObjectVerifier.exceedsSizeLimit(constructObjectOfSize(5000))).to.equal(false);
    });
  });
});
