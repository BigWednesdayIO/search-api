FROM iojs:3.2.0

ADD . /src

RUN cd /src; npm install

EXPOSE 80

CMD ["node", "/src/index.js"]
