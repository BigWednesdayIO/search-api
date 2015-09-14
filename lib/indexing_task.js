'use strict';

const cuid = require('cuid');

const dynamoDbDocumentClient = require('./dynamodb').documentClient();
const dynamoDbTableName = require('./dynamodb').tables.indexingTasks;

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

    return new Promise((resolve, reject) => {
      dynamoDbDocumentClient.put(dynamoDoc, err => {
        if (err) {
          return reject(err);
        }

        resolve(dynamoDoc.Item);
      });
    });
  },

  get(id) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: dynamoDbTableName,
        Key: {id: id}
      };

      dynamoDbDocumentClient.get(params, (err, data) => {
        if (err) {
          return reject(err);
        }

        resolve(data.Item);
      });
    });
  }
};
