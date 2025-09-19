#!/usr/bin/env node

/**
 * Playwright MCP Server
 * Provides browser automation capabilities for AI Advisor App
 * Supports GLM models and Claude Code integration
 */

const { Server } = require('@modelcontextprotocol/sdk');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { chromium, firefox, webkit } = require('playwright');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PLAYWRIGHT_PORT || 3004;
const HOST = process.env.PLAYWRIGHT_HOST || '0.0.0.0';
const HEADLESS = process.env.HEADLESS !== 'false';
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || [];

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global browser instances
let browsers = {
  chromium: null,
  firefox: null,
  webkit: null,
};

let contexts = new Map();
let pages = new Map();

// Initialize MCP Server
const server = new Server({
  name: 'playwright-mcp-server',
  version: '1.0.0',
  description: 'Browser automation server using Playwright',
});

// MCP Tool Definitions
const tools = [
  {
    name: 'playwright_navigate',
    description: 'Navigate to a URL in the browser',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to navigate to',
        },
        browser: {
          type: 'string',
          enum: ['chromium', 'firefox', 'webkit'],
          default: 'chromium',
          description: 'Browser type to use',
        },
        timeout: {
          type: 'number',
          default: 30000,
          description: 'Navigation timeout in milliseconds',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'playwright_screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Page ID to capture',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to capture specific element',
        },
        fullPage: {
          type: 'boolean',
          default: false,
          description: 'Capture full page screenshot',
        },
        format: {
          type: 'string',
          enum: ['png', 'jpeg'],
          default: 'png',
          description: 'Screenshot format',
        },
        quality: {
          type: 'number',
          default: 90,
          description: 'Image quality (for JPEG)',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'playwright_click',
    description: 'Click on an element',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Page ID to interact with',
        },
        selector: {
          type: 'string',
          description: 'CSS selector of element to click',
        },
        timeout: {
          type: 'number',
          default: 5000,
          description: 'Click timeout in milliseconds',
        },
        force: {
          type: 'boolean',
          default: false,
          description: 'Force click even if element is not visible',
        },
      },
      required: ['pageId', 'selector'],
    },
  },
  {
    name: 'playwright_type',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Page ID to interact with',
        },
        selector: {
          type: 'string',
          description: 'CSS selector of input field',
        },
        text: {
          type: 'string',
          description: 'Text to type',
        },
        delay: {
          type: 'number',
          default: 50,
          description: 'Delay between keystrokes in milliseconds',
        },
        clear: {
          type: 'boolean',
          default: true,
          description: 'Clear field before typing',
        },
      },
      required: ['pageId', 'selector', 'text'],
    },
  },
  {
    name: 'playwright_wait_for',
    description: 'Wait for an element or condition',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Page ID to wait on',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to wait for',
        },
        state: {
          type: 'string',
          enum: ['attached', 'detached', 'visible', 'hidden'],
          default: 'visible',
          description: 'Element state to wait for',
        },
        timeout: {
          type: 'number',
          default: 30000,
          description: 'Wait timeout in milliseconds',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'playwright_get_content',
    description: 'Get page content or element text',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Page ID to get content from',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to get content from',
        },
        attribute: {
          type: 'string',
          description: 'Get specific attribute value',
        },
        innerText: {
          type: 'boolean',
          default: true,
          description: 'Get inner text content',
        },
        innerHTML: {
          type: 'boolean',
          default: false,
          description: 'Get inner HTML content',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'playwright_evaluate',
    description: 'Execute JavaScript in the page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Page ID to evaluate in',
        },
        script: {
          type: 'string',
          description: 'JavaScript code to execute',
        },
        args: {
          type: 'array',
          default: [],
          description: 'Arguments to pass to the script',
        },
      },
      required: ['pageId', 'script'],
    },
  },
  {
    name: 'playwright_create_page',
    description: 'Create a new browser page',
    inputSchema: {
      type: 'object',
      properties: {
        browser: {
          type: 'string',
          enum: ['chromium', 'firefox', 'webkit'],
          default: 'chromium',
          description: 'Browser type to use',
        },
        viewport: {
          type: 'object',
          properties: {
            width: { type: 'number', default: 1280 },
            height: { type: 'number', default: 720 },
          },
          description: 'Viewport dimensions',
        },
        userAgent: {
          type: 'string',
          description: 'Custom user agent',
        },
      },
    },
  },
  {
    name: 'playwright_close_page',
    description: 'Close a browser page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Page ID to close',
        },
      },
      required: ['pageId'],
    },
  },
];

