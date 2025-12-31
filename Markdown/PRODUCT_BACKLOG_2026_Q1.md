# Exprsn Platform Product Backlog - Q1 2026

**Product Manager:** AI Agent
**Date:** 2025-12-22
**Platform Version:** 1.0.0 (17/18 services production-ready)

---

## Executive Summary

This backlog represents a comprehensive review of the Exprsn platform's current state and identifies opportunities for stability improvements, feature enhancements, technical debt reduction, and strategic differentiation. Stories are organized by category and prioritized using RICE scoring.

**Platform Health Assessment:**
- ✅ **Strengths:** Solid CA token security, 17 production-ready services, comprehensive Low-Code Platform
- ⚠️ **Concerns:** Test coverage below target (60% vs 70% goal), missing mobile strategy, incomplete Forge modules
- 🚀 **Opportunities:** Creator economy, federation, advanced search, mobile apps

**Recommended Q1 2026 Focus Areas:**
1. **Stability & Technical Debt** (Priority P0-P1) - 8 stories
2. **Forge Completion** (Priority P1) - 4 stories
3. **Creator Economy Features** (Priority P1) - 5 stories
4. **Platform Enhancements** (Priority P2) - 6 stories
5. **Strategic Differentiation** (Priority P2-P3) - 5 stories

**Total Stories:** 28 across 5 categories

---

## Table of Contents

1. [Category 1: Stability & Technical Debt](#category-1-stability--technical-debt)
2. [Category 2: Forge Business Platform Completion](#category-2-forge-business-platform-completion)
3. [Category 3: Creator Economy & Monetization](#category-3-creator-economy--monetization)
4. [Category 4: Platform Enhancements](#category-4-platform-enhancements)
5. [Category 5: Strategic Differentiation](#category-5-strategic-differentiation)
6. [Appendix: RICE Scoring Summary](#appendix-rice-scoring-summary)

---

## Category 1: Stability & Technical Debt

### Story 1.1: Improve Test Coverage to 70% Across All Services

**Priority:** P0 (Critical)
**RICE Score:** 2.1
**Effort:** 6 weeks

**User Story:**
**As a** developer
**I want** comprehensive test coverage across all 18 services
**So that** we can catch bugs before production and refactor with confidence

**Current State:**
- Overall test coverage: ~60% (below 70% target)
- Auth service: 260+ tests (excellent coverage)
- Timeline: 50+ tests (70% coverage - good)
- Several services: <50% coverage (CA, Workflow, Forge modules)

**Acceptance Criteria:**
- [ ] All 18 services achieve minimum 60% test coverage
- [ ] At least 12 services achieve 70% test coverage
- [ ] Critical services (CA, Auth, Timeline) maintain 80%+ coverage
- [ ] CI/CD pipeline fails builds below 60% coverage
- [ ] Coverage reports generated and tracked in dashboard

**Technical Implementation:**
```bash
# Services needing attention
- exprsn-ca: Increase from ~55% to 70% (focus on token generation, OCSP)
- exprsn-workflow: Increase from ~45% to 65% (focus on step execution)
- exprsn-forge: Groupware module needs tests (currently minimal)
- exprsn-moderator: AI moderation logic needs coverage
- exprsn-filevault: File operations need testing
```

**Test Coverage Targets by Service:**
| Service | Current | Target | Priority |
|---------|---------|--------|----------|
| CA | 55% | 70% | High |
| Auth | 75% | 80% | Medium |
| Timeline | 70% | 75% | Low |
| Workflow | 45% | 65% | High |
| Forge (CRM) | 65% | 70% | Medium |
| Forge (Groupware) | 20% | 60% | High |
| Moderator | 40% | 65% | High |

**Dependencies:** None

**RICE Calculation:**
- Reach: 10/10 (affects all developers, all services)
- Impact: 3/3 (critical for quality and velocity)
- Confidence: 0.7 (medium - requires discipline)
- Effort: 6 weeks

**RICE = (10 × 3 × 0.7) / 6 = 3.5**

---

### Story 1.2: Implement Centralized Error Tracking (Sentry or Similar)

**Priority:** P1 (High)
**RICE Score:** 1.8
**Effort:** 2 weeks

**User Story:**
**As a** DevOps engineer
**I want** centralized error tracking across all 18 services
**So that** I can quickly identify and respond to production issues

**Current State:**
- Errors logged to Winston (console/file)
- No centralized error aggregation
- Production issues discovered reactively via user reports
- No error rate trending or alerting

**Acceptance Criteria:**
- [ ] Sentry (or similar) integrated into `@exprsn/shared` library
- [ ] All 18 services report errors to Sentry
- [ ] Error grouping, deduplication, and trending enabled
- [ ] Slack/email alerts configured for P0/P1 errors
- [ ] Source maps uploaded for better stack traces
- [ ] User context (user ID, request ID) included in error reports

**Technical Implementation:**
```javascript
// @exprsn/shared/utils/errorTracking.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = '[REDACTED]';
    }
    return event;
  }
});

module.exports = Sentry;

// Usage in services
const { errorHandler } = require('@exprsn/shared');
const Sentry = require('@exprsn/shared/utils/errorTracking');

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... routes ...

app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);
```

**Cost Analysis:**
- Sentry pricing: ~$26/month (1M events, 10k replays)
- Alternative: Self-hosted Sentry (free, requires maintenance)

**Dependencies:** None

**RICE Calculation:**
- Reach: 9/10 (all services, all errors)
- Impact: 2/3 (improves debugging significantly)
- Confidence: 1.0 (proven solution)
- Effort: 2 weeks

**RICE = (9 × 2 × 1.0) / 2 = 9.0** ⭐ High priority

---

### Story 1.3: Add Health Check Dependencies and Startup Order Validation

**Priority:** P0 (Critical)
**RICE Score:** 2.4
**Effort:** 3 weeks

**User Story:**
**As a** Cloud Engineer
**I want** automated validation of service startup order and dependency health
**So that** services fail fast when dependencies are unavailable

**Current State:**
- Services start independently without checking dependencies
- CA service must start first, but not enforced
- Services crash if CA/Auth unavailable, no graceful degradation
- Health checks exist but don't verify dependencies

**Problem Scenario:**
```
1. Timeline service starts
2. Tries to validate CA token
3. CA service not running yet
4. Timeline crashes and restarts in loop
5. Eventually succeeds after CA starts (wasteful)
```

**Acceptance Criteria:**
- [ ] All services check critical dependencies on startup (CA, Auth, Database, Redis)
- [ ] Services wait (with timeout) for dependencies before starting
- [ ] Health check endpoint returns dependency status: `/health/dependencies`
- [ ] Kubernetes readiness probes prevent traffic until dependencies ready
- [ ] Clear error messages when dependencies unavailable
- [ ] Exponential backoff on dependency retries (not tight loop)

**Technical Implementation:**
```javascript
// @exprsn/shared/utils/healthCheck.js
async function waitForDependencies(dependencies, timeout = 60000) {
  const startTime = Date.now();

  for (const dep of dependencies) {
    while (Date.now() - startTime < timeout) {
      try {
        await checkDependency(dep);
        logger.info(`Dependency ${dep.name} is ready`);
        break;
      } catch (error) {
        logger.warn(`Waiting for ${dep.name}... (${error.message})`);
        await sleep(Math.min(5000, (Date.now() - startTime) / 10)); // Exponential backoff
      }
    }
  }
}

// Usage in service startup
await waitForDependencies([
  { name: 'CA', url: process.env.CA_URL + '/health' },
  { name: 'Database', check: () => sequelize.authenticate() },
  { name: 'Redis', check: () => redisClient.ping() }
]);

app.listen(PORT, () => {
  logger.info('Service started successfully');
});
```

**Affected Services:**
- All 17 services (except CA itself)
- Docker Compose `depends_on` with health checks
- Kubernetes readiness/liveness probes

**Dependencies:** None

**RICE Calculation:**
- Reach: 10/10 (all services, all deployments)
- Impact: 2/3 (prevents cascading failures)
- Confidence: 0.9
- Effort: 3 weeks

**RICE = (10 × 2 × 0.9) / 3 = 6.0** ⭐ High priority

---

### Story 1.4: Implement Circuit Breakers for Service-to-Service Communication

**Priority:** P1 (High)
**RICE Score:** 1.5
**Effort:** 4 weeks

**User Story:**
**As a** Sr. Developer
**I want** circuit breakers for inter-service communication
**So that** one failing service doesn't cascade failures to other services

**Current State:**
- Services make direct HTTP calls to each other
- No retry logic or circuit breaking
- If Herald service is down, Timeline requests hang and timeout
- No graceful degradation

**Acceptance Criteria:**
- [ ] Circuit breaker library (e.g., Opossum) integrated into `@exprsn/shared`
- [ ] Service-to-service calls wrapped in circuit breakers
- [ ] Circuit states: Closed (normal), Open (failing), Half-Open (testing recovery)
- [ ] Fallback strategies defined for critical operations
- [ ] Circuit breaker metrics exposed to Prometheus
- [ ] Dashboard showing circuit breaker states

**Technical Implementation:**
```javascript
// @exprsn/shared/utils/circuitBreaker.js
const CircuitBreaker = require('opossum');

function createServiceCircuitBreaker(serviceRequest, options = {}) {
  const breaker = new CircuitBreaker(serviceRequest, {
    timeout: options.timeout || 5000,      // 5 second timeout
    errorThresholdPercentage: 50,          // Open after 50% failures
    resetTimeout: 30000,                   // Try again after 30 seconds
    ...options
  });

  breaker.on('open', () => {
    logger.error(`Circuit breaker opened for ${options.name}`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker half-open for ${options.name}`);
  });

  return breaker;
}

// Usage example: Timeline → Herald notification
const notifyBreaker = createServiceCircuitBreaker(
  async (data) => {
    return await serviceRequest({
      method: 'POST',
      url: `${HERALD_URL}/api/notifications`,
      data
    });
  },
  {
    name: 'Herald Notifications',
    fallback: (data) => {
      // Queue for later retry
      notificationQueue.add(data);
      return { queued: true };
    }
  }
);

// Call with circuit breaker protection
const result = await notifyBreaker.fire({ userId, message });
```

**Fallback Strategies:**
| Service Call | Fallback Strategy |
|-------------|-------------------|
| Timeline → Herald | Queue notification for later delivery |
| Timeline → Moderator | Allow post, moderate async |
| Any → CA token validation | Cache last known good tokens (short TTL) |
| Forge → Email service | Queue email for later sending |

**Dependencies:** Story 1.2 (Error Tracking) - helpful for monitoring circuit states

**RICE Calculation:**
- Reach: 8/10 (affects service reliability)
- Impact: 2/3 (prevents cascading failures)
- Confidence: 0.9
- Effort: 4 weeks

**RICE = (8 × 2 × 0.9) / 4 = 3.6**

---

### Story 1.5: Database Connection Pooling Optimization

**Priority:** P1 (High)
**RICE Score:** 1.4
**Effort:** 2 weeks

**User Story:**
**As a** Database Administrator
**I want** optimized database connection pools across all services
**So that** we efficiently use database connections and prevent exhaustion

**Current State:**
- Each service has default Sequelize connection pool (max: 5)
- No pgBouncer or connection pooling proxy
- Potential connection exhaustion during traffic spikes
- No monitoring of connection pool metrics

**Problem:**
```
18 services × 5 connections = 90 connections minimum
Under load: Could spike to 18 × 20 = 360 connections
PostgreSQL default max_connections: 100 (exceeded!)
```

**Acceptance Criteria:**
- [ ] pgBouncer deployed as connection pooling proxy
- [ ] All 18 services connect through pgBouncer (port 6432)
- [ ] Sequelize pool settings optimized per service workload
- [ ] Connection pool metrics exposed (active, idle, waiting)
- [ ] PostgreSQL `max_connections` increased to 200
- [ ] Documentation on connection pool tuning

**Technical Implementation:**
```ini
; /etc/pgbouncer/pgbouncer.ini
[databases]
exprsn_ca = host=localhost port=5432 dbname=exprsn_ca
exprsn_auth = host=localhost port=5432 dbname=exprsn_auth
; ... (all 18 databases)

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25
reserve_pool_size = 5
server_idle_timeout = 600
```

```javascript
// Service Sequelize config (updated)
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: process.env.PGBOUNCER_HOST || 'localhost',
  port: process.env.PGBOUNCER_PORT || 6432,
  dialect: 'postgres',
  pool: {
    max: 10,        // Increased from 5
    min: 2,         // Keep some warm connections
    acquire: 30000,
    idle: 10000
  },
  logging: false
});
```

**Recommended Pool Sizes by Service:**
| Service | Pool Max | Reasoning |
|---------|----------|-----------|
| Timeline | 20 | High read volume |
| Auth | 15 | High session queries |
| Spark | 15 | Real-time messaging |
| CA | 10 | Token generation |
| Forge | 10 | CRM queries |
| Others | 5 | Lower volume |

**Dependencies:** None

**RICE Calculation:**
- Reach: 7/10 (affects performance under load)
- Impact: 2/3 (prevents connection exhaustion)
- Confidence: 1.0
- Effort: 2 weeks

**RICE = (7 × 2 × 1.0) / 2 = 7.0**

---

### Story 1.6: Implement Redis Cluster for High Availability

**Priority:** P2 (Medium)
**RICE Score:** 1.2
**Effort:** 3 weeks

**User Story:**
**As a** Cloud Engineer
**I want** Redis deployed in clustered mode with failover
**So that** cache and queue availability doesn't become a single point of failure

**Current State:**
- Single Redis instance (Port 6379)
- Used for: Bull queues, session storage, caching
- If Redis goes down: Queues stop, sessions lost, cache misses spike
- No automatic failover

**Acceptance Criteria:**
- [ ] Redis Sentinel or Cluster deployed (3+ nodes)
- [ ] Automatic failover configured (< 30 second failover time)
- [ ] All services updated to use Redis Sentinel/Cluster connection
- [ ] Bull queues configured for high availability
- [ ] Cache invalidation works across cluster nodes
- [ ] Monitoring and alerting for Redis node health

**Technical Implementation:**
```yaml
# docker-compose.yml (Redis Sentinel example)
redis-master:
  image: redis:7-alpine
  command: redis-server --appendonly yes

redis-replica-1:
  image: redis:7-alpine
  command: redis-server --appendonly yes --slaveof redis-master 6379

redis-replica-2:
  image: redis:7-alpine
  command: redis-server --appendonly yes --slaveof redis-master 6379

redis-sentinel-1:
  image: redis:7-alpine
  command: redis-sentinel /etc/redis/sentinel.conf

redis-sentinel-2:
  image: redis:7-alpine
  command: redis-sentinel /etc/redis/sentinel.conf

redis-sentinel-3:
  image: redis:7-alpine
  command: redis-sentinel /etc/redis/sentinel.conf
```

```javascript
// Service Redis connection (updated)
const Redis = require('ioredis');

const redis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 }
  ],
  name: 'mymaster',
  password: process.env.REDIS_PASSWORD
});
```

**Cost:**
- Development: 3 Redis instances (minimal cost in containers)
- Production: Digital Ocean Managed Redis Cluster (~$50/month)

**Dependencies:** None

**RICE Calculation:**
- Reach: 6/10 (affects reliability)
- Impact: 2/3 (prevents downtime)
- Confidence: 0.9
- Effort: 3 weeks

**RICE = (6 × 2 × 0.9) / 3 = 3.6**

---

### Story 1.7: CA Certificate Expiration Monitoring and Auto-Renewal

**Priority:** P0 (Critical)
**RICE Score:** 2.8
**Effort:** 2 weeks

**User Story:**
**As a** Platform Administrator
**I want** automated monitoring and renewal of CA certificates
**So that** the platform doesn't experience catastrophic failures due to expired certificates

**Current State:**
- Root CA certificate has expiration date
- No automated monitoring of certificate expiration
- No automated renewal process
- If root CA expires: **ALL SERVICES FAIL** (token validation breaks)

**Risk Assessment:**
- **Impact:** CRITICAL - Complete platform outage
- **Likelihood:** MEDIUM - Certificates expire (typically 1-10 years)
- **Detection:** Currently manual (human must check)

**Acceptance Criteria:**
- [ ] Monitoring job checks CA certificate expiration daily
- [ ] Alerts sent when certificate expires within 90 days (email + Slack)
- [ ] Automated renewal process for certificates (with manual approval step)
- [ ] Certificate rotation process documented and tested
- [ ] OCSP responder updated with new certificate info
- [ ] Monitoring dashboard shows certificate expiration dates

**Technical Implementation:**
```javascript
// scripts/monitor-cert-expiration.js
const { Certificate } = require('../models');
const { logger } = require('@exprsn/shared');

async function checkCertificateExpiration() {
  const certs = await Certificate.findAll({
    where: {
      status: 'active'
    }
  });

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  for (const cert of certs) {
    const daysUntilExpiration = Math.floor(
      (cert.expiresAt - now) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 90) {
      // Alert!
      await sendAlert({
        severity: daysUntilExpiration < 30 ? 'CRITICAL' : 'WARNING',
        message: `Certificate ${cert.commonName} expires in ${daysUntilExpiration} days`,
        certId: cert.id,
        expiresAt: cert.expiresAt
      });
    }

    if (cert.type === 'root' && daysUntilExpiration < 180) {
      // Root CA expiring - escalate to management
      await sendEscalatedAlert({
        severity: 'CRITICAL',
        message: `ROOT CA expires in ${daysUntilExpiration} days - RENEWAL REQUIRED`,
        certId: cert.id
      });
    }
  }
}

// Schedule daily check (cron)
cron.schedule('0 9 * * *', checkCertificateExpiration);
```

**Certificate Rotation Process:**
1. Generate new root CA certificate (overlapping validity)
2. Distribute new CA cert to all services
3. Run both old and new CA concurrently (grace period)
4. Gradually transition services to new CA
5. Revoke old CA after all services migrated

**Dependencies:** Story 1.2 (Error Tracking) for alerting

**RICE Calculation:**
- Reach: 10/10 (affects entire platform)
- Impact: 3/3 (prevents catastrophic failure)
- Confidence: 0.9
- Effort: 2 weeks

**RICE = (10 × 3 × 0.9) / 2 = 13.5** ⭐⭐⭐ Highest priority

---

### Story 1.8: Implement Database Backup Verification and Restore Testing

**Priority:** P1 (High)
**RICE Score:** 1.6
**Effort:** 3 weeks

**User Story:**
**As a** Database Administrator
**I want** automated verification that database backups are valid and restorable
**So that** we can confidently recover from data loss incidents

**Current State:**
- Backups likely exist (manual or via `pg_dump`)
- **No verification that backups are restorable**
- No documented restore procedure
- No regular restore testing
- Unknown RTO (Recovery Time Objective) and RPO (Recovery Point Objective)

**Horror Story:**
```
1. Production database corrupted
2. Attempt to restore from backup
3. Backup file is corrupted/incomplete
4. Data loss! 😱
```

**Acceptance Criteria:**
- [ ] Automated daily backups for all 18 databases
- [ ] Backup verification: Restore to test environment weekly
- [ ] Automated restore testing (verify data integrity)
- [ ] Backup retention policy: 30 days daily, 12 months monthly
- [ ] Documented restore procedure (runbook)
- [ ] RTO: < 1 hour, RPO: < 24 hours (defined and tested)
- [ ] Backup monitoring dashboard (last successful backup, size, etc.)

**Technical Implementation:**
```bash
#!/bin/bash
# scripts/backup-and-verify.sh

BACKUP_DIR="/var/backups/postgresql/exprsn"
TEST_DB_PREFIX="test_restore_"
DATE=$(date +%Y%m%d_%H%M%S)

# 1. Backup all databases
for DB in $(psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'exprsn_%';"); do
  echo "Backing up $DB..."
  pg_dump -U postgres -Fc "$DB" > "$BACKUP_DIR/${DB}_${DATE}.dump"
done

# 2. Verify one backup daily (rotate through databases)
VERIFY_DB=$(ls $BACKUP_DIR/*_${DATE}.dump | head -1)
TEST_DB="${TEST_DB_PREFIX}$(basename $VERIFY_DB .dump)"

echo "Verifying backup: $VERIFY_DB"
dropdb -U postgres --if-exists "$TEST_DB"
createdb -U postgres "$TEST_DB"
pg_restore -U postgres -d "$TEST_DB" "$VERIFY_DB"

# 3. Run data integrity check
RESULT=$(psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM users;")

if [ "$RESULT" -gt 0 ]; then
  echo "✅ Backup verified successfully ($RESULT users found)"
else
  echo "❌ Backup verification FAILED - alerting admin"
  # Send alert via Sentry/email
fi

# 4. Clean up test database
dropdb -U postgres "$TEST_DB"
```

**Backup Strategy:**
| Backup Type | Frequency | Retention | Purpose |
|-------------|-----------|-----------|---------|
| Full backup | Daily 2 AM | 30 days | Point-in-time recovery |
| WAL archiving | Continuous | 7 days | Minimal data loss (RPO < 5 min) |
| Monthly snapshot | 1st of month | 12 months | Long-term retention |

**Dependencies:** None

**RICE Calculation:**
- Reach: 8/10 (affects disaster recovery capability)
- Impact: 3/3 (prevents data loss)
- Confidence: 0.8
- Effort: 3 weeks

**RICE = (8 × 3 × 0.8) / 3 = 6.4** ⭐ High priority

---

## Category 2: Forge Business Platform Completion

### Story 2.1: Complete Forge Groupware Module (40% → 100%)

**Priority:** P1 (High)
**RICE Score:** 1.8
**Effort:** 8 weeks

**User Story:**
**As a** business user
**I want** complete groupware functionality (calendar, documents, tasks, email)
**So that** I can manage team collaboration within Forge CRM

**Current State:**
- Forge Groupware: 40% complete
- Missing: Shared calendars, document library, task assignments, email integration

**Acceptance Criteria:**
- [ ] **Shared Calendars:** Create/edit/delete team calendars with event scheduling
- [ ] **Recurring Events:** Daily, weekly, monthly, custom recurrence patterns
- [ ] **Document Library:** Upload, organize, share documents with teams
- [ ] **Version Control:** Track document versions, revert to previous versions
- [ ] **Task Management:** Create tasks, assign to team members, track status
- [ ] **Email Integration:** Connect IMAP/SMTP accounts, send/receive within Forge
- [ ] **Notifications:** Email/in-app notifications for calendar events, task assignments

**Technical Implementation:**

**Database Schema (Calendar Events):**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB,  -- iCalendar RRULE format
  location TEXT,
  attendees JSONB,        -- [{email, status: 'accepted'/'declined'/'tentative'}]
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_calendar_start ON events(calendar_id, start_time);
CREATE INDEX idx_events_recurrence ON events((recurrence_rule IS NOT NULL));
```

**Libraries to Use:**
- **Calendar:** rrule library for recurrence calculations
- **Email:** Nodemailer for SMTP, imap-simple for IMAP
- **Documents:** Multer for uploads, sharp for image thumbnails
- **Tasks:** Drag-and-drop Kanban board (similar to Trello)

**UI Components:**
- Calendar view: Month/week/day/agenda views
- Document browser: Tree view with folders
- Task board: Kanban columns (To Do, In Progress, Done)
- Email client: Inbox, sent, drafts folders

**Dependencies:** None

**RICE Calculation:**
- Reach: 6/10 (Forge users - subset of total users)
- Impact: 3/3 (completes major platform feature)
- Confidence: 0.8
- Effort: 8 weeks

**RICE = (6 × 3 × 0.8) / 8 = 1.8**

---

### Story 2.2: Implement Forge ERP Basic Functionality (15% → 50%)

**Priority:** P2 (Medium)
**RICE Score:** 1.1
**Effort:** 10 weeks

**User Story:**
**As a** small business owner
**I want** basic ERP functionality (inventory, invoicing, basic accounting)
**So that** I can manage my business operations in one platform

**Current State:**
- Forge ERP: 15% complete (very early stage)
- Missing: Most ERP features

**Acceptance Criteria:**
- [ ] **Inventory Management:** Track products, stock levels, warehouses
- [ ] **Purchase Orders:** Create POs, track supplier orders
- [ ] **Sales Orders:** Convert opportunities to orders, track fulfillment
- [ ] **Invoicing:** Generate invoices from sales orders, track payment status
- [ ] **Basic Accounting:** Chart of accounts, journal entries, balance sheet
- [ ] **Reporting:** Inventory reports, sales reports, financial statements

**Phase 1 Features (50% completion):**
1. Inventory management (products, stock, warehouses)
2. Purchase orders and supplier management
3. Sales orders (linked to CRM opportunities)
4. Invoicing and payment tracking
5. Basic financial reports

**Out of Scope (for later):**
- Advanced accounting (multi-currency, tax codes)
- Manufacturing/production management
- Advanced reporting (custom dashboards)
- Integrations (QuickBooks, Xero)

**Technical Implementation:**

**Database Schema (Products):**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES product_categories(id),
  unit_price DECIMAL(12, 2) NOT NULL,
  cost_price DECIMAL(12, 2),
  stock_quantity INTEGER DEFAULT 0,
  reorder_point INTEGER,
  supplier_id UUID REFERENCES suppliers(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  movement_type VARCHAR(50) NOT NULL,  -- 'purchase', 'sale', 'adjustment', 'transfer'
  quantity INTEGER NOT NULL,
  reference_id UUID,  -- Links to PO/SO
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES accounts(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'sent', 'paid', 'overdue', 'void'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Dependencies:** Story 2.1 (Groupware completion - same sprint resources)

**RICE Calculation:**
- Reach: 5/10 (Small subset of users need ERP)
- Impact: 2/3 (Valuable but not critical)
- Confidence: 0.6 (Medium - ERP is complex)
- Effort: 10 weeks

**RICE = (5 × 2 × 0.6) / 10 = 0.6**

**Note:** Lower priority due to smaller user base and complexity. Consider deferring to Q2 2026.

---

### Story 2.3: Forge CRM Advanced Reporting and Dashboards

**Priority:** P2 (Medium)
**RICE Score:** 1.3
**Effort:** 4 weeks

**User Story:**
**As a** sales manager
**I want** customizable dashboards and advanced reports
**So that** I can track team performance and forecast revenue

**Current State:**
- Basic CRM CRUD operations complete (100%)
- Limited reporting (simple lists and filters)
- No visual dashboards or charts

**Acceptance Criteria:**
- [ ] Sales dashboard with KPIs (pipeline value, win rate, avg deal size)
- [ ] Chart components: Bar, line, pie, donut charts
- [ ] Custom report builder (drag-and-drop fields, filters)
- [ ] Saved reports and scheduled email delivery
- [ ] Export reports to CSV/Excel/PDF
- [ ] Date range filters (this month, last quarter, year-to-date)

**Dashboard Widgets:**
1. **Pipeline Overview:** Total value by stage (bar chart)
2. **Win Rate:** Closed-won vs. closed-lost (donut chart)
3. **Top Performers:** Leaderboard of sales reps by revenue
4. **Revenue Forecast:** Projected revenue based on probability (line chart)
5. **Activity Feed:** Recent deals, tasks, notes

**Technical Implementation:**
```javascript
// Use Chart.js or Recharts for visualizations
import { BarChart, Bar, PieChart, Pie, LineChart, Line } from 'recharts';

// Dashboard data API
router.get('/api/forge/dashboards/sales', validateCAToken, async (req, res) => {
  const { startDate, endDate } = req.query;

  const pipelineData = await Opportunity.findAll({
    attributes: [
      'stage',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total_value'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      createdAt: { [Op.between]: [startDate, endDate] },
      status: 'open'
    },
    group: ['stage']
  });

  const winRate = await Opportunity.count({
    where: {
      status: 'won',
      actualCloseDate: { [Op.between]: [startDate, endDate] }
    }
  }) / await Opportunity.count({
    where: {
      status: { [Op.in]: ['won', 'lost'] },
      actualCloseDate: { [Op.between]: [startDate, endDate] }
    }
  });

  res.json({
    success: true,
    data: {
      pipeline: pipelineData,
      winRate: (winRate * 100).toFixed(1) + '%',
      // ... more metrics
    }
  });
});
```

**Dependencies:** None

**RICE Calculation:**
- Reach: 7/10 (Forge CRM users)
- Impact: 2/3 (Improves decision-making)
- Confidence: 0.9
- Effort: 4 weeks

**RICE = (7 × 2 × 0.9) / 4 = 3.15**

---

### Story 2.4: Forge Mobile-Responsive UI Improvements

**Priority:** P2 (Medium)
**RICE Score:** 1.2
**Effort:** 3 weeks

**User Story:**
**As a** sales rep on the go
**I want** Forge CRM to work well on my mobile device
**So that** I can update deals and contacts from anywhere

**Current State:**
- Forge UI built with Bootstrap 5.3 (responsive framework)
- Mobile layout exists but not optimized
- Some forms difficult to use on small screens
- No mobile-specific features (swipe actions, touch-friendly)

**Acceptance Criteria:**
- [ ] All Forge pages responsive on mobile (375px - iPhone SE)
- [ ] Touch-friendly UI elements (44x44px minimum tap targets)
- [ ] Mobile navigation (hamburger menu, bottom nav)
- [ ] Swipe actions on lists (swipe to call, email, delete)
- [ ] Mobile-optimized forms (stacked fields, large inputs)
- [ ] Tested on iOS Safari and Android Chrome

**Mobile UX Improvements:**
- Contact list: Swipe right to call, swipe left to email
- Deal cards: Larger touch targets for stage changes
- Forms: Single column layout, grouped fields in accordions
- Navigation: Bottom tab bar for quick access (Contacts, Deals, Tasks, More)

**Technical Implementation:**
```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
  .forge-nav {
    position: fixed;
    bottom: 0;
    width: 100%;
    display: flex;
    justify-content: space-around;
  }

  .forge-card {
    margin: 0.5rem;
    padding: 1rem;
  }

  .forge-form .form-group {
    margin-bottom: 1.5rem;  /* More space on mobile */
  }

  /* Touch-friendly buttons */
  .btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.75rem 1.5rem;
  }
}
```

```javascript
// Swipe actions library (e.g., react-swipeable or vanilla JS)
const swipeHandlers = useSwipeable({
  onSwipedLeft: () => handleEmail(contact),
  onSwipedRight: () => handleCall(contact)
});

<div {...swipeHandlers} className="contact-card">
  {/* Contact info */}
</div>
```

**Testing Checklist:**
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13 (390px)
- [ ] Android (360px - 412px)
- [ ] iPad (768px)

**Dependencies:** None

**RICE Calculation:**
- Reach: 6/10 (Mobile users - subset of Forge users)
- Impact: 2/3 (Improves mobile UX)
- Confidence: 0.9
- Effort: 3 weeks

**RICE = (6 × 2 × 0.9) / 3 = 3.6**

---

## Category 3: Creator Economy & Monetization

### Story 3.1: Implement Creator Subscription Tiers (Patreon-Style)

**Priority:** P1 (High)
**RICE Score:** 1.8
**Effort:** 10 weeks

**User Story:**
**As a** content creator
**I want** to offer paid subscription tiers to my supporters
**So that** I can monetize my content and build a sustainable income

**Market Validation:**
- $104B creator economy (2024)
- User survey: 45% interested in monetization
- 23 GitHub feature requests
- Competitors: Patreon ($1.5B valuation), Substack, Ko-fi

**Acceptance Criteria:**
- [ ] Creators can define subscription tiers (name, price, benefits)
- [ ] Supporters can subscribe via Stripe Checkout
- [ ] Exclusive content for subscribers only (paywall in Timeline)
- [ ] Creator dashboard shows revenue, subscriber count, churn
- [ ] Platform fee: 5% (competitive with Patreon)
- [ ] Monthly recurring billing and subscription management
- [ ] Email notifications for new subscribers, cancellations
- [ ] Payout system (monthly payouts to creator bank accounts)

**Subscription Tiers Example:**
```
Basic Tier: $5/month
- Access to exclusive posts
- Monthly Q&A session

Premium Tier: $10/month
- Everything in Basic
- Early access to content
- Discord community access

Ultra Tier: $25/month
- Everything in Premium
- 1-on-1 monthly video call
- Your name in credits
```

**Technical Implementation:**

**Database Schema:**
```sql
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 100),  -- Min $1
  currency VARCHAR(3) DEFAULT 'USD',
  benefits JSONB,  -- ['Exclusive posts', 'Discord access']
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  creator_id UUID NOT NULL,
  subscriber_id UUID NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  stripe_payout_id TEXT,
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'paid', 'failed'
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Stripe Integration:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create subscription checkout session
router.post('/api/subscriptions/checkout', validateCAToken, async (req, res) => {
  const { tierId } = req.body;
  const tier = await SubscriptionTier.findByPk(tierId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: req.user.email,
    line_items: [{
      price_data: {
        currency: tier.currency,
        product_data: {
          name: tier.name,
          description: tier.description
        },
        recurring: { interval: 'month' },
        unit_amount: tier.amountCents
      },
      quantity: 1
    }],
    success_url: `${process.env.APP_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/subscriptions/cancel`,
    metadata: {
      tierId: tier.id,
      creatorId: tier.creatorId,
      subscriberId: req.user.id
    }
  });

  res.json({ success: true, checkoutUrl: session.url });
});

// Webhook for Stripe events
router.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

**Exclusive Content (Paywall):**
```javascript
// Timeline service - check subscriber status before showing post
router.get('/api/posts/:id', validateCAToken, async (req, res) => {
  const post = await Post.findByPk(req.params.id);

  if (post.visibility === 'subscribers_only') {
    // Check if user is subscribed to post author
    const subscription = await Subscription.findOne({
      where: {
        creatorId: post.userId,
        subscriberId: req.user.id,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'This content is for subscribers only',
        subscriptionTiers: await getCreatorTiers(post.userId)
      });
    }
  }

  res.json({ success: true, data: post });
});
```

**Creator Dashboard Metrics:**
- Total revenue (lifetime and this month)
- Active subscribers count (by tier)
- Churn rate (cancellations / active subscribers)
- Monthly recurring revenue (MRR)
- Average revenue per user (ARPU)
- Top subscribers (lifetime value)

**Dependencies:** None (could integrate with Forge CRM for customer tracking)

**RICE Calculation:**
- Reach: 6/10 (Creators are small % but attract audiences)
- Impact: 3/3 (Game-changing for creators)
- Confidence: 0.9
- Effort: 10 weeks

**RICE = (6 × 3 × 0.9) / 10 = 1.62**

---

### Story 3.2: Add One-Time Tipping/Support (Ko-fi Style)

**Priority:** P2 (Medium)
**RICE Score:** 1.4
**Effort:** 3 weeks

**User Story:**
**As a** user
**I want** to send one-time tips to creators I appreciate
**So that** I can support them without committing to a subscription

**Acceptance Criteria:**
- [ ] "Tip" button on posts and creator profiles
- [ ] Preset tip amounts ($1, $5, $10) and custom amount
- [ ] Optional tip message (publicly visible or private)
- [ ] Stripe Payment Intents for one-time charges
- [ ] Creator receives 95% of tip (5% platform fee)
- [ ] Email notification to creator when tipped
- [ ] Tip history and leaderboard (top supporters)

**UI Flow:**
```
1. User clicks "Tip" button on post
2. Modal opens with tip amount selector
3. User selects amount or enters custom ($3-$500 range)
4. Optional: Add message "Great post! Keep it up!"
5. Stripe Checkout (card on file or new card)
6. Success: "Tip sent! ❤️" confirmation
7. Creator notified via email
```

**Technical Implementation:**
```javascript
router.post('/api/tips', validateCAToken, async (req, res) => {
  const { creatorId, amountCents, message } = req.body;

  // Validation
  if (amountCents < 100 || amountCents > 50000) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_AMOUNT',
      message: 'Tip must be between $1 and $500'
    });
  }

  // Create Stripe Payment Intent
  const platformFee = Math.floor(amountCents * 0.05);  // 5% platform fee

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    application_fee_amount: platformFee,
    transfer_data: {
      destination: creator.stripeAccountId  // Creator's Stripe Connect account
    },
    metadata: {
      fromUserId: req.user.id,
      toUserId: creatorId,
      message: message || ''
    }
  });

  // Save tip record
  const tip = await Tip.create({
    fromUserId: req.user.id,
    toUserId: creatorId,
    amountCents,
    message,
    stripePaymentIntentId: paymentIntent.id,
    status: 'pending'
  });

  res.json({
    success: true,
    data: {
      tipId: tip.id,
      clientSecret: paymentIntent.client_secret
    }
  });
});
```

**Dependencies:** Story 3.1 (Subscriptions) - shares Stripe integration

**RICE Calculation:**
- Reach: 7/10 (More users will tip than subscribe)
- Impact: 2/3 (Nice to have, not transformative)
- Confidence: 1.0
- Effort: 3 weeks

**RICE = (7 × 2 × 1.0) / 3 = 4.67** ⭐

---

### Story 3.3: Creator Analytics Dashboard

**Priority:** P2 (Medium)
**RICE Score:** 1.1
**Effort:** 4 weeks

**User Story:**
**As a** creator
**I want** detailed analytics about my audience and revenue
**So that** I can understand what content resonates and optimize my strategy

**Acceptance Criteria:**
- [ ] Revenue metrics (total, MRR, tips, subscriptions)
- [ ] Subscriber growth chart (new, churned, net growth)
- [ ] Content performance (views, likes, comments by post)
- [ ] Audience demographics (if available via surveys)
- [ ] Top posts by engagement
- [ ] Export data to CSV

**Dashboard Sections:**

**1. Revenue Overview:**
- Total revenue (lifetime, this month, last month)
- Monthly recurring revenue (MRR)
- One-time tips (count and total)
- Subscriber count (active, by tier)
- Projected revenue (based on current MRR)

**2. Growth Metrics:**
- New subscribers this month
- Churn rate (% cancellations)
- Net subscriber growth chart (line chart over time)
- Subscriber retention by cohort

**3. Content Performance:**
- Top 10 posts by views
- Top 10 posts by engagement (likes + comments)
- Average engagement rate
- Best posting times (when audience is most active)

**4. Audience Insights:**
- Subscriber breakdown by tier
- Geographic distribution (if available)
- Lifetime value (LTV) of subscribers

**Technical Implementation:**
```javascript
router.get('/api/creator/analytics', validateCAToken, async (req, res) => {
  const creatorId = req.user.id;

  // Revenue metrics
  const revenue = await Subscription.sum('amount_cents', {
    where: { creatorId, status: 'active' }
  });

  const tips = await Tip.sum('amount_cents', {
    where: {
      toUserId: creatorId,
      status: 'completed',
      createdAt: { [Op.gte]: startOfMonth }
    }
  });

  // Subscriber growth
  const newSubscribers = await Subscription.count({
    where: {
      creatorId,
      createdAt: { [Op.gte]: startOfMonth }
    }
  });

  const churned = await Subscription.count({
    where: {
      creatorId,
      status: 'canceled',
      updatedAt: { [Op.gte]: startOfMonth }
    }
  });

  // Content performance
  const topPosts = await Post.findAll({
    where: { userId: creatorId },
    attributes: [
      'id',
      'content',
      'createdAt',
      [sequelize.literal('(SELECT COUNT(*) FROM likes WHERE post_id = Post.id)'), 'likeCount'],
      [sequelize.literal('(SELECT COUNT(*) FROM comments WHERE post_id = Post.id)'), 'commentCount']
    ],
    order: [[sequelize.literal('likeCount + commentCount'), 'DESC']],
    limit: 10
  });

  res.json({
    success: true,
    data: {
      revenue: {
        total: revenue + tips,
        mrr: revenue,
        tips,
        subscriberCount: await Subscription.count({ where: { creatorId, status: 'active' } })
      },
      growth: {
        newSubscribers,
        churned,
        churnRate: (churned / (newSubscribers + churned) * 100).toFixed(1) + '%'
      },
      topPosts
    }
  });
});
```

**Dependencies:** Story 3.1 (Subscriptions), Story 3.2 (Tips)

**RICE Calculation:**
- Reach: 5/10 (Creators only)
- Impact: 2/3 (Helps optimize strategy)
- Confidence: 0.9
- Effort: 4 weeks

**RICE = (5 × 2 × 0.9) / 4 = 2.25**

---

### Story 3.4: Supporter Benefits System

**Priority:** P2 (Medium)
**RICE Score:** 0.9
**Effort:** 5 weeks

**User Story:**
**As a** creator
**I want** to offer special benefits to my supporters
**So that** I can provide more value and reduce churn

**Acceptance Criteria:**
- [ ] Supporter badges on profiles and posts (bronze/silver/gold)
- [ ] Early access to content (post scheduling for public vs. supporters)
- [ ] Supporter-only Discord/community integration
- [ ] Custom supporter perks (defined per tier)
- [ ] Automatic fulfillment where possible

**Supporter Badge Tiers:**
- 🥉 Bronze: 1-3 months subscribed
- 🥈 Silver: 4-11 months subscribed
- 🥇 Gold: 12+ months subscribed
- 💎 Platinum: Top 1% lifetime supporters

**Early Access Flow:**
```
Creator schedules post:
- "Post publicly": 2025-12-25 12:00 PM
- "Early access for supporters": 2 hours before public

Timeline shows:
- Supporters see post at 10:00 AM
- Public sees post at 12:00 PM
```

**Technical Implementation:**
```javascript
// Post model with early access
CREATE TABLE posts (
  ...,
  visibility VARCHAR(50) DEFAULT 'public',  -- 'public', 'subscribers_only', 'early_access'
  publish_at TIMESTAMP,
  early_access_hours INTEGER  -- Hours before public release
);

// Timeline query (modified)
const now = new Date();

const posts = await Post.findAll({
  where: {
    [Op.or]: [
      // Public posts that are published
      {
        visibility: 'public',
        publishAt: { [Op.lte]: now }
      },
      // Early access posts for subscribers
      {
        visibility: 'early_access',
        publishAt: {
          [Op.lte]: sequelize.literal(`NOW() + INTERVAL '${post.earlyAccessHours} hours'`)
        },
        userId: {
          [Op.in]: sequelize.literal(
            `(SELECT creator_id FROM subscriptions WHERE subscriber_id = '${req.user.id}' AND status = 'active')`
          )
        }
      }
    ]
  },
  order: [['createdAt', 'DESC']]
});
```

**Discord Integration:**
```javascript
// When user subscribes, grant Discord role
const Discord = require('discord.js');

async function grantDiscordRole(userId, tier) {
  const user = await User.findByPk(userId);
  if (!user.discordId) return;

  const guild = await discordClient.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const member = await guild.members.fetch(user.discordId);

  const roleId = tier.discordRoleId;  // Configured in tier settings
  await member.roles.add(roleId);

  logger.info('Discord role granted', { userId, roleId });
}
```

**Dependencies:** Story 3.1 (Subscriptions)

**RICE Calculation:**
- Reach: 5/10 (Creators and their supporters)
- Impact: 2/3 (Reduces churn)
- Confidence: 0.7
- Effort: 5 weeks

**RICE = (5 × 2 × 0.7) / 5 = 1.4**

---

### Story 3.5: Referral Program for Growth

**Priority:** P3 (Low)
**RICE Score:** 0.8
**Effort:** 3 weeks

**User Story:**
**As a** platform user
**I want** to refer friends and earn rewards
**So that** I can help grow the platform and get benefits

**Acceptance Criteria:**
- [ ] User referral links with unique codes
- [ ] Tracking of referrals (signups, conversions)
- [ ] Rewards: 1 month free subscription for referrer + referred
- [ ] Referral dashboard showing stats
- [ ] Fraud prevention (same IP, disposable emails)

**Referral Flow:**
```
1. User generates referral link: exprsn.io/join/ABC123
2. Friend clicks link and signs up
3. Friend tagged with referral code
4. When friend subscribes to any tier:
   - Referrer gets 1 month free subscription credit
   - Friend gets 1 month 50% off first subscription
```

**Technical Implementation:**
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'converted', 'rewarded'
  converted_at TIMESTAMP,
  reward_granted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Dependencies:** Story 3.1 (Subscriptions - for rewards)

**RICE Calculation:**
- Reach: 8/10 (Could drive growth)
- Impact: 1/3 (Nice to have)
- Confidence: 0.6
- Effort: 3 weeks

**RICE = (8 × 1 × 0.6) / 3 = 1.6**

---

## Category 4: Platform Enhancements

### Story 4.1: Progressive Web App (PWA) Support

**Priority:** P1 (High)
**RICE Score:** 2.2
**Effort:** 3 weeks

**User Story:**
**As a** mobile user
**I want** to install Exprsn as an app on my phone
**So that** I can access it quickly without opening a browser

**Acceptance Criteria:**
- [ ] PWA manifest configured (name, icons, theme colors)
- [ ] Service worker for offline caching
- [ ] "Add to Home Screen" prompt
- [ ] App icons for iOS and Android (multiple sizes)
- [ ] Splash screen
- [ ] Offline mode shows cached posts
- [ ] Push notifications (opt-in)

**Benefits:**
- Native-like experience without app store approval
- Works on iOS and Android
- Offline support
- Lower barrier to "installation"

**Technical Implementation:**
```json
// public/manifest.json
{
  "name": "Exprsn",
  "short_name": "Exprsn",
  "description": "Privacy-first social and business platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d6efd",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

```javascript
// public/service-worker.js
const CACHE_NAME = 'exprsn-v1';
const urlsToCache = [
  '/',
  '/css/main.css',
  '/js/app.js',
  '/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Testing:**
- Lighthouse PWA audit (score 90+)
- Test on iOS Safari (Add to Home Screen)
- Test on Android Chrome (Install banner)

**Dependencies:** None

**RICE Calculation:**
- Reach: 9/10 (All mobile users)
- Impact: 2/3 (Significant UX improvement)
- Confidence: 1.0
- Effort: 3 weeks

**RICE = (9 × 2 × 1.0) / 3 = 6.0** ⭐

---

### Story 4.2: Advanced Search with Elasticsearch Integration

**Priority:** P2 (Medium)
**RICE Score:** 1.3
**Effort:** 6 weeks

**User Story:**
**As a** user
**I want** powerful search across posts, users, and content
**So that** I can quickly find relevant information

**Current State:**
- Basic search exists (SQL `LIKE` queries)
- Slow on large datasets
- No fuzzy matching, no relevance ranking
- Limited to exact text matches

**Acceptance Criteria:**
- [ ] Elasticsearch cluster deployed
- [ ] Posts, users, and content indexed in Elasticsearch
- [ ] Real-time index updates (on create/update/delete)
- [ ] Fuzzy matching and typo tolerance
- [ ] Relevance-based ranking
- [ ] Faceted search (filter by date, user, content type)
- [ ] Search suggestions/autocomplete
- [ ] Performance: <200ms search response time

**Search Features:**
- Full-text search across posts, comments, user bios
- Filter by: Date range, user, content type (text/image/video)
- Sort by: Relevance, date, popularity (likes/comments)
- Autocomplete suggestions as you type
- Fuzzy matching: "exprsn" matches "expression"

**Technical Implementation:**
```javascript
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

// Index post when created
async function indexPost(post) {
  await client.index({
    index: 'posts',
    id: post.id,
    document: {
      content: post.content,
      userId: post.userId,
      username: post.User.username,
      visibility: post.visibility,
      createdAt: post.createdAt,
      likeCount: post.likeCount,
      commentCount: post.commentCount
    }
  });
}

// Search API
router.get('/api/search', validateCAToken, async (req, res) => {
  const { q, type, startDate, endDate, userId } = req.query;

  const result = await client.search({
    index: type || 'posts',
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: q,
              fields: ['content^2', 'username'],  // Boost content matches
              fuzziness: 'AUTO'
            }
          }
        ],
        filter: [
          ...(startDate ? [{ range: { createdAt: { gte: startDate } } }] : []),
          ...(endDate ? [{ range: { createdAt: { lte: endDate } } }] : []),
          ...(userId ? [{ term: { userId } }] : [])
        ]
      }
    },
    sort: [
      { _score: 'desc' },  // Relevance
      { createdAt: 'desc' }
    ],
    size: 20
  });

  res.json({
    success: true,
    data: {
      results: result.hits.hits.map(hit => hit._source),
      total: result.hits.total.value
    }
  });
});
```

**Infrastructure:**
- Elasticsearch cluster (3 nodes for HA)
- Logstash for data pipeline (optional)
- Kibana for admin interface

**Dependencies:** None

**RICE Calculation:**
- Reach: 8/10 (All users benefit)
- Impact: 2/3 (Significantly improves discoverability)
- Confidence: 0.7 (Medium - Elasticsearch complexity)
- Effort: 6 weeks

**RICE = (8 × 2 × 0.7) / 6 = 1.87**

---

### Story 4.3: Content Moderation Queue and Tools

**Priority:** P2 (Medium)
**RICE Score:** 1.1
**Effort:** 5 weeks

**User Story:**
**As a** content moderator
**I want** efficient tools to review flagged content
**So that** I can keep the platform safe and compliant

**Current State:**
- `exprsn-moderator` service exists with AI moderation
- Automatic flagging for toxic content
- **No human review queue or moderation tools**

**Acceptance Criteria:**
- [ ] Moderation queue showing flagged content (pending review)
- [ ] Content preview with context (post, author, flags)
- [ ] Moderator actions: Approve, Remove, Warn user, Ban user
- [ ] Bulk actions (approve/remove multiple items)
- [ ] Moderation history and audit log
- [ ] SLA tracking (time to review flagged content)
- [ ] Appeal system for removed content

**Moderation Queue UI:**
```
+------------------------------------------+
| Flagged Content Queue (23 pending)      |
+------------------------------------------+
| Filter: [All] [Toxic] [Spam] [NSFW]    |
| Sort: [Oldest First] [Highest Severity] |
+------------------------------------------+
| [Image] Post by @username · 2h ago      |
| "This content was flagged as toxic"     |
| AI Confidence: 87%                      |
| Flags: Toxic language, Harassment       |
|                                          |
| [Approve] [Remove] [Warn User] [Ban]    |
+------------------------------------------+
| [Video] Post by @another · 5h ago       |
| ...                                      |
+------------------------------------------+
```

**Technical Implementation:**
```sql
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(50) NOT NULL,  -- 'post', 'comment', 'message'
  content_id UUID NOT NULL,
  reported_by UUID,  -- User who reported (NULL if AI-flagged)
  flag_reason VARCHAR(100) NOT NULL,  -- 'toxic', 'spam', 'nsfw', 'harassment'
  ai_confidence DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'removed'
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moderation_queue_status ON moderation_queue(status, created_at);
```

```javascript
// Moderator actions
router.post('/api/moderation/review/:id', validateCAToken, requireRole('moderator'), async (req, res) => {
  const { action, notes } = req.body;  // 'approve', 'remove', 'warn', 'ban'

  const item = await ModerationQueue.findByPk(req.params.id);

  switch (action) {
    case 'approve':
      await item.update({ status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date(), notes });
      break;

    case 'remove':
      await item.update({ status: 'removed', reviewedBy: req.user.id, reviewedAt: new Date(), notes });
      // Soft delete the content
      await Post.update({ deletedAt: new Date() }, { where: { id: item.contentId } });
      break;

    case 'warn':
      // Send warning notification to user
      await sendWarning(item.userId, notes);
      await item.update({ status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date(), notes });
      break;

    case 'ban':
      // Ban the user
      await User.update({ status: 'banned' }, { where: { id: item.userId } });
      await item.update({ status: 'removed', reviewedBy: req.user.id, reviewedAt: new Date(), notes });
      break;
  }

  res.json({ success: true });
});
```

**SLA Tracking:**
- Target: Review flagged content within 24 hours
- Alert: If queue backlog > 50 items

**Dependencies:** Story 1.2 (Error Tracking - for alerts)

**RICE Calculation:**
- Reach: 5/10 (Affects platform safety)
- Impact: 3/3 (Critical for trust and safety)
- Confidence: 0.7
- Effort: 5 weeks

**RICE = (5 × 3 × 0.7) / 5 = 2.1**

---

### Story 4.4: Notification Preferences and Management

**Priority:** P2 (Medium)
**RICE Score:** 1.3
**Effort:** 3 weeks

**User Story:**
**As a** user
**I want** to control which notifications I receive
**So that** I'm not overwhelmed and can focus on what matters to me

**Current State:**
- `exprsn-herald` sends notifications
- No user preferences (all or nothing)
- Email, in-app, and push notifications sent for all events

**Acceptance Criteria:**
- [ ] Notification preferences UI (settings page)
- [ ] Granular controls by notification type and channel
- [ ] Notification types: Likes, comments, mentions, new followers, subscriptions
- [ ] Channels: Email, in-app, push (mobile)
- [ ] Quiet hours (don't send notifications 10 PM - 8 AM)
- [ ] Digest mode (daily/weekly summary instead of individual notifications)
- [ ] Mute specific users or conversations

**Notification Preferences UI:**
```
+---------------------------------------+
| Notification Preferences              |
+---------------------------------------+
| Notification Type    | Email | In-App | Push |
|---------------------|-------|--------|------|
| Likes on my posts   | ✓     | ✓      | ✗    |
| Comments on posts   | ✓     | ✓      | ✓    |
| Mentions (@me)      | ✓     | ✓      | ✓    |
| New followers       | ✓     | ✓      | ✗    |
| Messages            | ✓     | ✓      | ✓    |
| Subscriptions       | ✓     | ✓      | ✓    |
+---------------------------------------+
| Quiet Hours: [10:00 PM] - [8:00 AM]  |
| Time Zone: [America/New_York]         |
+---------------------------------------+
| Digest Mode: [✓] Send daily summary   |
+---------------------------------------+
```

**Technical Implementation:**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "likes": {"email": true, "inApp": true, "push": false},
    "comments": {"email": true, "inApp": true, "push": true},
    "mentions": {"email": true, "inApp": true, "push": true},
    "followers": {"email": true, "inApp": true, "push": false},
    "messages": {"email": true, "inApp": true, "push": true},
    "subscriptions": {"email": true, "inApp": true, "push": true}
  }',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  digest_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

```javascript
// Check preferences before sending notification
async function shouldSendNotification(userId, type, channel) {
  const prefs = await NotificationPreferences.findOne({ where: { userId } });

  if (!prefs) return true;  // Default: send all notifications

  // Check if notification type + channel is enabled
  if (!prefs.preferences[type]?.[channel]) {
    return false;
  }

  // Check quiet hours
  if (prefs.quietHoursStart && prefs.quietHoursEnd) {
    const now = moment.tz(prefs.timezone);
    const quietStart = moment.tz(prefs.quietHoursStart, 'HH:mm', prefs.timezone);
    const quietEnd = moment.tz(prefs.quietHoursEnd, 'HH:mm', prefs.timezone);

    if (now.isBetween(quietStart, quietEnd)) {
      return false;  // Quiet hours active
    }
  }

  return true;
}
```

**Dependencies:** None

**RICE Calculation:**
- Reach: 9/10 (All users receive notifications)
- Impact: 2/3 (Improves user experience significantly)
- Confidence: 1.0
- Effort: 3 weeks

**RICE = (9 × 2 × 1.0) / 3 = 6.0** ⭐

---

### Story 4.5: User Blocking and Reporting

**Priority:** P1 (High)
**RICE Score:** 1.6
**Effort:** 3 weeks

**User Story:**
**As a** user
**I want** to block and report abusive users
**So that** I can protect myself from harassment

**Current State:**
- No user blocking functionality
- No reporting mechanism (beyond AI moderation)

**Acceptance Criteria:**
- [ ] Block user action (prevents seeing their content)
- [ ] Blocked users cannot message or interact with blocker
- [ ] Report user for: Harassment, spam, impersonation, other
- [ ] Reported users flagged for moderation review
- [ ] View list of blocked users (and unblock)
- [ ] Blocklist is private (blocked user doesn't know)

**UI:**
```
User Profile → [...] Menu →
- [Report @username]
- [Block @username]

Report Dialog:
Reason: [Harassment ▼]
Details: [Optional description...]
[Cancel] [Submit Report]
```

**Technical Implementation:**
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  reported_content_id UUID,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_reports_status ON reports(status, created_at);
```

```javascript
// Filter blocked users from timeline
router.get('/api/timeline', validateCAToken, async (req, res) => {
  const blockedIds = await Block.findAll({
    where: { blockerId: req.user.id },
    attributes: ['blockedId']
  }).map(b => b.blockedId);

  const posts = await Post.findAll({
    where: {
      userId: { [Op.notIn]: blockedIds },  // Exclude blocked users
      // ... other filters
    }
  });

  res.json({ success: true, data: posts });
});

// Prevent blocked users from messaging
router.post('/api/messages', validateCAToken, async (req, res) => {
  const { recipientId } = req.body;

  // Check if sender is blocked by recipient
  const isBlocked = await Block.findOne({
    where: {
      blockerId: recipientId,
      blockedId: req.user.id
    }
  });

  if (isBlocked) {
    return res.status(403).json({
      success: false,
      error: 'BLOCKED',
      message: 'You cannot send messages to this user'
    });
  }

  // Send message...
});
```

**Dependencies:** Story 4.3 (Moderation Queue - for processing reports)

**RICE Calculation:**
- Reach: 7/10 (Many users will block/report)
- Impact: 3/3 (Critical for user safety)
- Confidence: 1.0
- Effort: 3 weeks

**RICE = (7 × 3 × 1.0) / 3 = 7.0** ⭐

---

### Story 4.6: Two-Factor Authentication (2FA) for All Users

**Priority:** P1 (High)
**RICE Score:** 1.8
**Effort:** 2 weeks

**User Story:**
**As a** user
**I want** to enable two-factor authentication on my account
**So that** my account is protected even if my password is compromised

**Current State:**
- MFA exists in `exprsn-auth` for specific operations
- Not widely available or promoted to all users

**Acceptance Criteria:**
- [ ] 2FA enrollment flow (TOTP, SMS, or email)
- [ ] QR code for authenticator apps (Google Authenticator, Authy)
- [ ] Backup codes generated during enrollment (10 single-use codes)
- [ ] 2FA prompt on login (after password)
- [ ] Recovery options if 2FA device lost
- [ ] 2FA status badge on profile (verified checkmark)

**2FA Enrollment Flow:**
```
1. User navigates to Settings → Security → Enable 2FA
2. Choose method: Authenticator App, SMS, or Email
3. For Authenticator:
   - Display QR code
   - User scans with app
   - User enters 6-digit code to verify
4. Display 10 backup codes (user must save)
5. 2FA enabled! ✅
```

**Technical Implementation:**
```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 2FA secret
router.post('/api/auth/2fa/enable', validateCAToken, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `Exprsn (${req.user.email})`
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  // Store in database (encrypted)
  await User.update({
    twoFactorSecret: encrypt(secret.base32),
    twoFactorBackupCodes: backupCodes.map(encrypt),
    twoFactorEnabled: false  // Not yet verified
  }, { where: { id: req.user.id } });

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    }
  });
});

// Verify and activate 2FA
router.post('/api/auth/2fa/verify', validateCAToken, async (req, res) => {
  const { code } = req.body;

  const user = await User.findByPk(req.user.id);
  const secret = decrypt(user.twoFactorSecret);

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 2  // Allow 2 time steps (60 seconds)
  });

  if (!verified) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_CODE',
      message: 'Invalid verification code'
    });
  }

  await user.update({ twoFactorEnabled: true });

  res.json({ success: true, message: '2FA enabled successfully' });
});

// Login with 2FA
router.post('/api/auth/login', async (req, res) => {
  // ... password verification ...

  if (user.twoFactorEnabled) {
    // Send 2FA challenge
    return res.status(200).json({
      success: false,
      requires2FA: true,
      userId: user.id
    });
  }

  // ... normal login flow ...
});

router.post('/api/auth/login/2fa', async (req, res) => {
  const { userId, code } = req.body;

  const user = await User.findByPk(userId);
  const secret = decrypt(user.twoFactorSecret);

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 2
  });

  if (!verified) {
    // Check backup codes
    const backupCodes = user.twoFactorBackupCodes.map(decrypt);
    const backupIndex = backupCodes.indexOf(code);

    if (backupIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE'
      });
    }

    // Invalidate used backup code
    backupCodes.splice(backupIndex, 1);
    await user.update({
      twoFactorBackupCodes: backupCodes.map(encrypt)
    });
  }

  // Generate session token
  const token = generateCAToken(user);

  res.json({ success: true, token });
});
```

**Dependencies:** None (Auth service already has MFA foundation)

**RICE Calculation:**
- Reach: 9/10 (All users should use 2FA)
- Impact: 3/3 (Critical for security)
- Confidence: 1.0
- Effort: 2 weeks

**RICE = (9 × 3 × 1.0) / 2 = 13.5** ⭐⭐⭐ Highest priority

---

## Category 5: Strategic Differentiation

### Story 5.1: ActivityPub Federation Support (Mastodon Compatibility)

**Priority:** P2 (Medium)
**RICE Score:** 0.75
**Effort:** 15 weeks

**User Story:**
**As a** user
**I want** to follow and be followed by users on Mastodon and other ActivityPub platforms
**So that** I can participate in the fediverse ecosystem

**Market Analysis:**
- Mastodon: 10M+ users
- Fediverse growing post-Twitter exodus
- Privacy-conscious users value federation

**Acceptance Criteria:**
- [ ] Implement ActivityPub C2S (Client-to-Server) protocol
- [ ] Implement ActivityPub S2S (Server-to-Server) protocol
- [ ] WebFinger endpoint for user discovery
- [ ] HTTP signature verification for federation security
- [ ] Federated timeline (posts from remote instances)
- [ ] Follow/unfollow remote users
- [ ] Boost (repost) and favorite (like) federated posts
- [ ] Federated private messages (optional - complex)

**Technical Complexity:** High
- Complex protocol with many edge cases
- Security considerations (HTTP signatures, actor verification)
- Spam and moderation challenges from remote instances
- Performance implications (caching remote actors)

**Technical Implementation:**
```javascript
// WebFinger endpoint for user discovery
router.get('/.well-known/webfinger', async (req, res) => {
  const { resource } = req.query;
  // resource = acct:username@exprsn.io

  const username = resource.split('@')[1];
  const user = await User.findOne({ where: { username } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    subject: resource,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `https://exprsn.io/users/${user.id}`
      }
    ]
  });
});

// ActivityPub Actor endpoint
router.get('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);

  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Person',
    id: `https://exprsn.io/users/${user.id}`,
    preferredUsername: user.username,
    name: user.displayName,
    summary: user.bio,
    inbox: `https://exprsn.io/users/${user.id}/inbox`,
    outbox: `https://exprsn.io/users/${user.id}/outbox`,
    publicKey: {
      id: `https://exprsn.io/users/${user.id}#main-key`,
      owner: `https://exprsn.io/users/${user.id}`,
      publicKeyPem: user.publicKeyPem
    }
  });
});

// Inbox for receiving federated activities
router.post('/users/:id/inbox', async (req, res) => {
  // Verify HTTP signature
  const verified = await verifyHTTPSignature(req);
  if (!verified) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const activity = req.body;

  // Process activity based on type
  switch (activity.type) {
    case 'Follow':
      await handleFollow(activity);
      break;
    case 'Create':
      await handleCreate(activity);
      break;
    case 'Like':
      await handleLike(activity);
      break;
    case 'Announce':
      await handleAnnounce(activity);
      break;
  }

  res.status(202).json({ received: true });
});
```

**Recommendation:** Defer to Q3 2026 (after higher-priority features)

**Alternative:** Lightweight cross-posting to Mastodon via OAuth (2 weeks, RICE: 1.5)

**Dependencies:** None

**RICE Calculation:**
- Reach: 8/10 (Access to fediverse)
- Impact: 2/3 (Nice to have)
- Confidence: 0.7
- Effort: 15 weeks

**RICE = (8 × 2 × 0.7) / 15 = 0.75**

---

### Story 5.2: Native Mobile Apps (iOS and Android)

**Priority:** P1 (High)
**RICE Score:** 2.4
**Effort:** 20 weeks

**User Story:**
**As a** mobile user
**I want** native iOS and Android apps
**So that** I can have the best possible mobile experience

**Market Validation:**
- 70%+ of social media usage is mobile
- Native apps have higher engagement than web
- App store presence increases discoverability

**Recommendation:** High strategic value, but significant effort. Consider:
1. **Phase 1:** PWA (Story 4.1) as stopgap (3 weeks)
2. **Phase 2:** React Native app for both iOS and Android (20 weeks)

**Acceptance Criteria:**
- [ ] React Native app supporting iOS 15+ and Android 10+
- [ ] Core features: Timeline, messaging, notifications, profile
- [ ] Push notifications via Firebase Cloud Messaging (FCM)
- [ ] Offline mode with local caching
- [ ] Biometric authentication (Face ID, fingerprint)
- [ ] Camera integration for photo/video uploads
- [ ] App store listings (screenshots, descriptions)
- [ ] Beta testing via TestFlight (iOS) and Google Play Beta

**Technical Stack:**
- **Framework:** React Native (single codebase for iOS + Android)
- **Navigation:** React Navigation
- **State:** Redux or Zustand
- **API:** Existing Exprsn REST APIs
- **Push:** Firebase Cloud Messaging
- **Storage:** AsyncStorage or SQLite

**Effort Breakdown:**
- Core app structure: 4 weeks
- Timeline & posts: 4 weeks
- Messaging: 3 weeks
- Notifications: 2 weeks
- Profile & settings: 2 weeks
- Camera & media: 2 weeks
- Testing & polish: 3 weeks
- **Total: 20 weeks (~5 months)**

**Dependencies:** Story 4.1 (PWA as interim solution)

**RICE Calculation:**
- Reach: 9/10 (Most users are mobile)
- Impact: 3/3 (Transformative for mobile UX)
- Confidence: 0.8
- Effort: 20 weeks

**RICE = (9 × 3 × 0.8) / 20 = 1.08**

**Note:** Consider hiring mobile developers or outsourcing to accelerate.

---

### Story 5.3: End-to-End Encrypted Group Chats

**Priority:** P2 (Medium)
**RICE Score:** 1.0
**Effort:** 6 weeks

**User Story:**
**As a** user concerned about privacy
**I want** group chats with end-to-end encryption
**So that** only group members can read our conversations

**Current State:**
- `exprsn-spark` has E2EE for 1-on-1 messages
- Group chats exist but not E2EE

**Acceptance Criteria:**
- [ ] E2EE group chats up to 50 members
- [ ] Signal Protocol or similar (double ratchet)
- [ ] Key distribution and rotation for new members
- [ ] Member add/remove triggers key rotation
- [ ] "Verified" indicator for E2EE groups
- [ ] Fallback to non-E2EE for large groups (>50 members)

**Technical Complexity:** High
- Key distribution to all members
- Key rotation when membership changes
- Handling offline members

**Dependencies:** None (Spark already has E2EE foundation)

**RICE Calculation:**
- Reach: 5/10 (Subset of users value E2EE)
- Impact: 2/3 (Strengthens privacy positioning)
- Confidence: 0.6
- Effort: 6 weeks

**RICE = (5 × 2 × 0.6) / 6 = 1.0**

---

### Story 5.4: Self-Hosted Instance Support (Federation)

**Priority:** P3 (Low)
**RICE Score:** 0.6
**Effort:** 12 weeks

**User Story:**
**As an** organization
**I want** to run my own Exprsn instance on my infrastructure
**So that** I have full control over data and compliance

**Acceptance Criteria:**
- [ ] Docker Compose deployment for self-hosting
- [ ] Setup wizard for initial configuration
- [ ] Federation protocol to connect instances
- [ ] Admin dashboard for instance management
- [ ] Documentation for self-hosting
- [ ] Support for custom domains

**Market:** Small subset of privacy-focused organizations

**Recommendation:** Defer to 2026 H2 or later (niche market, high complexity)

**Dependencies:** Story 5.1 (ActivityPub) or custom federation protocol

**RICE Calculation:**
- Reach: 2/10 (Very niche market)
- Impact: 3/3 (Critical for those who need it)
- Confidence: 0.6
- Effort: 12 weeks

**RICE = (2 × 3 × 0.6) / 12 = 0.3**

---

### Story 5.5: AI-Powered Content Recommendations

**Priority:** P2 (Medium)
**RICE Score:** 1.2
**Effort:** 8 weeks

**User Story:**
**As a** user
**I want** personalized content recommendations
**So that** I discover interesting posts and users

**Acceptance Criteria:**
- [ ] "For You" feed with AI-recommended posts
- [ ] Recommendation algorithm based on engagement history
- [ ] User control: Tune recommendations (more/less of certain topics)
- [ ] Recommendation transparency (why this was recommended)
- [ ] A/B test recommendations vs. chronological feed

**Technical Approach:**
- Collaborative filtering (users with similar engagement patterns)
- Content-based filtering (posts similar to ones you liked)
- Hybrid approach combining both

**Privacy Considerations:**
- Recommendations computed server-side (not shared with third parties)
- User can opt out of recommendations entirely

**Dependencies:** None (but benefits from Story 4.2 - Elasticsearch for content analysis)

**RICE Calculation:**
- Reach: 8/10 (All users could benefit)
- Impact: 2/3 (Improves engagement)
- Confidence: 0.6 (Medium - algorithm quality uncertain)
- Effort: 8 weeks

**RICE = (8 × 2 × 0.6) / 8 = 1.2**

---

## Appendix: RICE Scoring Summary

### Top 10 Priorities by RICE Score

| Rank | Story | RICE Score | Priority | Effort |
|------|-------|------------|----------|--------|
| 1 | Story 1.7: CA Certificate Monitoring | 13.5 | P0 | 2 weeks |
| 2 | Story 4.6: 2FA for All Users | 13.5 | P1 | 2 weeks |
| 3 | Story 1.2: Centralized Error Tracking | 9.0 | P1 | 2 weeks |
| 4 | Story 1.5: Database Connection Pooling | 7.0 | P1 | 2 weeks |
| 5 | Story 4.5: User Blocking & Reporting | 7.0 | P1 | 3 weeks |
| 6 | Story 1.8: Backup Verification | 6.4 | P1 | 3 weeks |
| 7 | Story 1.3: Health Check Dependencies | 6.0 | P0 | 3 weeks |
| 8 | Story 4.1: PWA Support | 6.0 | P1 | 3 weeks |
| 9 | Story 4.4: Notification Preferences | 6.0 | P2 | 3 weeks |
| 10 | Story 3.2: One-Time Tipping | 4.67 | P2 | 3 weeks |

### Recommended Q1 2026 Sprint Plan (12-week quarter)

**Sprint 1-2 (Weeks 1-4): Critical Stability**
- Story 1.7: CA Certificate Monitoring (2 weeks)
- Story 4.6: 2FA for All Users (2 weeks)
- Story 1.2: Centralized Error Tracking (2 weeks)
- Story 1.5: Database Connection Pooling (2 weeks)

**Sprint 3-4 (Weeks 5-8): User Safety & Platform Enhancements**
- Story 4.5: User Blocking & Reporting (3 weeks)
- Story 1.8: Backup Verification (3 weeks)
- Story 4.1: PWA Support (3 weeks)

**Sprint 5-6 (Weeks 9-12): Creator Economy Foundation**
- Story 3.1: Creator Subscriptions (10 weeks - starts in Sprint 3, finishes in Q2)
- Story 3.2: One-Time Tipping (3 weeks)
- Story 4.4: Notification Preferences (3 weeks)

**Q2 2026 Focus:**
- Complete Forge Groupware (Story 2.1)
- Advanced Search (Story 4.2)
- Mobile apps planning/kick-off (Story 5.2)

---

## Conclusion

This backlog provides **28 well-defined stories** across 5 strategic categories. The recommended Q1 2026 focus prioritizes:

1. **Stability & Security** (Stories 1.2, 1.5, 1.7, 1.8, 4.6) - Foundation for growth
2. **User Safety** (Stories 4.5, 4.3) - Trust and safety are table stakes
3. **Platform Enhancements** (Stories 4.1, 4.4) - Improve core UX
4. **Creator Economy** (Stories 3.1, 3.2) - Strategic differentiation and monetization

**Total Q1 Effort:** ~24 weeks of work (achievable with 3-4 developers)

**Next Steps:**
1. Review and approve Q1 roadmap with stakeholders
2. Assign stories to developers based on expertise
3. Begin Sprint 1 with critical stability stories
4. Revisit backlog quarterly and adjust based on learnings

---

**Document Version:** 1.0
**Last Updated:** 2025-12-22
**Next Review:** 2026-01-31
