# 1. Usar a imagem oficial do Puppeteer, que já inclui Node.js e todas as dependências do Chrome.
FROM ghcr.io/puppeteer/puppeteer:22.12.1

# 2. Define uma variável de ambiente para garantir que o Puppeteer encontre o Chrome
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"

# 3. Define o diretório de trabalho dentro do container
WORKDIR /app

# 4. Copia os arquivos de definição de dependências (package.json e package-lock.json)
COPY package*.json ./

# 5. Instala as dependências do seu projeto. O Puppeteer em si já vem na imagem,
# mas isso é útil se você adicionar outras bibliotecas (ex: axios).
RUN npm install

# 6. Copia o resto do código do seu projeto (seu arquivo index.js)
COPY . .

# 7. Comando padrão para rodar seu script quando o container iniciar
CMD ["npm", "start"]
