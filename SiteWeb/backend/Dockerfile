FROM node:20-alpine

WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm ci --only=production

# Source
COPY . .

# Build TypeScript
RUN npm run build

# Dossier uploads
RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
