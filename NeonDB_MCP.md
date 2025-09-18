Connect MCP Clients to Neon
Learn how to connect MCP clients such as Cursor, Claude Desktop, Cline, Windsurf, Zed, and VS Code to your Neon Postgres database.

The Neon MCP Server allows you to connect various 
Model Context Protocol (MCP)
 compatible AI tools to your Neon Postgres databases. This guide provides instructions for connecting popular MCP clients to the Neon MCP Server, enabling natural language interaction with your Neon projects.

This guide covers the setup for the following MCP Clients:

Claude Desktop
Claude Code
Cursor
Windsurf (Codeium)
Cline (VS Code extension)
Zed
VS Code (with GitHub Copilot)
By connecting these tools to the Neon MCP Server, you can manage your Neon projects, databases, and schemas using natural language commands within the MCP client interface.

Neon MCP Server Security Considerations
The Neon MCP Server grants powerful database management capabilities through natural language requests. Always review and authorize actions requested by the LLM before execution. Ensure that only authorized users and applications have access to the Neon MCP Server.

The Neon MCP Server is intended for local development and IDE integrations only. We do not recommend using the Neon MCP Server in production environments. It can execute powerful operations that may lead to accidental or unauthorized changes.

For more information, see MCP security guidance →.

Prerequisites
An MCP Client application.
A Neon account.
Node.js (>= v18.0.0) and npm: Download from nodejs.org.
For Local MCP Server setup, you also need a Neon API key. See Neon API Keys documentation.

note
Ensure you are using the latest version of your chosen MCP client as MCP integration may not be available in older versions. If you are using an older version, update your MCP client to the latest version.

Connect to Neon MCP Server
You can connect to Neon MCP Server in two ways:

Remote MCP Server (Preview): Connect to Neon's managed remote MCP server using OAuth or a Neon API key.
Local MCP Server: Install and run the Neon MCP server locally, using a Neon API key.
Claude Desktop
Remote MCP Server
Local MCP Server
Open Claude desktop and navigate to Settings.

Under the Developer tab, click Edit Config (On Windows, it's under File -> Settings -> Developer -> Edit Config) to open the configuration file (claude_desktop_config.json).

Add the "Neon" server entry within the mcpServers object:

{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    }
  }
}
To use SSE instead of streamable HTTP responses, you can specify the https://mcp.neon.tech/sse endpoint instead of https://mcp.neon.tech/mcp.

Save the configuration file and restart Claude Desktop.

An OAuth window will open in your browser. Follow the prompts to authorize Claude Desktop to access your Neon account.

By default, the Remote MCP Server connects to your personal Neon account. To connect to an organization's account, you must authenticate with an API key. For more information, see API key-based authentication.

For more, see Get started with Neon MCP server with Claude Desktop.

Claude Code
Remote MCP Server
Local MCP Server
Ensure you have Claude Code installed. Visit docs.anthropic.com/en/docs/claude-code for installation instructions.
Open terminal and add Neon MCP with
claude mcp add --transport http neon https://mcp.neon.tech/mcp
Start a new session of claude to trigger OAuth authentication flow
You can also trigger authentication with /mcp within Claude Code.

If you prefer to authenticate using a Neon API key, provide Authorization header to mcp add command:

claude mcp add --transport http neon https://mcp.neon.tech/mcp \
    --header "Authorization: Bearer <YOUR_NEON_API_KEY>"
Replace <YOUR_NEON_API_KEY> with your actual Neon API key which you obtained from the prerequisites section

Cursor
Remote MCP Server
Local MCP Server
Quick Install (Recommended)
Click the button below to install the Neon MCP server in Cursor. When prompted, click Install within Cursor.

Add Neon MCP server to Cursor
Manual Setup
Open Cursor. Create a .cursor directory in your project root if needed.

Create or open the mcp.json file in the .cursor directory.

Add the "Neon" server entry within the mcpServers object:

{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    }
  }
}
To use SSE instead of streamable HTTP responses, you can specify the https://mcp.neon.tech/sse endpoint instead of https://mcp.neon.tech/mcp.

Save the configuration file. Cursor may detect the change or require a restart.

An OAuth window will open in your browser. Follow the prompts to authorize Cursor to access your Neon account.

