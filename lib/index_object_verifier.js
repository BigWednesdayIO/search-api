'use strict';

const maxBytes = 10000;

module.exports.exceedsSizeLimit = o => {
  const size = Buffer.byteLength(JSON.stringify(o));
  return size > maxBytes;
};
