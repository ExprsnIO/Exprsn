# Exprsn DBAdmin (exprsn-dbadmin)

**Version:** 1.0.0
**Port:** 3021
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn DBAdmin** is a web-based database administration tool that provides a user-friendly interface for managing PostgreSQL databases across all Exprsn services.

---

## Key Features

### Database Management
- **Multi-Database** - Manage all service databases
- **Visual Query Builder** - Build queries without SQL
- **SQL Editor** - Syntax-highlighted SQL editor
- **Query History** - Track executed queries
- **Export Data** - CSV, JSON, SQL exports

### Schema Management
- **Table Designer** - Visual table creation
- **Index Management** - Create and manage indexes
- **Foreign Keys** - Relationship management
- **Migrations** - Track schema changes
- **ER Diagrams** - Visual schema representation

### Data Management
- **Browse Tables** - View table data
- **Edit Records** - Inline record editing
- **Bulk Operations** - Mass updates/deletes
- **Search** - Full-text search
- **Filtering** - Advanced filtering

### Administration
- **User Management** - Database users and roles
- **Permissions** - Grant/revoke permissions
- **Backup/Restore** - Database backups
- **Performance** - Query performance analysis
- **Monitoring** - Database health monitoring

---

## API Endpoints

#### `GET /api/databases`
List all databases.

**Response:**
```json
{
  "success": true,
  "data": {
    "databases": [
      {
        "name": "exprsn_ca",
        "size": "124 MB",
        "tables": 15,
        "status": "online"
      },
      {
        "name": "exprsn_timeline",
        "size": "2.4 GB",
        "tables": 28,
        "status": "online"
      }
    ]
  }
}
```

#### `GET /api/databases/:name/tables`
List tables in database.

#### `POST /api/query`
Execute SQL query.

**Request:**
```json
{
  "database": "exprsn_timeline",
  "query": "SELECT * FROM posts WHERE user_id = $1 LIMIT 10",
  "params": ["user-uuid"]
}
```

#### `GET /api/databases/:name/schema`
Get database schema.

#### `POST /api/databases/:name/backup`
Create database backup.

---

## Configuration

```env
PORT=3021
SERVICE_NAME=exprsn-dbadmin

# Master DB Connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password

# Security
ADMIN_USERS=admin-user-uuid
READ_ONLY_MODE=false
ALLOW_DANGEROUS_QUERIES=false

# Query Limits
MAX_QUERY_ROWS=10000
QUERY_TIMEOUT_MS=30000
MAX_EXPORT_ROWS=100000
```

---

## Web Interface

Access the web interface at: `http://localhost:3021`

### Features
- **Database Explorer** - Browse all databases and tables
- **SQL Editor** - Write and execute queries
- **Data Grid** - View and edit table data
- **Query Builder** - Visual query construction
- **Schema Designer** - Design database schemas
- **Import/Export** - Data import and export tools

---

## Security

### Access Control
- **Role-Based Access** - Admin, developer, read-only roles
- **IP Whitelisting** - Restrict access by IP
- **Audit Logging** - Track all database operations
- **Query Restrictions** - Limit dangerous operations
- **Read-Only Mode** - Prevent data modifications

### Best Practices
1. **Use strong passwords** for database users
2. **Enable audit logging** for compliance
3. **Restrict production access** to authorized users only
4. **Enable read-only mode** for production databases when possible
5. **Regular backups** before making schema changes

---

## Usage Examples

### Execute Query via API

```javascript
const axios = require('axios');

async function runQuery(token) {
  const response = await axios.post(
    'http://localhost:3021/api/query',
    {
      database: 'exprsn_timeline',
      query: 'SELECT COUNT(*) FROM posts WHERE created_at > $1',
      params: ['2024-01-01']
    },
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  return response.data.data.rows;
}
```

### Export Data

```javascript
async function exportTable(database, table, format, token) {
  const response = await axios.get(
    `http://localhost:3021/api/databases/${database}/tables/${table}/export`,
    {
      params: { format }, // csv, json, sql
      headers: { 'Authorization': `Bearer ${token}` },
      responseType: 'blob'
    }
  );

  return response.data;
}
```

---

## Development

```bash
cd src/exprsn-dbadmin
npm install
npm run dev

# Access web interface
open http://localhost:3021
```

---

## Monitoring

### Key Metrics
- **Active Connections** - Current database connections
- **Query Performance** - Average query execution time
- **Database Size** - Storage usage per database
- **Table Growth** - Table size over time
- **Query Frequency** - Most executed queries

---

## Dependencies

- **express** (^4.18.2)
- **pg** (^8.11.3) - PostgreSQL client
- **sequelize** (^6.35.2)
- **monaco-editor** - SQL editor
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT

---

## Security Warning

⚠️ **Important:** DBAdmin provides direct database access. In production:
- Enable authentication and authorization
- Use read-only mode for non-admin users
- Restrict network access
- Enable audit logging
- Regular security audits
