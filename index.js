// Usando 'require' para manter a consistência com seu package.json (sem "type": "module")
const express = require('express');
const puppeteer = require('puppeteer');

// Inicializa a aplicação Express
const app = express();
const PORT = 80; // Define a porta como uma constante para fácil manutenção

// Substitui o 'body-parser' pela função nativa do Express para interpretar JSON
app.use(express.json());

// Endpoint principal que o n8n vai chamar para gerar o gráfico
app.post('/render', async (req, res) => {
    // Extrai as variáveis do corpo da requisição
    const { produto, ano, valores } = req.body;
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Validação de entrada para garantir que os dados necessários foram recebidos
    if (!produto || !ano || !valores || !Array.isArray(valores)) {
        return res.status(400).json({ error: 'Dados inválidos. As chaves "produto", "ano" e "valores" (array) são obrigatórias.' });
    }
    
    console.log(`[LOG] Recebido pedido para renderizar gráfico para o produto: ${produto}`);

    // Cria o HTML do gráfico dinamicamente com os dados recebidos
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
              // Estilos para combinar com um tema escuro
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
        // Inicia o Puppeteer com os argumentos recomendados para Docker
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage' // Otimização importante para ambientes com memória compartilhada limitada
            ]
        });

        const page = await browser.newPage();
        
        // Define o conteúdo da página para o nosso HTML gerado
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Espera o seletor do gráfico aparecer (boa prática)
        await page.waitForSelector('#curve_chart');

        const chartElement = await page.$('#curve_chart');
        
        // Tira o screenshot do elemento do gráfico
        const buffer = await chartElement.screenshot({ omitBackground: true }); // omitBackground deixa o fundo transparente

        // Retorna a imagem como resposta
        res.set('Content-Type', 'image/png');
        res.send(buffer);
        
        console.log(`[LOG] Gráfico para '${produto}' gerado com sucesso.`);

    } catch (error) {
        console.error('[ERRO] Falha ao gerar o gráfico:', error);
        res.status(500).json({ error: 'Ocorreu uma falha interna ao gerar o gráfico.', details: error.message });
    } finally {
        // Garante que o navegador seja sempre fechado, mesmo se ocorrer um erro
        if (browser) {
            await browser.close();
        }
    }
});

// Inicia o servidor e o deixa escutando na porta 80
app.listen(PORT, () => {
    console.log(`Serviço "Gerador de Gráficos" rodando e escutando na porta ${PORT}`);
});