By default, the Remote MCP Server connects to your personal Neon account. To connect to an organization's account, you must authenticate with an API key. For more information, see API key-based authentication.

For more, see Get started with Cursor and Neon Postgres MCP Server.

Windsurf (Codeium)
Remote MCP Server
Local MCP Server
Open Windsurf and navigate to the Cascade assistant sidebar.

Click the hammer (MCP) icon, then Configure which opens up the "Manage MCPs" configuration file.

Click on "View raw config" to open the raw configuration file in Windsurf.

Add the "Neon" server entry within the mcpServers object:

{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    }
  }
}
To use SSE instead of streamable HTTP responses, you can specify the https://mcp.neon.tech/sse endpoint instead of https://mcp.neon.tech/mcp.

Save the file.

Click the Refresh button in the Cascade sidebar next to "available MCP servers".

An OAuth window will open in your browser. Follow the prompts to authorize Windsurf to access your Neon account.

By default, the Remote MCP Server connects to your personal Neon account. To connect to an organization's account, you must authenticate with an API key. For more information, see API key-based authentication.

For more, see Get started with Windsurf and Neon Postgres MCP Server.

Cline (VS Code Extension)
Remote MCP Server
Local MCP Server
Open Cline in VS Code (Sidebar -> Cline icon).
Click MCP Servers Icon -> Installed -> Configure MCP Servers to open the configuration file.
Add the "Neon" server entry within the mcpServers object:
{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/sse"]
    }
  }
}
For streamable HTTP responses instead of SSE, you can specify the https://mcp.neon.tech/mcp endpoint instead of https://mcp.neon.tech/sse.

Save the file. Cline should reload the configuration automatically.
An OAuth window will open in your browser. Follow the prompts to authorize Cline to access your Neon account.
By default, the Remote MCP Server connects to your personal Neon account. To connect to an organization's account, you must authenticate with an API key. For more information, see API key-based authentication.

For more, see Get started with Cline and Neon Postgres MCP Server.

Zed
note
MCP support in Zed is currently in preview. Ensure you're using the Preview version of Zed to add MCP servers (called Context Servers in Zed). Download the preview version from zed.dev/releases/preview.

Remote MCP Server
Local MCP Server
Open the Zed Preview application.

Click the Assistant (✨) icon in the bottom right corner.

Click Settings in the top right panel of the Assistant.

In the Context Servers section, click + Add Context Server.

Configure the Neon Server:

Enter Neon in the Name field.

In the Command field, enter:

npx -y mcp-remote https://mcp.neon.tech/sse
Click Add Server.

For streamable HTTP responses instead of SSE, you can specify the https://mcp.neon.tech/mcp endpoint instead of https://mcp.neon.tech/sse.

An OAuth window will open in your browser. Follow the prompts to authorize Zed to access your Neon account.

Check the Context Servers section in Zed settings to ensure the connection is successful. "Neon" should be listed.

By default, the Remote MCP Server connects to your personal Neon account. To connect to an organization's account, you must authenticate with an API key. For more information, see API key-based authentication.

For more details, including workflow examples and troubleshooting, see Get started with Zed and Neon Postgres MCP Server.

VS Code (with GitHub Copilot)
note
To use MCP servers with VS Code, you need GitHub Copilot and GitHub Copilot Chat extensions installed

Remote MCP Server
Local MCP Server
Open VS Code.

Create a .vscode folder in your project's root directory if it doesn't exist.

Create or open the mcp.json file in the .vscode directory and add the following configuration into the file (if you have other MCP servers configured, add the "Neon" server entry within the servers object):

{
  "servers": {
    "Neon": {
      "url": "https://mcp.neon.tech/mcp",
      "type": "http"
    }
  },
  "inputs": []
}
For streamable HTTP responses instead of SSE, you can specify the https://mcp.neon.tech/mcp endpoint instead of https://mcp.neon.tech/sse.

Save the mcp.json file.

Click on Start on the MCP server.

An OAuth window will open in your browser. Follow the prompts to authorize VS Code (GitHub Copilot) to access your Neon account.

Once authorized, you can now open GitHub Copilot Chat in VS Code and switch to Agent mode. You will see the Neon MCP Server listed among the available tools.

By default, the Remote MCP Server connects to your personal Neon account. To connect to an organization's account, you must authenticate with an API key. For more information, see API key-based authentication.

