const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 80;

app.use(express.json());

// --- INÍCIO DA ADIÇÃO ---
// Health Check endpoint para o Easypanel
// Responde à verificação de saúde que o Easypanel faz na rota principal
app.get('/', (req, res) => {
  res.status(200).send('Serviço Gerador de Gráficos está no ar!');
});
// --- FIM DA ADIÇÃO ---

// Endpoint principal que o n8n vai chamar para gerar o gráfico
app.post('/render', async (req, res) => {
  const { produto, ano, valores } = req.body;
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (!produto || !ano || !valores || !Array.isArray(valores)) {
    return res.status(400).json({ error: 'Dados inválidos. As chaves "produto", "ano" e "valores" (array) são obrigatórias.' });
  }
  
  console.log(`[LOG] Recebido pedido para renderizar gráfico para o produto: ${produto}`);

  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8">
      <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
      <script type="text/javascript">
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(drawChart);

        function drawChart() {
          var data = google.visualization.arrayToDataTable([
            ['Mês', 'Preço'],
            ${valores.map((v, i) => `['${meses[i]}', ${v}]`).join(',')}
          ]);

          var options = {
            title: '${produto} (${ano})',
            curveType: 'function',
            legend: { position: 'bottom' },
            width: 800,
            height: 400,
            backgroundColor: { fill:'transparent' },
            titleTextStyle: { color: '#FFF' },
            legendTextStyle: { color: '#CCC' },
            hAxis: { textStyle: { color: '#CCC' }, gridlines: { color: '#444' } },
            vAxis: { textStyle: { color: '#CCC' }, gridlines: { color: '#444' }, format: 'currency' }
          };

          var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
          chart.draw(data, options);
        }
      </script>
    </head>
    <body>
      <div id="curve_chart" style="width: 800px; height: 400px"></div>
    </body>
  </html>
  `;

  let browser;
  try {
    browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/google-chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#curve_chart');

    const chartElement = await page.$('#curve_chart');
    const buffer = await chartElement.screenshot({ omitBackground: true });
    
    res.set('Content-Type', 'image/png');
    res.send(buffer);
    
    console.log(`[LOG] Gráfico para '${produto}' gerado com sucesso.`);

  } catch (error) {
    console.error('[ERRO] Falha ao gerar o gráfico:', error);
    res.status(500).json({ error: 'Ocorreu uma falha interna ao gerar o gráfico.', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Serviço "Gerador de Gráficos" rodando e escutando na porta ${PORT}`);
});
