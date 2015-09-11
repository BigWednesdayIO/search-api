'use strict';

const cuid = require('cuid');
const AWS = require('aws-sdk');

const dynamoDbTableName = 'INDEXING_TASKS';
const dynamoDbParams = {apiVersion: '2012-08-10'};

if (process.env.AWS_ENDPOINT) {
  dynamoDbParams.endpoint = process.env.AWS_ENDPOINT;
}

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  service: new AWS.DynamoDB(dynamoDbParams)
});

module.exports = {
  create() {
    const dynamoDoc = {
      TableName: dynamoDbTableName,
      Item: {
        id: cuid(),
        objectID: cuid(),
        createdAt: new Date().toISOString(),
        complete: false
      }
    };

    return new Promise(function (resolve, reject) {
      dynamoDb.put(dynamoDoc, function (err, data) {
        if (err) {
          return reject(err);
        }

        resolve(data.Item);
      });
    });
  },

  get(id) {
    return new Promise(function (resolve, reject) {
      const params = {
        TableName: dynamoDbTableName,
        Key: {id: id}
      };

      dynamoDb.get(params, function (err, data) {
        if (err) {
          return reject(err);
        }

        resolve(data.Item);
      });
    });
  }
};
