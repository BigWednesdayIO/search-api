#!/bin/bash

pid=$(ps ef | grep [D]ynamoDBLocal | awk '{print $1}');
: ${pid:=0};

if [[ $pid = 0 ]]; then
  echo Starting DynamoDb
  java -Djava.library.path=/opt/aws/dynamodb/DynamoDBLocal_lib -jar /opt/aws/dynamodb/DynamoDBLocal.jar -sharedDb -inMemory </dev/null &>/dev/null &
fi
