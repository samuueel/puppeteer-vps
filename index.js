const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

app.post('/render', async (req, res) => {
  const { produto, ano, valores } = req.body;
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const html = `
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
            height: 400
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

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#curve_chart');
  await page.waitForTimeout(1000);

  const chartElement = await page.$('#curve_chart');
  const buffer = await chartElement.screenshot();

  await browser.close();

  res.set('Content-Type', 'image/png');
  res.send(buffer);
});

app.listen(80, () => {
  console.log('Gerador de Gráficos ativo na porta 80');
});

