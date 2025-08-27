FROM node:22-alpine

WORKDIR /usr/src/app

COPY gcp-service-account-key.json .

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 4000

CMD ["npm", "start"]