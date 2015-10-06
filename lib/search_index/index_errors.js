'use strict';

class ObjectNotFoundError extends Error {
  constructor() {
    super(arguments);

    this.indexFound = true;
    this.objectFound = false;
  }
}

class IndexNotFoundError extends ObjectNotFoundError {
  constructor() {
    super(arguments);

    this.indexFound = false;
  }
}

module.exports = {
  ObjectNotFoundError,
  IndexNotFoundError
};
