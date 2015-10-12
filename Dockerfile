FROM node:4.1.2

ADD . /src

RUN cd /src; npm install

EXPOSE 8080

WORKDIR /src

CMD ["node", "index.js"]
