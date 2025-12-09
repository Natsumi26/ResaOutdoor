FROM node:22.20.0

WORKDIR /app

COPY package*.json .

RUN npm install --force && npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]