For detailed instructions on utilizing the Neon MCP server with GitHub Copilot in VS Code, including a step-by-step example on generating an Azure Function REST API, refer to How to Use Neon MCP Server with GitHub Copilot in VS Code.

Other MCP clients
Adapt the instructions above for other clients:

Remote MCP server: Add the following JSON configuration within the mcpServers section of your client's MCP configuration file:

By default, the Remote MCP Server connects to your personal Neon account. To connect to an organization's account, you must authenticate with an API key. If your client supports it, provide the key in the Authorization header. For more information, see API key-based authentication.

"neon": {
  "command": "npx",
  "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
}
MCP supports two remote server transports: the deprecated Server-Sent Events (SSE) and the newer, recommended Streamable HTTP. If your LLM client doesn't support Streamable HTTP yet, you can switch the endpoint from https://mcp.neon.tech/mcp to https://mcp.neon.tech/sse to use SSE instead.

Then follow the OAuth flow on first connection.

Local MCP server:

Add the following JSON configuration within the mcpServers section of your client's MCP configuration file, replacing <YOUR_NEON_API_KEY> with your actual Neon API key obtained from the prerequisites section:

MacOS/Linux
Windows
Windows (WSL)
For MacOS and Linux, add the following JSON configuration within the mcpServers section of your client's mcp_config file, replacing <YOUR_NEON_API_KEY> with your actual Neon API key:

"neon": {
  "command": "npx",
  "args": ["-y", "@neondatabase/mcp-server-neon", "start", "<YOUR_NEON_API_KEY>"]
}
note
After successful configuration, you should see the Neon MCP Server listed as active in your MCP client's settings or tool list. You can enter "List my Neon projects" in the MCP client to see your Neon projects and verify the connection.

Troubleshooting
Configuration Issues
If your client does not use JSON for configuration of MCP servers (such as older versions of Cursor), you can use the following command when prompted:

# For Remote MCP server
npx -y mcp-remote https://mcp.neon.tech/mcp
# For Local MCP server
npx -y @neondatabase/mcp-server-neon start <YOUR_NEON_API_KEY>
OAuth Authentication Errors
When using the remote MCP server with OAuth authentication, you might encounter the following error:

{"code":"invalid_request","error":"invalid redirect uri"}
This typically occurs when there are issues with cached OAuth credentials. To resolve this:

Remove the MCP authentication cache directory:
rm -rf ~/.mcp-auth
Restart your MCP client application
The OAuth flow will start fresh, allowing you to properly authenticate
This error is most common when using the remote MCP server option and can occur after OAuth configuration changes or when cached credentials become invalid.

Supported actions (tools)
The Neon MCP Server provides the following actions, which are exposed as "tools" to MCP Clients. You can use these tools to interact with your Neon projects and databases using natural language commands.

Project management:

list_projects: Retrieves a list of your Neon projects, providing a summary of each project associated with your Neon account. Supports a search parameter and limiting the number of projects returned (default: 10).
list_shared_projects: Retrieves a list of Neon projects shared with the current user. Supports a search parameter and limiting the number of projects returned (default: 10).
describe_project: Fetches detailed information about a specific Neon project, including its ID, name, and associated branches and databases.
create_project: Creates a new Neon project in your Neon account. A project acts as a container for branches, databases, roles, and computes.
delete_project: Deletes an existing Neon project and all its associated resources.
list_organizations: Lists all organizations that the current user has access to. Optionally filter by organization name or ID using the search parameter.
Branch management:

create_branch: Creates a new branch within a specified Neon project. Leverages Neon's branching feature for development, testing, or migrations.
delete_branch: Deletes an existing branch from a Neon project.
describe_branch: Retrieves details about a specific branch, such as its name, ID, and parent branch.
list_branch_computes: Lists compute endpoints for a project or specific branch, including compute ID, type, size, and autoscaling information.
reset_from_parent: Resets the current branch to its parent's state, discarding local changes. Automatically preserves to backup if branch has children, or optionally on request.
SQL query execution:

