FROM node:22.20.0

WORKDIR /app

COPY package*.json /.

RUN npm install --force && npm install -g nodemon

COPY . .

# Générer Prisma client pour l'environnement Docker
RUN npx prisma generate

EXPOSE 5000

CMD ["nodemon", "server.js"]