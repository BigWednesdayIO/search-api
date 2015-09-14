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

    const put = new Promise(function (resolve, reject) {
      dynamoDbDocumentClient.put(dynamoDoc, function (err) {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });

    const get = this.get;

    return put.then(function () {
      return get(dynamoDoc.Item.id);
    });
  },

  get(id) {
    return new Promise(function (resolve, reject) {
      const params = {
        TableName: dynamoDbTableName,
        Key: {id: id}
      };

      dynamoDbDocumentClient.get(params, function (err, data) {
        if (err) {
          return reject(err);
        }

        resolve(data.Item);
      });
    });
  }
};
