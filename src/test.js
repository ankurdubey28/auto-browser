import { chromium } from 'playwright';

async function performAction({ url, action, query }) {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Handle "I agree" popup
    const agreeBtn = page.locator('button', { hasText: 'I agree' });
    if (await agreeBtn.isVisible().catch(() => false)) {
        await agreeBtn.click();
    }

    // --------------------
    // Handle Special Actions
    // --------------------
    if (action === 'search') {
        const searchSelectors = [
            'input[type="search"]',
            'input[name="q"]',
            'textarea[name="q"]',
            'input[type="text"]',
            '[role="searchbox"]'
        ];

        let searchBox = null;
        for (const sel of searchSelectors) {
            if (await page.locator(sel).first().isVisible().catch(() => false)) {
                searchBox = page.locator(sel).first();
                break;
            }
        }

        if (!searchBox) throw new Error("❌ No search box found on page");

        await searchBox.fill(query);
        await searchBox.press('Enter');
        await page.waitForLoadState('domcontentloaded');
        console.log(`✅ Search '${query}' performed on ${url}`);

    } else if (action === 'login' || action === 'signup') {
        const keywords = action === 'login'
            ? [/login/i, /log in/i, /sign in/i]
            : [/signup/i, /sign up/i, /register/i, /create account/i];

        let found = false;
        for (const kw of keywords) {
            const btn = page.getByRole('button', { name: kw }).first();
            if (await btn.isVisible().catch(() => false)) {
                await btn.click();
                console.log(`✅ Clicked ${action} button on ${url}`);
                found = true;
                break;
            }

            const link = page.getByRole('link', { name: kw }).first();
            if (await link.isVisible().catch(() => false)) {
                await link.click();
                console.log(`✅ Clicked ${action} link on ${url}`);
                found = true;
                break;
            }
        }

        if (!found) throw new Error(`❌ No ${action} button/link found on ${url}`);

    } else if (action === 'fill-text') {
        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible().catch(() => false)) {
            await textarea.fill(query);
            console.log(`✅ Filled textarea with: ${query}`);
        } else {
            throw new Error('❌ No textarea found');
        }

    } else {
        // --------------------
        // 🔹 Generic Action: Click element by text
        // --------------------
        const targetRegex = new RegExp(action, 'i'); // case-insensitive
        let clicked = false;

        const btn = page.getByRole('button', { name: targetRegex }).first();
        if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            console.log(`✅ Clicked button with text '${action}' on ${url}`);
            clicked = true;
        }

        if (!clicked) {
            const link = page.getByRole('link', { name: targetRegex }).first();
            if (await link.isVisible().catch(() => false)) {
                await link.click();
                console.log(`✅ Clicked link with text '${action}' on ${url}`);
                clicked = true;
            }
        }

        if (!clicked) throw new Error(`❌ No element with text '${action}' found on ${url}`);
    }
    // page.de
    // await browser.close();
}

// --------------------
// Example usage
// --------------------
(async () => {
    await performAction({
        url: 'https://ui.chaicode.com/',
        action: 'Sign Up'   // will try to click button/link with text "Auth Sada"
    });
})();
