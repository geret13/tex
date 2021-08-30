FROM node

WORKDIR /app

COPY package.json /app/
RUN yarn install

COPY main.js /app/
COPY index.html /app/

CMD nodejs main.js
