import puppeteer from 'puppeteer';

// Função principal assíncrona
async function runScraper() {
    console.log('Iniciando o Puppeteer no ambiente Easypanel...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            // O executablePath é necessário para a imagem oficial
            executablePath: '/usr/bin/google-chrome',
            // Argumentos essenciais para rodar em Docker/servidores
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Otimização para Docker
                '--disable-gpu', // Otimização para Docker
            ],
        });

        console.log('Navegador iniciado. Abrindo uma nova página...');
        const page = await browser.newPage();

        console.log('Navegando para https://example.com...');
        await page.goto('https://example.com', { waitUntil: 'networkidle0' });

        const pageTitle = await page.title();
        console.log(`O título da página é: "${pageTitle}"`);

        // Se você quisesse salvar um screenshot, precisaria de um volume
        // await page.screenshot({ path: '/app/output/exemplo.png' });
        // console.log('Screenshot salvo em /app/output/exemplo.png');

    } catch (error) {
        console.error('Ocorreu um erro durante a execução do Puppeteer:', error);
    } finally {
        if (browser) {
            console.log('Fechando o navegador...');
            await browser.close();
        }
        console.log('✅ Script concluído!');
    }
}

runScraper();
