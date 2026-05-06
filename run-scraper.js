require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase using Service Role Key for backend write access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function scrapeAndSync() {
    console.log("🚀 Starting LuxuryLevel Scraper...");
    
    // Launch browser - set headless to false if you want to see the action
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set a realistic User-Agent to avoid being flagged as a bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        const targetURL = 'https://luxurysouq.com/watches/';
        console.log(`Visiting: ${targetURL}`);
        
        await page.goto(targetURL, { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // Wait for the product grid to load
        await page.waitForSelector('.products, .type-product', { timeout: 10000 }).catch(() => console.log("Timeout waiting for selectors, proceeding anyway..."));

        const products = await page.evaluate(() => {
            let results = [];
            // Target multiple possible WooCommerce product card selectors
            let items = document.querySelectorAll('li.product, .type-product, .product-grid-item'); 
            
            items.forEach((item, index) => {
                if(index >= 10) return; // Limit to 10 items for the first successful test
                
                // Try multiple selectors for Title
                let titleElement = item.querySelector('.woocommerce-loop-product__title') || 
                                   item.querySelector('.product-title') || 
                                   item.querySelector('h2') || 
                                   item.querySelector('h3');
                
                let title = titleElement?.innerText?.trim() || 'Unknown Watch';

                // Try multiple selectors for Price
                let priceElement = item.querySelector('.price') || 
                                   item.querySelector('.woocommerce-Price-amount');
                
                let priceText = priceElement?.innerText || '0';
                
                // Clean the price: remove currency symbols, commas, and letters
                let cleanPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

                // Try to find an image URL
                let imgElement = item.querySelector('img');
                let imgUrl = imgElement?.getAttribute('src') || '';

                results.push({
                    scraped_ref_no: `LUX-${Math.floor(Math.random() * 90000) + 10000}`, // Temporary Ref No.
                    scraped_name: title,
                    scraped_price: isNaN(cleanPrice) ? 0 : cleanPrice,
                    raw_brand_name: 'Luxury Brand', // We can refine this later to extract the actual brand
                    raw_category_name: 'Watches',
                    sync_status: 'pending'
                });
            });
            return results;
        });

        console.log(`Found ${products.length} products.`);

        if (products.length > 0) {
            console.log("Inserting into Supabase staging_products...");
            const { data, error } = await supabase
                .from('staging_products')
                .insert(products);

            if (error) {
                console.error("❌ Supabase Insert Error:", error.message);
            } else {
                console.log("✅ Success! Products are now in the Staging area.");
            }
        } else {
            console.log("⚠️ No products found. The website structure might have changed.");
        }

    } catch (error) {
        console.error("❌ Scraping process failed:", error.message);
    } finally {
        await browser.close();
        console.log("Process finished.");
    }
}

scrapeAndSync();