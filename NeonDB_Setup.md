Neon Local Connect Extension
Develop with Neon using Neon Local Connect in VS Code, Cursor, Windsurf, and other editors

The Neon Local Connect extension lets you connect to any Neon branch using a familiar localhost connection string. Available for VS Code, Cursor, Windsurf, and other VS Code-compatible editors, the underlying Neon Local service handles the routing, authentication, and branch management behind the scenes. Your app connects to localhost:5432 like a local Postgres instance, but Neon Local routes traffic to your actual Neon branch in the cloud.

You can use this connection string in your app:

DATABASE_URL="postgres://neon:npg@localhost:5432/<database_name>"
Switch branches, and your app keeps using the same connection string.

What you can do
With the Neon Local Connect extension, you can:

Instantly connect to any Neon branch using a single, static localhost connection string
Create, switch, or reset branches directly from the extension panel
Automate ephemeral branch creation and cleanup, no scripts required
Browse your database schema with an intuitive tree view showing databases, schemas, tables, columns, and relationships
Write and execute SQL queries with syntax highlighting, results display, and export capabilities
View, edit, insert, and delete table data with a spreadsheet-like interface without leaving your IDE
Launch a psql shell in your integrated terminal for direct SQL access
All without leaving your editor.
Learn more about branching in Neon and Neon Local.

Requirements
Docker Desktop installed and running
VS Code 1.85.0+, Cursor, Windsurf, or other VS Code-compatible editor
A Neon account and API key (for ephemeral branches only; you can also create new keys from the extension)
Install the extension
The Neon Local Connect extension is available on both marketplaces:

For VS Code:

Open the Neon Local Connect extension page in the VS Code Marketplace.
Click Install.
For Cursor, Windsurf, and other VS Code-compatible editors:

Open the Neon Local Connect extension page in the OpenVSX Registry.
Click Install or follow your editor's extension installation process.
Sign in to Neon
Open the Neon Local Connect panel in the VS Code sidebar and click Sign in.

Sign in with your Neon account

Authenticate with Neon in your browser when prompted.

Neon OAuth authorization in browser

Connect to a branch
You'll need to make a few selections — organization, project, and then branch — before connecting. If you're new to Neon, this reflects our object hierarchy: organizations contain projects, and projects contain branches. Learn more about how Neon organizes your data.

You can connect to two types of branches:

Existing branch:
For ongoing development, features, or team collaboration. The branch remains available until you delete it. Use this when you want to keep your changes and collaborate with others.

Ephemeral branch:
For temporary, disposable environments (tests, CI, experiments). The extension creates the branch when you connect and deletes it automatically when you disconnect—no manual cleanup required. In CI or CLI workflows, you’d have to script this yourself. The extension does it for you.

As part of choosing your connection, you'll also be asked to choose driver type: PostgreSQL for most Postgres connections, or Neon serverless for edge/HTTP. Read more about connection types.

Existing branch
Ephemeral branch
Connect to an existing branch (e.g., main, development, or a feature branch):

Existing branch connected

note
Selecting an ephemeral branch will prompt you to create and import API key for authentication.

Create a new branch
Or you can create a new persistent branch for feature development, bug fixes, or collaborative work:

Select your organization and project
Click Create new branch... in the branch dropdown
Enter a descriptive branch name (e.g., feature/user-authentication, bugfix/login-validation)
Choose the parent branch you want to branch from (e.g., production, development)
The extension creates the new branch and connects you immediately. This branch persists until you manually delete it.

Use the static connection string
After connecting, find your local connection string in the extension panel. Copy it, update with your database name, and add it to your app’s .env or config.

Local connection details

DATABASE_URL="postgres://neon:npg@localhost:5432/<database_name>"
Your app connects to localhost:5432, while the Neon Local service routes the traffic to your actual Neon branch in the cloud.

You only need to set this connection string once, no matter how many times you create, switch, or reset branches. Neon Local handles all the routing behind the scenes, so you never have to update your app config again.

Start developing
Your application now connects to localhost:5432 using the driver you selected in the extension (Postgres or Neon serverless). See the quickstart for your language or framework for more details.

Framework quickstarts
Language quickstarts
Database schema view
Once connected, the extension provides a comprehensive Database Schema view in the sidebar that lets you explore your database structure visually:

Database Schema View

What you can see:
Databases: All available databases in your connected branch
Schemas: Database schemas organized in a tree structure
Tables & Views: All tables and views with their column definitions
Data Types: Column data types, constraints, and relationships
Primary Keys: Clearly marked primary key columns
Foreign Keys: Visual indicators for foreign key relationships
What you can do
Right-click any table to access quick actions:
Query Table: Opens a pre-filled SELECT * query in the SQL Editor
View Table Data: Opens the table data in an editable spreadsheet view
Truncate Table: Remove all rows from a table
Drop Table: Delete the table entirely
Right-click databases to launch a psql shell for that specific database
Refresh the schema view to see the latest structural changes
Expand/collapse database objects to focus on what you need
The schema view automatically updates when you switch between branches, so you always see the current state of your connected database.

Built-in SQL Editor
Execute SQL queries directly in your IDE with the integrated SQL Editor:

SQL Editor in your IDE

