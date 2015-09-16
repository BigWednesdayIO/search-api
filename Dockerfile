FROM node:4.0.0

ADD . /src

RUN npm install -g grunt-cli && \
  npm install -g swagger-tools

RUN cd /src; npm install

EXPOSE 8080

CMD ["node", "/src/index.js"]
