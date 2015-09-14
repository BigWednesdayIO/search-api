'use strict';

const AWS = require('aws-sdk');
const dynamoDbParams = {apiVersion: '2012-08-10'};

if (process.env.AWS_ENDPOINT) {
  dynamoDbParams.endpoint = process.env.AWS_ENDPOINT;
}

module.exports.service = () => {
  return new AWS.DynamoDB(dynamoDbParams);
};

module.exports.documentClient = () => {
  return new AWS.DynamoDB.DocumentClient({
    service: module.exports.service()
  });
};

module.exports.tables = {
  indexingTasks: 'INDEXING_TASKS'
};
