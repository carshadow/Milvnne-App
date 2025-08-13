FROM node:18-alpine

# 1) Carpeta de trabajo
WORKDIR /app

# 2) Copiar manifests primero para cachear deps
COPY package*.json ./

# 3) Instalar dependencias (sólo prod en la imagen final)
# si usas dependencias dev para transpilar, quita --omit=dev
RUN npm ci --omit=dev || npm install --omit=dev

# 4) Copiar el resto del código
COPY . .

# 5) Variables y puerto
ENV NODE_ENV=production
ENV PORT=8080

# 6) Exponer puerto
EXPOSE 8080

# 7) Arrancar la app (usa tu script start)
CMD ["npm", "start"]
