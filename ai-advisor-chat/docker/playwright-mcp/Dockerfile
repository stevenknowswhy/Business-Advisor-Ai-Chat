FROM node:18

WORKDIR /app

# Install Playwright MCP and dependencies
RUN npm install -g @playwright/mcp @playwright/test

# Install Playwright browsers and system dependencies
RUN npx playwright install --with-deps

# Expose port for MCP server
EXPOSE 8080

# Create test results directory
RUN mkdir -p /app/test-results

# Start Playwright MCP server
CMD ["npx", "@playwright/mcp", "--port", "8080"]