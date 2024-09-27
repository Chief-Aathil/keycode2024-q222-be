const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const path = require('path');  // Import the path module

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const MERCHANT_FILTERS =  "&tbs=mr:1,merchagg:g101179491%7Cg11214002%7Cg140768507%7Cm5055540%7Cm341852884%7Cm671233727%7Cm141020976%7Cm10736904&sa=X&ved=0ahUKEwj-peLL2eKIAxXIwjgGHQLcAPEQsysIrwsoBg&biw=1363&bih=955&dpr=1"

rl.question('Enter the product you want to search for: ', async (prompt) => {
    // Launch a browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.google.com/search?tbm=shop&q=' + encodeURIComponent(prompt) + MERCHANT_FILTERS);

     await page.waitForSelector('.sh-dgr__content');

    // Extract the first 10 product details
    const products = await page.$$eval('.sh-dgr__content', elements => {
        return elements.map(element => {
            // Extract product URL
            const anchor = element.querySelector('a[rel="noopener"]');
            const href = anchor ? anchor.href : null;

            // Extract image URL
            const img = element.querySelector('a img');
            const src = img ? img.src : null;

            // Extract title
            const title = element.querySelector('h3');
            const productTitle = title ? title.innerText : null;

            // Extract price
            const price = element.querySelector('.a8Pemb') || element.querySelector('.a8Pemb .QIrs8');
            const productPrice = price ? price.innerText : null;

            // Extract rating
            const rating = element.querySelector('.Rsc7Yb') || element.querySelector('.uqAnbd');
            const productRating = rating ? rating.innerText : null;

            // Extract delivery information
            const delivery = element.querySelector('.vEjMR') || element.querySelector('.bONr3b');
            const deliveryInfo = delivery ? delivery.innerText : null;

            const description = element.querySelector('.bzCQNe') || element.querySelector('.F7Kwhf');
            const productDescription = description ? description.innerText : null;


            return {
                url: href,
                imgUrl: src,
                title: productTitle,
                price: productPrice,
                rating: productRating,
                delivery: deliveryInfo,
                description: productDescription
            };
        });
    });


    // console.log(products[0])
    const timestamp = Date.now();
    const directory = path.join(__dirname, '../data');
    const filename = path.join(directory, `${timestamp}_${prompt}.jsonl`);

    // Ensure the directory exists
    fs.mkdirSync(directory, { recursive: true });

    const writeStream = fs.createWriteStream(filename);

    products.forEach(product => {
        writeStream.write(JSON.stringify(product) + '\n');
    });

    writeStream.end(() => {
        console.log(`Products saved to ${filename}`);
    });

    await browser.close();
    rl.close();
})
