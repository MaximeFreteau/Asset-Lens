FROM node:20-alpine

WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm ci

# Source
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