// Helper functions
function validateUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (ALLOWED_DOMAINS.length > 0) {
      const domain = parsedUrl.hostname;
      if (!ALLOWED_DOMAINS.some(allowed => domain.includes(allowed))) {
        throw new Error(`Domain ${domain} is not in allowed domains list`);
      }
    }
    return true;
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

async function getBrowser(browserType = 'chromium') {
  if (!browsers[browserType]) {
    const launchOptions = {
      headless: HEADLESS,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    };

    switch (browserType) {
      case 'chromium':
        browsers.chromium = await chromium.launch(launchOptions);
        break;
      case 'firefox':
        browsers.firefox = await firefox.launch(launchOptions);
        break;
      case 'webkit':
        browsers.webkit = await webkit.launch(launchOptions);
        break;
    }
  }
  return browsers[browserType];
}

// MCP Tool Handlers
server.setRequestHandler('tools/list', async () => {
  return { tools };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'playwright_navigate':
        return await handleNavigate(args);
      case 'playwright_screenshot':
        return await handleScreenshot(args);
      case 'playwright_click':
        return await handleClick(args);
      case 'playwright_type':
        return await handleType(args);
      case 'playwright_wait_for':
        return await handleWaitFor(args);
      case 'playwright_get_content':
        return await handleGetContent(args);
      case 'playwright_evaluate':
        return await handleEvaluate(args);
      case 'playwright_create_page':
        return await handleCreatePage(args);
      case 'playwright_close_page':
        return await handleClosePage(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in ${name}:`, error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});

// Tool implementation functions
async function handleNavigate(args) {
  const { url, browser = 'chromium', timeout = 30000 } = args;

  validateUrl(url);

  const browserInstance = await getBrowser(browser);
  const context = await browserInstance.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (compatible; AI-Advisor-App-Playwright/1.0)',
  });

  const page = await context.newPage();
  const pageId = uuidv4();

  pages.set(pageId, { page, context, browser });
  contexts.set(pageId, context);

  await page.goto(url, { timeout, waitUntil: 'networkidle' });

  return {
    success: true,
    pageId,
    url: page.url(),
    title: await page.title(),
    timestamp: new Date().toISOString(),
  };
}

async function handleScreenshot(args) {
  const { pageId, selector, fullPage = false, format = 'png', quality = 90 } = args;

  if (!pages.has(pageId)) {
    throw new Error(`Page ${pageId} not found`);
  }

  const { page } = pages.get(pageId);

  let screenshot;
  if (selector) {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
    screenshot = await element.screenshot({ type: format, quality });
  } else {
    screenshot = await page.screenshot({
      type: format,
      quality,
      fullPage,
      animations: 'disabled',
    });
  }

  const filename = `screenshot_${pageId}_${Date.now()}.${format}`;
  const filepath = path.join(process.cwd(), 'screenshots', filename);

  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, screenshot);

  return {
    success: true,
    filename,
    filepath,
    size: screenshot.length,
    format,
    timestamp: new Date().toISOString(),
  };
}

async function handleClick(args) {
  const { pageId, selector, timeout = 5000, force = false } = args;

  if (!pages.has(pageId)) {
    throw new Error(`Page ${pageId} not found`);
  }

  const { page } = pages.get(pageId);

  await page.click(selector, { timeout, force });

  return {
    success: true,
    action: 'click',
    selector,
    timestamp: new Date().toISOString(),
  };
}

async function handleType(args) {
  const { pageId, selector, text, delay = 50, clear = true } = args;

  if (!pages.has(pageId)) {
    throw new Error(`Page ${pageId} not found`);
  }

  const { page } = pages.get(pageId);

  if (clear) {
    await page.fill(selector, '');
  }

  await page.type(selector, text, { delay });

  return {
    success: true,
    action: 'type',
    selector,
    text,
    timestamp: new Date().toISOString(),
  };
}

async function handleWaitFor(args) {
  const { pageId, selector, state = 'visible', timeout = 30000 } = args;

  if (!pages.has(pageId)) {
    throw new Error(`Page ${pageId} not found`);
  }

  const { page } = pages.get(pageId);

  if (selector) {
    await page.waitForSelector(selector, { state, timeout });
  } else {
    await page.waitForLoadState('networkidle', { timeout });
  }

  return {
    success: true,
    action: 'wait_for',
    selector,
    state,
    timestamp: new Date().toISOString(),
  };
}

async function handleGetContent(args) {
  const { pageId, selector, attribute, innerText = true, innerHTML = false } = args;

  if (!pages.has(pageId)) {
    throw new Error(`Page ${pageId} not found`);
  }

  const { page } = pages.get(pageId);

  let content;

  if (selector) {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }

    if (attribute) {
      content = await element.getAttribute(attribute);
    } else if (innerText) {
      content = await element.innerText();
    } else if (innerHTML) {
      content = await element.innerHTML();
    } else {
      content = await element.textContent();
    }
  } else {
    if (innerText) {
      content = await page.innerText('body');
    } else if (innerHTML) {
      content = await page.content();
    } else {
      content = await page.title();
    }
  }

  return {
    success: true,
    content,
    selector,
    timestamp: new Date().toISOString(),
  };
}

async function handleEvaluate(args) {
  const { pageId, script, args: evalArgs = [] } = args;

  if (!pages.has(pageId)) {
    throw new Error(`Page ${pageId} not found`);
  }

  const { page } = pages.get(pageId);

  const result = await page.evaluate(script, ...evalArgs);

  return {
    success: true,
    result,
    timestamp: new Date().toISOString(),
  };
}

async function handleCreatePage(args) {
  const { browser = 'chromium', viewport = { width: 1280, height: 720 }, userAgent } = args;

  const browserInstance = await getBrowser(browser);
  const context = await browserInstance.newContext({
    viewport,
    userAgent: userAgent || 'Mozilla/5.0 (compatible; AI-Advisor-App-Playwright/1.0)',
  });

  const page = await context.newPage();
  const pageId = uuidv4();

  pages.set(pageId, { page, context, browser });
  contexts.set(pageId, context);

  return {
    success: true,
    pageId,
    browser,
    viewport,
    timestamp: new Date().toISOString(),
  };
}

async function handleClosePage(args) {
  const { pageId } = args;

  if (!pages.has(pageId)) {
    throw new Error(`Page ${pageId} not found`);
  }

  const { page, context } = pages.get(pageId);

  await page.close();
  await context.close();

  pages.delete(pageId);
  contexts.delete(pageId);

  return {
    success: true,
    action: 'close_page',
    pageId,
    timestamp: new Date().toISOString(),
  };
}

// Express routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activePages: pages.size,
    activeContexts: contexts.size,
    browsers: Object.keys(browsers).filter(key => browsers[key] !== null),
  });
});

app.get('/tools', (req, res) => {
  res.json({ tools });
});

app.post('/tools/call', async (req, res) => {
  try {
    const result = await server.handleRequest({
      jsonrpc: '2.0',
      id: req.body.id || uuidv4(),
      method: 'tools/call',
      params: req.body.params,
    });

    res.json(result);
  } catch (error) {
    console.error('Error handling tool call:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32000,
        message: error.message,
      },
    });
  }
});

// Cleanup function
async function cleanup() {
  console.log('Cleaning up Playwright resources...');

  // Close all pages and contexts
  for (const [pageId, { page, context }] of pages.entries()) {
    await page.close();
    await context.close();
  }

  // Close all browsers
  for (const [browserType, browser] of Object.entries(browsers)) {
    if (browser) {
      await browser.close();
      browsers[browserType] = null;
    }
  }

  pages.clear();
  contexts.clear();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🎭 Playwright MCP Server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🛠️  Tools available: ${tools.length}`);
  console.log(`🌐 Headless mode: ${HEADLESS}`);
  console.log(`🔒 Allowed domains: ${ALLOWED_DOMAINS.join(', ') || 'All'}`);
});

module.exports = app;