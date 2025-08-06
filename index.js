import puppeteer from 'puppeteer';
import express from 'express';
import fs from 'fs';

// Inicializa o servidor Express
const app = express();
const PORT = 3000; // A porta que o servidor vai usar dentro do container

// Middleware para permitir que o servidor entenda JSON nas requisições
app.use(express.json());

// Endpoint principal da nossa API: /render
// O n8n vai enviar os dados para este endereço
app.post('/render', async (req, res) => {
  // Pega o array de dados do corpo da requisição enviada pelo n8n
  const priceData = req.body.data;

  // Validação simples
  if (!priceData || !Array.isArray(priceData)) {
    return res.status(400).json({ error: 'O formato dos dados é inválido. Envie um JSON com a chave "data" contendo um array.' });
  }

  console.log(`Recebido pedido para renderizar gráfico com ${priceData.length} pontos de dados.`);

  try {
    // 1. Carrega o nosso molde HTML
    const templateHtml = fs.readFileSync('template.html', 'utf-8');
    
    // 2. Converte os dados recebidos para o formato de string que o Google Charts precisa e injeta no molde
    const chartDataString = JSON.stringify(priceData);
    const finalHtml = templateHtml.replace('%%DATA%%', chartDataString);

    // 3. Inicia o Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    const page = await browser.newPage();
    
    // Define o HTML da página para o nosso molde com os dados injetados
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    
    // Encontra o elemento do gráfico na página
    const chartElement = await page.$('#chart_div');
    if (!chartElement) {
        throw new Error('Elemento do gráfico #chart_div não encontrado na página.');
    }

    // Tira um "screenshot" apenas da área do gráfico
    const imageBuffer = await chartElement.screenshot();
    
    await browser.close();

    // 4. Retorna a imagem gerada como resposta para o n8n
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
    
    console.log('Gráfico gerado e enviado com sucesso!');

  } catch (error) {
    console.error('Erro ao gerar o gráfico:', error);
    res.status(500).json({ error: 'Falha ao gerar o gráfico.', details: error.message });
  }
});

// Inicia o servidor e o deixa "escutando" por pedidos
app.listen(PORT, () => {
  console.log(`Serviço "Gerador de Gráficos" rodando e escutando na porta ${PORT}`);
});
