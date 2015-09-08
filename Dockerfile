FROM iojs:3.2.0

ADD . /src

RUN npm install -g grunt-cli
RUN cd /src; npm install

EXPOSE 8080

CMD ["node", "/src/index.js"]
