# Using docker to test npm install
# FROM node:8.0-alpine
# FROM node:12.0-alpine
FROM node:14.0-alpine

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN apk add --no-cache python make gcc g++ \
  && cd /usr/src/app \
  && npm install \
  && apk del python make gcc g++ \
  && rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp

