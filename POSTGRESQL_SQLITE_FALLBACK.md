# PostgreSQL to SQLite Fallback Implementation Guide

## Overview

This guide explains how to implement automatic PostgreSQL-to-SQLite failover across all Exprsn services, ensuring development environments remain functional even when PostgreSQL is unavailable.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Service Startup                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Try PostgreSQL       │
         │  (5 second timeout)   │
         └───────┬───────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ✅ Success         ❌ Failed
        │                 │
        │                 ▼
        │     ┌──────────────────────┐
        │     │  Fallback to SQLite  │
        │     │  (development only)  │
        │     └──────────┬───────────┘
        │                │
        │                ▼
        │     ┌──────────────────────┐
        │     │  Background Recovery │
        │     │  (retry PostgreSQL)  │
        │     └──────────────────────┘
        │
        ▼
┌────────────────────────────────┐
│  Service Running               │
│  ✓ PostgreSQL (full features)  │
│  ⚠ SQLite (limited features)   │
└────────────────────────────────┘
```

## Implementation Steps

### Step 1: Install Dependencies

```bash
# SQLite driver for Sequelize
npm install sqlite3

# Already installed: sequelize, pg
```

### Step 2: Update Service Models

For each service, update the models/index.js file to use resilient connection:

#### Example: CA Service

**Before** (`src/exprsn-ca/models/index.js`):
```javascript
const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    // ... other options
  }
);
```

**After** (use the resilient version):
```javascript
const { createResilientConnection } = require('../../shared/database/resilientConnection');
const config = require('../config');

async function initializeDatabase() {
  const dbConnection = await createResilientConnection({
    serviceName: 'exprsn-ca',

    primary: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      username: config.database.username,
      password: config.database.password,
      pool: config.database.pool,
      ssl: config.database.ssl,
      logging: config.database.logging
    },

    fallback: {
      storageDir: './data/sqlite',
      logging: false
    },

    options: {
      allowSQLiteFallback: process.env.NODE_ENV !== 'production',
      autoReconnect: true,
      maxRetries: 5,
      retryDelay: 2000
    }
  });

  return dbConnection.getSequelize();
}

const sequelize = await initializeDatabase();
```

### Step 3: Update Environment Variables

Add SQLite configuration to `.env`:

```bash
# PostgreSQL Configuration (primary)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_ca
DB_USER=postgres
DB_PASSWORD=your_password

# SQLite Fallback Configuration
SQLITE_FALLBACK=true
SQLITE_DIR=./data/sqlite

# Connection Resilience
DB_AUTO_RECONNECT=true
DB_MAX_RETRIES=5
DB_RETRY_DELAY=2000
DB_HEALTH_CHECK_INTERVAL=30000
```

### Step 4: Update Migrations for Compatibility

Use the migration helper for cross-database migrations:

```javascript
const {
  getDialectTypes,
  createTableSafe,
  addIndexSafe,
  isPostgreSQL
} = require('../../shared/database/migrationHelper');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const types = getDialectTypes(queryInterface, Sequelize);

    await createTableSafe(queryInterface, 'users', {
      id: {
        type: types.UUID,
        defaultValue: isPostgreSQL(queryInterface)
          ? Sequelize.literal('uuid_generate_v4()')
          : Sequelize.literal('(/* SQLite UUID function */)'),
        primaryKey: true
      },
      metadata: {
        type: types.JSONB,  // Auto-converts to JSON for SQLite
        defaultValue: {}
      },
      tags: {
        type: types.ARRAY_STRING,  // Auto-converts to TEXT for SQLite
        defaultValue: isPostgreSQL(queryInterface) ? [] : '[]'
      }
      // ... other fields
    });
  }
};
```

### Step 5: Service-Specific Updates

Apply to each service that uses a database:

#### Services Requiring Updates:
- ✅ exprsn-ca (Certificate Authority)
- ✅ exprsn-auth (Authentication)
- ✅ exprsn-spark (Real-time Messaging)
- ✅ exprsn-timeline (Social Feed)
- ✅ exprsn-prefetch (Timeline Prefetching)
- ✅ exprsn-moderator (Content Moderation)
- ✅ exprsn-filevault (File Storage)
- ✅ exprsn-gallery (Media Galleries)
- ✅ exprsn-live (Live Streaming)
- ✅ exprsn-nexus (Groups & Events)
- ✅ exprsn-pulse (Analytics & Metrics)
- ✅ exprsn-vault (Secrets Management)
- ✅ exprsn-herald (Notifications & Alerts)
- ✅ exprsn-svr (Dynamic Page Server)
- ✅ exprsn-workflow (Workflow Automation)

#### Template for Each Service:

1. **Backup current models/index.js**:
   ```bash
   cp src/exprsn-{service}/models/index.js src/exprsn-{service}/models/index.backup.js
   ```

2. **Update models/index.js**:
   - Import `createResilientConnection`
   - Wrap initialization in async function
   - Handle connection events
   - Export both sync and async interfaces

3. **Test the service**:
   ```bash
   # With PostgreSQL running
   npm run dev:{service}

   # Without PostgreSQL (should use SQLite)
   brew services stop postgresql@15
   npm run dev:{service}
   ```

## Quick Migration Script

Create a script to update all services:

```javascript
// scripts/enable-sqlite-fallback.js
const fs = require('fs').promises;
const path = require('path');

const services = [
  'exprsn-ca',
  'exprsn-auth',
  'exprsn-spark',
  // ... all services with databases
];

async function enableFallback(serviceName) {
  const modelsPath = path.join(
    __dirname,
    '../src',
    serviceName,
    'models',
    'index.js'
  );

  // Check if resilient version exists
  const resilientPath = modelsPath.replace('.js', '.resilient.js');

  try {
    const resilientExists = await fs.access(resilientPath)
      .then(() => true)
      .catch(() => false);

    if (resilientExists) {
      // Backup original
      await fs.copyFile(modelsPath, modelsPath + '.backup');

      // Copy resilient version
      await fs.copyFile(resilientPath, modelsPath);

      console.log(`✓ ${serviceName}: SQLite fallback enabled`);
    } else {
      console.warn(`⚠ ${serviceName}: No resilient version found`);
    }
  } catch (error) {
    console.error(`✗ ${serviceName}: ${error.message}`);
  }
}

async function main() {
  console.log('Enabling SQLite fallback for all services...\n');

  for (const service of services) {
    await enableFallback(service);
  }

  console.log('\n✓ SQLite fallback enabled');
  console.log('Run: npm start (PostgreSQL will be attempted first)');
}

main();
```

Run it:
```bash
node scripts/enable-sqlite-fallback.js
```

## Testing the Fallback

### Test Scenario 1: PostgreSQL Unavailable at Startup

```bash
# Stop PostgreSQL
brew services stop postgresql@15

# Start services (should use SQLite)
npm start

# Check logs - should see:
# [CA] ⚠️  Using SQLite fallback - Limited features
# [CA] Production deployment requires PostgreSQL
```

### Test Scenario 2: PostgreSQL Becomes Available

```bash
# Services running on SQLite
# Start PostgreSQL
brew services start postgresql@15

# Wait 30 seconds (health check interval)
# Check logs - should see:
# [CA] ✓ PostgreSQL recovered! Switching from SQLite...
# [CA] Full PostgreSQL functionality restored
```

### Test Scenario 3: PostgreSQL Fails During Operation

```bash
# Services running on PostgreSQL
npm start

# Stop PostgreSQL mid-operation
brew services stop postgresql@15

# Next database operation will trigger reconnection
# Services continue with cached data / graceful degradation
```

## Production Deployment

**⚠️ IMPORTANT**: SQLite fallback is for development only!

### Production Configuration

```javascript
// Force PostgreSQL-only in production
const dbConnection = await createResilientConnection({
  serviceName: 'exprsn-ca',
  primary: { /* PostgreSQL config */ },
  options: {
    allowSQLiteFallback: false,  // ❌ No fallback in production
    autoReconnect: true,
    maxRetries: 10,
    retryDelay: 5000
  }
});
```

### Production Environment Variables

```bash
NODE_ENV=production

# PostgreSQL only
DB_HOST=production-db.example.com
DB_PORT=5432
DB_NAME=exprsn_ca_prod
DB_USER=exprsn_prod_user
DB_PASSWORD=secure_password
DB_SSL=true

# Disable SQLite fallback
SQLITE_FALLBACK=false

# Connection resilience
DB_AUTO_RECONNECT=true
DB_MAX_RETRIES=10
DB_RETRY_DELAY=5000
```

## Monitoring

### Connection Status Endpoint

Add to each service:

```javascript
// routes/health.js
app.get('/health/database', async (req, res) => {
  const { connection } = require('../models');
  const status = connection.getStatus();

  res.json({
    connected: status.connected,
    dialect: status.dialect,
    fallback: status.fallback,
    serviceName: status.serviceName,
    retryAttempts: status.retryAttempts,
    warning: status.fallback
      ? 'Running in fallback mode - PostgreSQL unavailable'
      : null
  });
});
```

### Prometheus Metrics

```javascript
const promClient = require('prom-client');

const dbFallbackGauge = new promClient.Gauge({
  name: 'exprsn_database_fallback_active',
  help: 'Whether service is using SQLite fallback (1) or PostgreSQL (0)',
  labelNames: ['service']
});

dbConnection.on('connected', ({ dialect, fallback }) => {
  dbFallbackGauge.set(
    { service: 'exprsn-ca' },
    fallback ? 1 : 0
  );
});
```

## Troubleshooting

### Issue: SQLite Permission Errors

```bash
# Ensure directory exists and is writable
mkdir -p data/sqlite
chmod 755 data/sqlite
```

### Issue: Migration Failures on SQLite

```
Error: SQLITE_ERROR: near "JSONB": syntax error
```

**Solution**: Update migration to use `migrationHelper`:
```javascript
const types = getDialectTypes(queryInterface, Sequelize);
// Use types.JSONB instead of Sequelize.JSONB
```

### Issue: Services Not Recovering

```javascript
// Check recovery status
dbConnection.on('healthCheckFailed', ({ error }) => {
  console.error('PostgreSQL still unavailable:', error.message);
});

// Manually trigger reconnection
await dbConnection.reconnect();
```

### Issue: Different Data Between SQLite and PostgreSQL

**This is expected!** SQLite is a local fallback. Data is not synchronized.

For development:
- Use PostgreSQL as primary
- SQLite is emergency fallback only
- Clear SQLite data regularly: `rm -rf data/sqlite/*`

## SQLite Limitations Reference

| Feature | PostgreSQL | SQLite | Workaround |
|---------|-----------|--------|------------|
| JSONB | ✅ Full support | ⚠️ JSON only | Use JSON type |
| Arrays | ✅ Native ARRAY | ❌ No native support | Store as JSON string |
| UUID | ✅ Native | ❌ Use VARCHAR(36) | String representation |
| PostGIS | ✅ Full support | ❌ Not available | Use lat/lon columns |
| Full-text search | ✅ tsvector/tsquery | ⚠️ FTS5 tables | Create virtual FTS table |
| Concurrent writes | ✅ MVCC | ❌ Single writer | Expect SQLITE_BUSY errors |
| GIN/GIST indexes | ✅ Available | ❌ B-tree only | Use standard indexes |

````★ Insight ─────────────────────────────────────
• **Resilience Pattern**: This fallback system implements the Circuit Breaker and Retry patterns, automatically detecting failures and attempting recovery without manual intervention
• **Development Focus**: SQLite fallback is specifically designed for development environments where PostgreSQL may not be running, ensuring developers can continue working without infrastructure dependencies
• **Production Safety**: The system enforces PostgreSQL-only mode in production through environment detection, preventing accidental use of SQLite's limited feature set in critical deployments
─────────────────────────────────────────────────````

## Summary

With this implementation:

1. **Services start successfully** even without PostgreSQL
2. **Automatic recovery** when PostgreSQL becomes available
3. **Development productivity** maintained during database maintenance
4. **Production safety** ensured through fallback disabling
5. **Migration compatibility** across both databases
6. **Clear monitoring** of connection status

The system transparently handles the complexity of database failover while maintaining a simple API for application code.
