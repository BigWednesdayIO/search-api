#!/bin/bash

echo Stopping any existing dynamodb server
pid=$(cat /var/run/dynamodb.pid 2>/dev/null)
: ${pid:=0}
if [[ $pid > 0 ]]; then kill $pid && rm /var/run/dynamodb.pid 2>/dev/null; fi

echo Restarting local dynamodb server
java -Djava.library.path=/opt/aws/dynamodb/DynamoDBLocal_lib -jar /opt/aws/dynamodb/DynamoDBLocal.jar -sharedDb -inMemory </dev/null &>/dev/null &
echo $! > /var/run/dynamodb.pid
