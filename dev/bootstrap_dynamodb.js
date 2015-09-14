'use strict';

const dynamoDb = require('../lib/dynamodb').service();

const indexingTasksTable = require('../lib/dynamodb').tables.indexingTasks;

console.log('Creating dynamoDb tables');

dynamoDb.createTable({
  TableName: indexingTasksTable,
  AttributeDefinitions: [
    {AttributeName: 'id', AttributeType: 'S'}
  ],
  KeySchema: [
    {AttributeName: 'id', KeyType: 'HASH'}
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  },
}, err => {
  if (err) {
    console.error(`Failed to create table ${indexingTasksTable}. ${err}`);
    throw err;
  }
});
