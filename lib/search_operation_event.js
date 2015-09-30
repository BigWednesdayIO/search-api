'use strict';

class SearchOperationEvent {
  constructor(request) {
    this.path = request.path;
    this.params = request.params;
    this.payload = request.payload;
    this.query = request.query;
    this.method = request.method;
    this.requestReceived = new Date(request.info.received).toISOString();
    this.responseTime = Date.now() - request.info.received;
    this.statusCode = request.raw.res.statusCode;
    this.route = request.route.path;
    this.sourceIp = request.info.remoteAddress;
    this.userAgent = request.headers['user-agent'];
  }
}

module.exports = SearchOperationEvent;
