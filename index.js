import puppeteer from 'puppeteer';

(async () => {
    console.log('Iniciando o Puppeteer dentro do Easypanel...');
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome', // Caminho padrão dentro da imagem oficial
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
    await page.goto('https://example.com');

    // Exemplo: Extraindo o título da página
    const pageTitle = await page.title();
    console.log(`O título da página é: "${pageTitle}"`);

    console.log('Fechando o navegador...');
    await browser.close();

    console.log('✅ Script concluído com sucesso!');
})();