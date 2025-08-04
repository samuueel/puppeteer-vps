# 1. Usar a imagem oficial do Google Chrome, que já vem com Node.js.
# Isso elimina a necessidade de instalar as dependências manualmente.
FROM ghcr.io/puppeteer/puppeteer:22.12.1

# 2. Define o ambiente para o Puppeteer encontrar o Chrome
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"

# 3. Define o diretório de trabalho dentro do container
WORKDIR /home/pptruser/meu-app

# 4. Copia o package.json e package-lock.json para o container
COPY package*.json ./

# 5. Instala as dependências do seu projeto (o Puppeteer já está na imagem,
# mas este passo é importante se você adicionar outras bibliotecas como 'axios', etc.)
RUN npm install

# 6. Copia o resto do código do seu projeto (o seu index.js)
COPY . .

# 7. Comando para rodar seu script quando o container iniciar
CMD ["npm", "start"]