get_connection_string: Returns your database connection string.
run_sql: Executes a single SQL query against a specified Neon database. Supports both read and write operations.
run_sql_transaction: Executes a series of SQL queries within a single transaction against a Neon database.
get_database_tables: Lists all tables within a specified Neon database.
describe_table_schema: Retrieves the schema definition of a specific table, detailing columns, data types, and constraints.
list_slow_queries: Identifies performance bottlenecks by finding the slowest queries in a database. Requires the pg_stat_statements extension.
Database migrations (schema changes):

prepare_database_migration: Initiates a database migration process. Critically, it creates a temporary branch to apply and test the migration safely before affecting the main branch.
complete_database_migration: Finalizes and applies a prepared database migration to the main branch. This action merges changes from the temporary migration branch and cleans up temporary resources.
Query performance tuning:

explain_sql_statement: Analyzes a SQL query and returns detailed execution plan information to help understand query performance.
prepare_query_tuning: Identifies potential performance issues in a SQL query and suggests optimizations. Creates a temporary branch for testing improvements.
complete_query_tuning: Finalizes and applies query optimizations after testing. Merges changes from the temporary tuning branch to the main branch.
Neon Auth:

provision_neon_auth: Provisions Neon Auth for a Neon project. Sets up authentication infrastructure by creating an integration with Stack Auth (@stackframe/stack).
Usage examples
After setting up either the remote or local server and connecting your MCP client, you can start interacting with your Neon databases using natural language.

Example interactions

List projects: "List my Neon projects"
Create a new project: "Create a Neon project named 'my-test-project'"
List tables in a database: "What tables are in the database 'my-database' in project 'my-project'?"
Add a column to a table: "Add a column 'email' of type VARCHAR to the 'users' table in database 'main' of project 'my-project'"
Run a query: "Show me the first 10 rows from the 'users' table in database 'my-database'"

You can also refer to our individual guides for detailed examples on using the Neon MCP Server with specific MCP clients:

Claude Desktop
Claude Code
Cursor
Cline
Windsurf (Codium)
Zed
API key-based authentication
The Neon MCP Server supports API key-based authentication for remote access, in addition to OAuth. This allows for simpler authentication using your Neon API key (personal or organization) for programmatic access. API key configuration is shown below:

{
  "mcpServers": {
    "Neon": {
      "url": "https://mcp.neon.tech/mcp",
      "headers": {
        "Authorization": "Bearer <$NEON_API_KEY>"
      }
    }
  }
}
Currently, only streamable HTTP responses are supported with API-key based authentication. Server-Sent Events (SSE) responses are not yet supported for this authentication method.

Streamable HTTP support
The Neon MCP Server supports streamable HTTP as an alternative to Server-Sent Events (SSE) for streaming responses. This makes it easier to consume streamed data in environments where SSE is not ideal — such as CLI tools, backend services, or AI agents. To use streamable HTTP, make sure to use the latest remote MCP server, and specify the https://mcp.neon.tech/mcp endpoint, as shown in the following configuration example:

{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    }
  }
}
MCP security guidance
The Neon MCP server provides access to powerful tools for interacting with your Neon database—such as run_sql, create_table, update_row, and delete_table. MCP tools are useful in development and testing, but we do not recommend using MCP tools in production environments.

Recommended usage
Use MCP only for local development or IDE-based workflows.
Never connect MCP agents to production databases.
Avoid exposing production data or PII data to MCP — only use anonymized data.
Disable MCP tools capable of accessing or modifying data when they are not being used.
Only grant MCP access to trusted users.
Human oversight and access control
Always review and authorize actions requested by the LLM before execution. The MCP server grants powerful database management capabilities through natural language requests, so human oversight is essential.
Restrict access to ensure that only authorized users and applications have access to the Neon MCP Server and associated API keys.
Monitor usage and regularly audit who has access to your MCP server configurations and Neon API keys.
By following these guidelines, you reduce the risk of accidental or unauthorized actions when working with Neon's MCP Server.

Conclusion
The Neon MCP Server enables natural language interaction with Neon Postgres databases, offering a simplified way to perform database management tasks. You can perform actions such as creating new Neon projects and databases, managing branches, executing SQL queries, and making schema changes, all through conversational requests. Features like branch-based migrations contribute to safer schema modifications. By connecting your preferred MCP client to the Neon MCP Server, you can streamline database administration and development workflows, making it easier for users with varying technical backgrounds to interact with Neon databases.