Features:
Query Execution: Run queries with Ctrl+Enter or the Execute button
Results Display: View query results in a tabular format with:
Column sorting and filtering
Export to CSV/JSON formats
Performance statistics (execution time, rows affected, etc.)
Error highlighting with detailed messages
Database Context: Automatically connects to the selected database
How to use:
From Schema View: Right-click any table and select "Query Table" for a pre-filled SELECT query
From Actions Panel: Click "Open SQL Editor" to start with a blank query
From Command Palette: Use Ctrl+Shift+P and search for "Neon: Open SQL Editor"
The SQL Editor integrates seamlessly with your database connection, so you can query any database in your current branch without additional setup.

Table data management
View and edit your table data with a powerful, spreadsheet-like interface:

Table Data Editor

Viewing data:
Paginated Display: Navigate through large datasets with page controls
Column Management: Show/hide columns, sort by any column
Data Types: Visual indicators for different data types (primary keys, foreign keys, etc.)
Null Handling: Clear visualization of NULL values
Editing capabilities:
Row Editing: Click the pen (edit) icon next to any row to edit all fields inline (requires primary key)
Insert New Rows: Add new records with the "Add Row" button
Delete Rows: Remove records with confirmation dialogs (requires primary key)
Batch Operations: Edit multiple fields before saving changes
Data Validation: Real-time validation based on column types and constraints
Note: Row editing and deletion require tables to have a primary key defined. This ensures data integrity by uniquely identifying rows for safe updates.

How to access:
From Schema View: Right-click any table and select "View Table Data"
The data opens in a new tab with full editing capabilities
Changes are immediately applied to your database
Use the refresh button to see updates from other sources
Perfect for quick data inspection, testing, and small data modifications without writing SQL.

Available commands
You can run any command by opening the Command Palette (Cmd+Shift+P or Ctrl+Shift+P) and typing “Neon Local Connect: ...”.

All commands below are available under the “Neon Local Connect:” prefix in the Command Palette.

Command	Description
Import API Key	Import your Neon API key for authentication.
Launch PSQL	Open a psql shell in your integrated terminal for direct SQL access.
Open SQL Editor	Launch the Neon SQL Editor in your browser for advanced queries and data inspection.
Open Table View	Browse your database schema and data in the Neon Console.
Disconnect	Stop the local proxy connection.
Clear Authentication	Remove stored authentication tokens.
Panel actions
Once connected, the Neon Local Connect panel provides quick access to common database operations:

Branch management:
Reset from Parent Branch: Instantly revert your branch to match the current state of its parent. Learn more about branch reset in Docs: Branch Reset. To reset a branch, right-click the branch in the Database Schema view and select Reset from Parent Branch from the context menu.Reset Branch
Database tools (available in the main panel):
Open SQL Editor: Launch the Neon SQL Editor in your browser for advanced queries
Open Table View: Browse your database schema and data in the Neon Console
Launch PSQL: Open a psql shell in the integrated terminal for direct SQL access
Built-in database tools (new in your IDE):
Database Schema View: Explore your database structure in the sidebar with expandable tree view
Built-in SQL Editor: Write and execute queries directly in your IDE with results display
Table Data Editor: View and edit table data with a spreadsheet-like interface
Context Menus: Right-click databases, tables, and views for quick actions like querying and data management
Connect to your database

Branch
production
default
Compute
Primary
Active
Database
neondb
Role
Reset password
neondb_owner
psql

Connection pooling
connection string
passwordless auth
psql 'postgresql://neondb_owner:npg_N8txfkj1APlC@ep-dawn-moon-af63md08-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

Data API
Access your database through auto-generated REST API endpoints.
REST API Endpoint
https://ep-dawn-moon-af63md08.apirest.c-2.us-west-2.aws.neon.tech/neondb/rest/v1

Provides read-write access to tables without Row Level Security enabled.
To read and write data with the Data API, set up authentication and RLS policies.
Authentication providers
Neon Auth Overview

JKWS URL
https://api.stack-auth.com/api/v1/projects/9229aaa4-65d1-4b39-b2eb-4fbc2e7621c5/.well-known/jwks.json

Branch Overview
production
default

Create child branch 1/10

Protect

More
ID
br-aged-band-afzjb37i

Created on
2025-09-06 13:48:33 -07:00
Compute hours
0 h
Data size
-
Created by
Stefano
Computes
Roles & Databases
Child branches
Primary
ACTIVE
ep-dawn-moon-af63md08

Started
Sep 6, 2025 1:48 pm
Size
.25 ↔ 2 CU

Roles

Add role
Manage the Postgres roles on this branch. For more information, see Manage roles.
Name	Owns	Created	Last updated	
neondb_owner	neondb	Sep 6, 2025 1:48 pm	Sep 6, 2025 1:48 pm	

authenticator	-	Sep 6, 2025 1:51 pm	Sep 6, 2025 1:51 pm	

anonymous	-	Sep 6, 2025 1:51 pm	Sep 6, 2025 1:51 pm	

authenticated	-	Sep 6, 2025 1:51 pm	Sep 6, 2025 1:51 pm	

Databases

Add database
Manage the Postgres databases on this branch. For more information, see Manage databases.
neondb
Owner
neondb_owner
Created
Sep 6, 2025 1:48 pm
Last updated
Sep 6, 2025 1:48 pm
Project Settings
General
Project name
BusinessAdvisorAiChat
Project ID
muddy-truth-35500661