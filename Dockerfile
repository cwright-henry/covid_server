FROM node:12.16.3-alpine

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
EXPOSE 3000
CMD yarn build