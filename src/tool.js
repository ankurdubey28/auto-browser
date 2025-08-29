import { configDotenv } from "dotenv";
import { chromium } from "playwright";
import { tool } from "@openai/agents";
import { z } from "zod";


configDotenv();

const browser = await chromium.launch({
    headless: false,
    chromiumSandbox: true,
    args: ["--disable-extensions", "--disable-file-system"],
});

const context = await browser.newContext();
const page = await context.newPage();



const takeScreenshot = tool({
    name: "take_screenshot",
    description: "Take a screenshot of the current page after DOM is settled",
    parameters: z.object({
        path: z.string().describe("The file path to save the screenshot"),
    }),
    async execute({ path }) {
        // Wait for page and DOM to settle
        await page.waitForLoadState("networkidle"); // wait until no network requests
        await page.waitForTimeout(500); // extra buffer for animations

        // Take compressed JPEG screenshot
        const buffer = await page.screenshot({
            path,
            type: "jpeg",
            quality: 50,
        });
         console.log("screenshot taken")
        return {
            type: "image",
            image_data: buffer.toString("base64"),
            mime_type: "image/jpeg",
        };
    },
});




const openBrowser = tool({
    name: "open_browser",
    description: "Open a URL in the current browser tab",
    parameters: z.object({
        url: z.string().describe("The URL to open"),
    }),
    async execute({ url }) {
        await page.goto(url);
        console.log("browser opened")
        return `Opened ${url}`;
    },
});



const clickOnScreen = tool({
    name: "click_screen",
    description: "Click an element on the page",
    parameters: z.object({
       x:z.number().describe('x coordinate'),
       y:z.number().describe('y coordinate')
    }),
    async execute({ x,y }) {
        await page.mouse.click(x,y);
        console.log(`Clicked at (${x},${y})` )
        return `Clicked at (${x},${y})`;

    },
});



const sendKeys = tool({
    name: "send_keys",
    description: "Type text into an input field",
    parameters: z.object({
        selector: z.string().describe(" selector of the input field"),
        text: z.string().describe("The text to type"),
    }),
    async execute({ selector, text }) {
        await page.fill(selector, text);
        console.log(`Typed "${text}" into ${selector}`)
        return `Typed "${text}" into ${selector}`;
    },
});



const scroll = tool({
    name: "scroll",
    description: "Scroll the page vertically",
    parameters: z.object({
        amount: z.number().describe(
            "Pixels to scroll by (positive = down, negative = up)"
        ),
    }),
    async execute({ amount }) {
        await page.evaluate((y) => window.scrollBy(0, y), amount);
        return `Scrolled by ${amount}px`;
    },
});



const getSelector = tool({
    name: "get_selector",
    description: `
Generate a robust Playwright locator for a UI element based on user intent.
Returns a selector (string) and a recommended method (click/fill).
Includes fallbacks for common patterns (login/signup/search/fill).
  `,
    parameters: z.object({
        element: z.string().describe("The element text or intent (e.g. 'Login', 'Search', 'Signup', 'Auth Sada')"),
    }),
    async execute({ element }) {
        console.log("🔍 selector called for:", element);

        const intent = element.toLowerCase();


        const agreeBtn = page.locator('button:has-text("I agree")');
        if (await agreeBtn.isVisible().catch(() => false)) {
            await agreeBtn.click();
        }

        if (intent.includes("search")) {
            const selectors = [
                'input[type="search"]',
                'input[name="q"]',
                'textarea[name="q"]',
                '[role="searchbox"]',
                'input[type="text"]'
            ];
            for (const sel of selectors) {
                if (await page.locator(sel).first().isVisible().catch(() => false)) {
                    return { selector: sel, method: "fill" };
                }
            }
            throw new Error("❌ No search box found");
        }


        // Auth: login/signup

        if (intent.includes("login") || intent.includes("sign in")) {
            return {
                selector: 'button:has-text("Login"), a:has-text("Login"), button:has-text("Sign in"), a:has-text("Sign in")',
                method: "click"
            };
        }

        if (intent.includes("signup") || intent.includes("register") || intent.includes("sign up")) {
            return {
                selector: 'button:has-text("Sign up"), a:has-text("Sign up"), button:has-text("Register"), a:has-text("Register"), button:has-text("Create Account"), a:has-text("Create Account")',
                method: "click"
            };
        }


        if (intent.includes("first name")) {
            return {
                selector: "input[name*='firstName'], input[id*='firstName'], input[placeholder*='First Name'], input[aria-label*='First Name']",
                method: "fill"
            };
        }

        if (intent.includes("last name")) {
            return {
                selector: "input[name*='lastName'], input[id*='lastName'], input[placeholder*='Last Name'], input[aria-label*='Last Name']",
                method: "fill"
            };
        }

        if (intent.includes("email")) {
            return {
                selector: "input[type='email'], input[name*='email'], input[id*='email'], input[placeholder*='Email'], textarea[name*='email']",
                method: "fill"
            };
        }

        if (intent.includes("confirm password")) {
            return {
                selector: "input[id*='confirmPassword'], input[name*='confirmPassword'], input[placeholder*='Confirm Password']",
                method: "fill"
            };
        }

        if (intent.includes("password")) {
            return {
                selector: "input[type='password'], input[name*='password'], input[id*='password'], input[placeholder*='Password']",
                method: "fill"
            };
        }


        // Inputs: Generic text/fill

        if (intent.includes("fill") || intent.includes("text") || intent.includes("name") || intent.includes("username") || intent.includes("first name") || intent.includes("last name")) {
            return {
                selector: "input[type='text'], textarea, input[name*='name'], input[id*='name'], input[placeholder*='Name']",
                method: "fill"
            };
        }

        return {
            selector: `button:has-text("${element}"), a:has-text("${element}")`,
            method: "click"
        };
    }
});





const clickElement = tool({
    name: "click_element",
    description: "Click an element on the page using a selector",
    parameters: z.object({
        selector: z.string().describe("Selector of the element to click"),
    }),
    async execute({ selector }) {
        await page.click(selector);
        console.log(`✅ Clicked element: ${selector}`);
        return `Clicked element: ${selector}`;
    },
});


const pressEnter=tool({
    name:'press_enter',
    description:"click enter on keyboard",
    parameters:z.object({}),
    async execute(){
        await page.keyboard.press('Enter')
        return "clicked entered"
    }
})








export const tools = {
    takeScreenshot,
    openBrowser,
    clickOnScreen,
    sendKeys,
    scroll,
    getSelector,
    clickElement,
    pressEnter
};
