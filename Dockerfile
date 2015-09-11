FROM node:4.0.0

ADD . /src

RUN mkdir -p /opt/aws/dynamodb && \
  cd /opt/aws/dynamodb && \
  wget http://dynamodb-local.s3-website-us-west-2.amazonaws.com/dynamodb_local_latest.tar.gz && \
  tar -xvf dynamodb_local_latest.tar.gz && \
  rm dynamodb_local_latest.tar.gz && \
  apt-get update && \
  apt-get install -y openjdk-7-jre && \
  rm -rf /var/lib/apt/lists/* && \
  npm install -g grunt-cli

RUN cd /src; npm install

EXPOSE 8080

ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64

CMD ["node", "/src/index.js"]
