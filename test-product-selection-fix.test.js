const puppeteer = require('puppeteer-core');

async function testProductSelectionFix() {
  let browser;
  try {
    console.log('Launching browser for product selection fix test...');
    browser = await puppeteer.launch({
      headless: false, // Set to false to see the test in action
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('Navigating to the Create Service Assignment page...');
    await page.goto('http://localhost:3000/logistics/assignments/create?jobOrderId=SnCwXXN8EwGtPhoKnaER', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Waiting for page to load completely...');
    await page.waitForSelector('h1', { timeout: 30000 });

    // Step 1: Verify initial page load
    console.log('Step 1: Verifying initial page load...');
    const pageTitle = await page.$eval('h1', el => el.textContent);
    console.log('Page title:', pageTitle);

    // Check if we're on the login page and need to navigate to the correct page
    if (pageTitle === 'Welcome!') {
      console.log('On login page, navigating to create service assignment page...');
      await page.goto('http://localhost:3000/logistics/assignments/create?jobOrderId=SnCwXXN8EwGtPhoKnaER', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await page.waitForSelector('h1', { timeout: 30000 });
      const newPageTitle = await page.$eval('h1', el => el.textContent);
      console.log('New page title:', newPageTitle);
    }

    // Step 2: Check if product is pre-selected from job order
    console.log('Step 2: Checking initial product selection...');
    const initialProductImage = await page.$('img[alt*="Site Image"]');
    const initialProductName = await page.$('span[style*="font-weight: 700"]');
    const initialProductLocation = await page.$('span.text-sm.text-gray-500');

    console.log('Initial product image found:', !!initialProductImage);
    console.log('Initial product name found:', !!initialProductName);
    console.log('Initial product location found:', !!initialProductLocation);

    // Get initial product details
    let initialProductDetails = {};
    if (initialProductName) {
      initialProductDetails.name = await page.evaluate(el => el.textContent, initialProductName);
      console.log('Initial product name:', initialProductDetails.name);
    }
    if (initialProductLocation) {
      initialProductDetails.location = await page.evaluate(el => el.textContent, initialProductLocation);
      console.log('Initial product location:', initialProductDetails.location);
    }

    // Step 3: Click on product image to open ProductSelectionDialog
    console.log('Step 3: Clicking on product image to open selection dialog...');
    if (initialProductImage) {
      await page.click('img[alt*="Site Image"]');
    } else {
      // Try clicking on the "Select Site" button if no image is shown
      const selectSiteButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent && btn.textContent.trim() === 'Select Site');
      });
      if (selectSiteButton) {
        await page.click('button');
        // Click the specific button by evaluating
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const selectBtn = buttons.find(btn => btn.textContent && btn.textContent.trim() === 'Select Site');
          if (selectBtn) selectBtn.click();
        });
      } else {
        throw new Error('Could not find product image or Select Site button');
      }
    }

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    console.log('Product selection dialog opened successfully');

    // Step 4: Verify dialog content
    console.log('Step 4: Verifying dialog content...');
    const dialogTitle = await page.$eval('[role="dialog"] h2', el => el.textContent);
    console.log('Dialog title:', dialogTitle);

    // Wait for products to load
    await page.waitForTimeout(3000);

    // Get all product cards in the dialog
    const productCards = await page.$$('[role="dialog"] [class*="cursor-pointer"]');
    console.log('Number of products in dialog:', productCards.length);

    if (productCards.length === 0) {
      throw new Error('No products found in the selection dialog');
    }

    // Step 5: Select a different product (not the first one if possible)
    console.log('Step 5: Selecting a different product...');

    // Get details of the first product in the dialog
    const firstProductCard = productCards[0];
    const firstProductName = await firstProductCard.$eval('h3', el => el.textContent);
    const firstProductLocation = await firstProductCard.$eval('div.text-xs.text-gray-600', el => el.textContent);

    console.log('First product in dialog - Name:', firstProductName, 'Location:', firstProductLocation);

    // Select the first product in the dialog
    await firstProductCard.click();

    // Wait for dialog to close
    await page.waitForSelector('[role="dialog"]', { hidden: true, timeout: 10000 });
    console.log('Product selection dialog closed');

    // Step 6: Verify that the selected product updates on the main page
    console.log('Step 6: Verifying product update on main page...');

    // Wait a moment for the update to take effect
    await page.waitForTimeout(1000);

    // Check updated product details
    const updatedProductImage = await page.$('img[alt*="Site Image"]');
    const updatedProductName = await page.$('span[style*="font-weight: 700"]');
    const updatedProductLocation = await page.$('span.text-sm.text-gray-500');

    console.log('Updated product image found:', !!updatedProductImage);
    console.log('Updated product name found:', !!updatedProductName);
    console.log('Updated product location found:', !!updatedProductLocation);

    let updatedProductDetails = {};
    if (updatedProductName) {
      updatedProductDetails.name = await page.evaluate(el => el.textContent, updatedProductName);
      console.log('Updated product name:', updatedProductDetails.name);
    }
    if (updatedProductLocation) {
      updatedProductDetails.location = await page.evaluate(el => el.textContent, updatedProductLocation);
      console.log('Updated product location:', updatedProductDetails.location);
    }

    // Step 7: Verify the change
    console.log('Step 7: Verifying the product selection change...');
    const productChanged = updatedProductDetails.name !== initialProductDetails.name ||
                          updatedProductDetails.location !== initialProductDetails.location;

    console.log('Product changed:', productChanged);
    console.log('Initial product:', initialProductDetails);
    console.log('Updated product:', updatedProductDetails);

    // Step 8: Check for console errors
    console.log('Step 8: Checking for console errors...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit more for any async operations
    await page.waitForTimeout(2000);

    // === TEST RESULTS ===
    console.log('\n=== PRODUCT SELECTION FIX TEST RESULTS ===');
    console.log('1. Page loaded successfully:', pageTitle ? 'PASS' : 'FAIL');
    console.log('2. Initial product displayed:', initialProductImage && initialProductName ? 'PASS' : 'FAIL');
    console.log('3. Product selection dialog opened:', 'PASS');
    console.log('4. Products loaded in dialog:', productCards.length > 0 ? 'PASS' : 'FAIL');
    console.log('5. Product selection completed:', 'PASS');
    console.log('6. Product updated on main page:', updatedProductImage && updatedProductName ? 'PASS' : 'FAIL');
    console.log('7. Product selection actually changed:', productChanged ? 'PASS' : 'FAIL');
    console.log('8. Console errors:', errors.length === 0 ? 'PASS (no errors)' : `FAIL (${errors.length} errors)`);

    if (errors.length > 0) {
      console.log('Console errors:');
      errors.forEach(error => console.log('  -', error));
    }

    // Determine overall test result
    const allTestsPass = pageTitle &&
                        (initialProductImage && initialProductName) &&
                        productCards.length > 0 &&
                        (updatedProductImage && updatedProductName) &&
                        productChanged &&
                        errors.length === 0;

    console.log('\nOVERALL RESULT:', allTestsPass ? 'PASS - Product selection fix is working correctly' : 'FAIL - Product selection fix has issues');

    return {
      success: allTestsPass,
      details: {
        pageLoaded: !!pageTitle,
        initialProductDisplayed: !!(initialProductImage && initialProductName),
        dialogOpened: true,
        productsInDialog: productCards.length,
        selectionCompleted: true,
        productUpdated: !!(updatedProductImage && updatedProductName),
        productChanged,
        consoleErrors: errors,
        initialProduct: initialProductDetails,
        selectedProduct: updatedProductDetails
      }
    };

  } catch (error) {
    console.error('Test failed:', error.message);
    return {
      success: false,
      error: error.message,
      details: {}
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testProductSelectionFix().then(result => {
  console.log('\n=== FINAL TEST REPORT ===');
  console.log('Test completed at:', new Date().toISOString());
  console.log('Result:', result.success ? 'SUCCESS' : 'FAILED');

  if (!result.success) {
    console.log('Error:', result.error);
  }

  process.exit(result.success ? 0 : 1);
});