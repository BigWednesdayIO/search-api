'use strict';

const cuid = require('cuid');
const AWS = require('aws-sdk');

const dynamoDbParams = {apiVersion: '2012-08-10', params: {TableName: 'INDEXING_TASKS'}};

if (process.env.AWS_ENDPOINT) {
  dynamoDbParams.endpoint = process.env.AWS_ENDPOINT;
}

const dynamoDb = new AWS.DynamoDB({apiVersion: '2012-08-10', params: {TableName: 'INDEXING_TASKS'}});

const dynamoObjectToTask = function (dynamoItem) {
  return {
    id: dynamoItem.Item.id.S,
    objectID: dynamoItem.Item.objectID.S,
    createdAt: dynamoItem.Item.createdAt.S,
    complete: dynamoItem.Item.complete.BOOL
  };
};

module.exports = {
  create() {
    const itemParams = {Item: {id: {S: cuid()}, objectID: {S: cuid()}, createdAt: {S: new Date().toISOString()}, complete: {BOOL: false}}};

    return new Promise(function (resolve, reject) {
      dynamoDb.putItem(itemParams, function (err) {
        if (err) {
          return reject(err);
        }

        resolve(dynamoObjectToTask(itemParams));
      });
    });
  },

  get(id) {
    return new Promise(function (resolve, reject) {
      dynamoDb.getItem({Key: {id: {S: id}}}, function (err, data) {
        if (err) {
          return reject(err);
        }

        resolve(dynamoObjectToTask(data));
      });
    });
  }
};
