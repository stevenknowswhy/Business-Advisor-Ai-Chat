# Playwright MCP Server Setup for GLM Models

This guide covers the setup and configuration of the Playwright MCP server for use with GLM models (GLM-4.5, GLM-4.5-Air) in Claude Code.

## Overview

The Playwright MCP server provides browser automation capabilities that can be used by GLM models through Claude Code's MCP integration. This enables AI-powered web scraping, automated testing, screenshot generation, and more.

## Features

### Browser Automation Tools
- **Navigation**: Browse to any URL with timeout and browser selection
- **Screenshot**: Capture full page or element screenshots (PNG/JPEG)
- **Interaction**: Click elements, type text, fill forms
- **Content Extraction**: Get text, HTML, and attributes from pages
- **JavaScript Execution**: Run custom JavaScript in browser context
- **Waiting**: Wait for elements, conditions, or network idle

### Multi-Browser Support
- **Chromium**: Chrome-based browser (default)
- **Firefox**: Mozilla Firefox browser
- **WebKit**: Safari-based browser

### GLM Model Integration
- **Tool Calling**: Structured interface for GLM models
- **Headless Mode**: Optimized for server environments
- **Security**: Domain restrictions and safe browsing
- **Performance**: Resource management and cleanup

## Setup Instructions

### 1. Environment Configuration

The Playwright MCP server is configured through environment variables in `.env.mcp`:

```bash
# Playwright MCP Server Configuration
PLAYWRIGHT_SERVER_PORT=3004
PLAYWRIGHT_HOST=0.0.0.0
HEADLESS=true
ALLOWED_DOMAINS=github.com,localhost,127.0.0.1,example.com
SCREENSHOT_DIR=./screenshots
BROWSER_TIMEOUT=30000
BROWSER_LAUNCH_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage
```

### 2. Start MCP Servers

```bash
./scripts/start-mcp-servers.sh
```

### 3. Test Playwright MCP Server

```bash
./scripts/test-playwright.sh
```

## GLM Model Usage

### Basic Examples

#### Web Scraping
```
Use Playwright MCP to navigate to https://example.com and extract the page title and main content.
```

#### Screenshot Generation
```
Take a screenshot of the navigation bar on https://github.com and save it as a PNG file.
```

#### Form Filling
```
Navigate to a login page, fill in the username and password fields, and take a screenshot before submitting.
```

#### Automated Testing
```
Test the search functionality on a website by searching for "AI tools" and verifying the results contain relevant content.
```

### Advanced Usage

#### JavaScript Execution
```
Execute JavaScript to get all links from the page and filter them by domain.
```

#### Multi-Step Workflows
```
1. Navigate to a product page
2. Click the "Add to Cart" button
3. Wait for the cart to update
4. Take a screenshot of the cart
5. Extract the total price
```

## Available Tools

### Navigation
- `playwright_navigate`: Navigate to URL
- `playwright_create_page`: Create new browser page
- `playwright_close_page`: Close browser page

### Interaction
- `playwright_click`: Click on elements
- `playwright_type`: Type text into inputs
- `playwright_wait_for`: Wait for elements/conditions

### Content
- `playwright_get_content`: Extract text/HTML
- `playwright_screenshot`: Take screenshots
- `playwright_evaluate`: Execute JavaScript

## Security Features

### Domain Restrictions
The server restricts browsing to specified domains for security:
```bash
ALLOWED_DOMAINS=github.com,localhost,127.0.0.1,example.com
```

### Headless Mode
All browsing is done in headless mode for:
- Performance optimization
- Resource efficiency
- Server compatibility

### Safe Browsing
- No popup windows
- No file downloads
- No clipboard access
- No geolocation access

## GLM Model Capabilities

### GLM-4.5
- **Full Support**: All Playwright MCP tools
- **Complex Tasks**: Multi-step workflows
- **Code Generation**: Generate Playwright scripts
- **Error Handling**: Robust error recovery

### GLM-4.5-Air
- **Core Support**: Essential browser automation
- **Fast Execution**: Optimized for speed
- **Simple Tasks**: Navigation, screenshots, basic interactions
- **Resource Efficient**: Lower memory usage

## Configuration Options

### Browser Settings
```bash
# Default browser
BROWSER_TYPE=chromium

# Viewport settings
VIEWPORT_WIDTH=1280
VIEWPORT_HEIGHT=720

# Custom user agent
USER_AGENT=Mozilla/5.0 (compatible; AI-Advisor-App-Playwright/1.0)
```

### Security Settings
```bash
# Allowed domains (comma-separated)
ALLOWED_DOMAINS=github.com,localhost,127.0.0.1

# Timeout settings
NAVIGATION_TIMEOUT=30000
ELEMENT_TIMEOUT=5000
INTERACTION_TIMEOUT=10000
```

### Performance Settings
```bash
# Resource limits
MAX_CONCURRENT_PAGES=10
MEMORY_LIMIT=512mb
CLEANUP_INTERVAL=300000
```

## Testing and Troubleshooting

### Test Script
```bash
./scripts/test-playwright.sh
```

### Common Issues
1. **Server not starting**: Check Docker logs with `docker logs mcp-playwright-server`
2. **Navigation timeout**: Increase timeout values in environment configuration
3. **Element not found**: Use proper CSS selectors and wait conditions
4. **Screenshot fails**: Check file permissions and disk space

### Debug Mode
Enable debug logging:
```bash
LOG_LEVEL=debug
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Code   │    │   MCP Proxy     │    │   Playwright    │
│                 │    │    (Nginx)      │    │      MCP        │
│  ┌─────────────┐│    │                 │    │                 │
│  │    GLM      ││◄──►│                 │◄──►│  ┌─────────────┐│
│  │   Models    ││    │                 │    │  │  Browsers    ││
│  │(4.5/4.5-Air)││    │                 │    │  │             ││
│  └─────────────┘│    │                 │    │  │ Chromium    ││
│                 │    │                 │    │  │ Firefox     ││
│  ┌─────────────┐│    │                 │    │  │ WebKit      ││
│  │  MCP Tools  ││◄──►│                 │◄──►│  └─────────────┘│
│  └─────────────┘│    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Performance Considerations

### Resource Usage
- **Memory**: ~512MB per browser instance
- **CPU**: Moderate during page loading
- **Disk**: Screenshots stored locally
- **Network: Dependent on target websites

### Optimization Tips
- Use appropriate timeouts
- Close pages when done
- Limit concurrent operations
- Use efficient selectors
- Cache screenshots when possible

## Integration with AI Advisor App

The Playwright MCP server integrates seamlessly with the AI Advisor App's existing MCP infrastructure:

- **Unified Proxy**: Single entry point through Nginx
- **Shared Monitoring**: Prometheus and Grafana integration
- **Environment Management**: Centralized configuration
- **Security**: Consistent security policies
- **Logging**: Structured logging and monitoring

## Future Enhancements

### Planned Features
- **Visual Testing**: Image comparison and diffing
- **PDF Generation**: Convert pages to PDF
- **Network Monitoring**: Capture network requests
- **Performance Metrics**: Page load timing analysis
- **Mobile Testing**: Mobile device emulation

### Extensions
- **API Testing**: REST API automation
- **Web Scraping**: Advanced data extraction
- **Form Automation**: Complex form workflows
- **E-commerce**: Shopping and checkout flows

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs: `docker logs mcp-playwright-server`
3. Test with: `./scripts/test-playwright.sh`
4. Verify environment configuration

The Playwright MCP server is now ready for use with GLM models in Claude Code!