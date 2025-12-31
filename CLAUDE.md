# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Platform:** Exprsn Certificate Authority Ecosystem
**Architecture:** Microservices monorepo with 23 services
**Primary Language:** JavaScript/Node.js 18+
**Database:** PostgreSQL (database-per-service pattern)
**Cache:** Redis 7+

---

## Essential Commands

### Initial Setup
```bash
# Install all dependencies (root + all workspace services)
npm install

# Initialize entire system (creates databases, runs migrations, seeds data)
npm run init

# Start all production-ready services (15 services)
npm start

# Start specific services (configured in .env AUTO_START_SERVICES)
AUTO_START_SERVICES=ca,setup,timeline,bridge npm start
```

### Development Workflow
```bash
# Start specific service with hot-reload
npm run dev:timeline
npm run dev:auth
npm run dev:spark
npm run dev:workflow
npm run dev:bluesky
npm run dev:payments

# Run migrations for a specific service
cd src/exprsn-ca
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo  # Rollback last migration

# Run tests
npm run test:all              # All services
cd src/exprsn-timeline
npm test                      # Single service
npm run test:coverage         # With coverage
```

### Service Management
```bash
# Health monitoring
npm run health               # Check all services
npm run health:watch         # Continuous monitoring

# System reset (interactive menu)
npm run reset
npm run reset:full           # Nuclear option: drops everything
npm run reset:data           # Reset data only
npm run reset:cache          # Clear Redis cache
```

---

## Architecture Overview

### Microservices with Database-Per-Service

This is an **npm workspaces monorepo** where each service in `src/exprsn-*` is independently deployable with its own:
- PostgreSQL database (e.g., `exprsn_ca`, `exprsn_auth`, `exprsn_timeline`)
- `package.json` with service-specific dependencies
- Sequelize models and migrations in service directory
- Express application on dedicated port

### Critical Service Dependency: CA Must Start First

**exprsn-ca (Port 3000)** is the certificate authority that MUST start before other services. All inter-service communication uses CA-signed tokens for authentication.

**Service startup order:**
1. **exprsn-ca** (Port 3000) - Certificate Authority & token validation
2. **exprsn-setup** (Port 3015) - Service discovery and management
3. All other services can start in any order

Control which services auto-start via `.env`:
```bash
AUTO_START_SERVICES=ca,setup,timeline,bridge
```

If `AUTO_START_SERVICES` is not set, all production-ready services start automatically (15 services).

### CA Token Authentication System

All API requests between services use **CA Tokens** - cryptographically signed tokens with fine-grained permissions:

```javascript
{
  id: "UUID",
  version: "1.0",
  permissions: { read: true, write: false, append: false, delete: false, update: false },
  resource: { type: "url", value: "https://api.exprsn.io/resource/*" },
  expiryType: "time",
  expiresAt: 1730419200000,
  signature: "base64-rsa-pss"  // ALWAYS RSA-SHA256-PSS, never plain RSA
}
```

**Security rules:**
- Always use RSA-SHA256-PSS for signatures (RSA-PSS padding with SHA-256)
- Minimum 2048-bit RSA keys (4096-bit for root CA)
- Never skip signature verification
- Always validate OCSP status before trusting certificates
- Token checksum uses SHA-256
- Maximum token size: 65536 bytes

### Shared Library (@exprsn/shared)

The `src/shared/` package provides common middleware and utilities used across all services:

**Key middleware:**
- `validateCAToken` - Authenticate requests with CA tokens
- `requirePermissions({ write: true })` - Check token permissions
- `requireRole('admin')` - Role-based access control
- `asyncHandler` - Async/await error handling wrapper
- `createRateLimiter` - Redis-backed rate limiting
- `autoAudit` - Automatic audit logging
- `authenticateSocket` - Socket.IO authentication

**Usage pattern:**
```javascript
const { validateCAToken, requirePermissions, asyncHandler, logger } = require('@exprsn/shared');

router.post('/posts',
  validateCAToken,
  requirePermissions({ write: true }),
  asyncHandler(async (req, res) => {
    logger.info('Creating post', { userId: req.user.id });
    // Implementation here
  })
);
```

### Service-to-Service Communication

Use the shared `serviceRequest` utility for inter-service calls with automatic token generation and caching:

```javascript
const { serviceRequest } = require('@exprsn/shared');

const response = await serviceRequest({
  method: 'POST',
  url: 'http://localhost:3014/api/notifications/bulk',
  data: { type: 'new_post', userId, postId },
  serviceName: 'exprsn-timeline',
  resource: 'http://localhost:3014/api/notifications/*',
  permissions: { write: true }
});
```

Service tokens are automatically cached and refreshed by the `ServiceTokenCache`.

---

## Database Conventions

### Migration Pattern

Each service has its own migrations in `src/exprsn-{service}/migrations/`:

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Always add indexes for foreign keys and frequently queried columns
    await queryInterface.addIndex('posts', ['user_id']);
    await queryInterface.addIndex('posts', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('posts');
  }
};
```

**Naming conventions:**
- Tables: `snake_case` plural (e.g., `user_profiles`, `group_members`)
- Columns: `snake_case` (e.g., `created_at`, `user_id`)
- Primary keys: `id` (UUID v4)
- Foreign keys: `{table}_id` (e.g., `user_id`, `post_id`)
- Timestamps: `created_at`, `updated_at` (auto-managed by Sequelize)

**Running migrations:**
```bash
# All services
npm run migrate:all

# Specific service
cd src/exprsn-{service}
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo      # Rollback one
npx sequelize-cli db:migrate:undo:all  # Rollback all
```

---

## Common Patterns

### Standard Service Structure

```
src/exprsn-{service}/
├── index.js              # Entry point
├── package.json          # Service dependencies
├── routes/               # Express route handlers
├── controllers/          # Business logic (some services use services/ instead)
├── services/             # Business logic and external integrations
├── models/               # Sequelize models
├── middleware/           # Service-specific middleware
├── utils/                # Helper functions
├── migrations/           # Sequelize migrations
├── seeders/              # Sequelize seeders
├── views/                # EJS templates (if web UI)
├── public/               # Static assets (if web UI)
└── tests/                # Jest tests
```

### Error Response Format

**Always use consistent error responses:**

```javascript
// Success
res.json({
  success: true,
  data: result
});

// Error
res.status(400).json({
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Content is required',
  details: { field: 'content' }
});
```

**Standard error codes:**
- `INVALID_TOKEN` - Token validation failed
- `EXPIRED_TOKEN` - Token has expired
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### Input Validation with Joi

Always validate user input:

```javascript
const Joi = require('joi');

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  username: Joi.string().alphanum().min(3).max(30).required()
});

const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({
    success: false,
    error: 'VALIDATION_ERROR',
    message: error.details[0].message
  });
}
```

---

## Background Jobs with Bull Queues

Use Bull queues (Redis-backed) for asynchronous operations:

```javascript
const Queue = require('bull');

const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Add job
await notificationQueue.add({
  userId: user.id,
  type: 'post_like',
  data: { postId, likerId }
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Process jobs (in worker file)
notificationQueue.process(async (job) => {
  await sendNotification(job.data);
});
```

Services with workers:
- **exprsn-timeline** - Fan-out operations for social feed
- **exprsn-moderator** - AI content moderation
- **exprsn-gallery** - Image/video processing
- **exprsn-herald** - Notification delivery

---

## Complete Service Registry

### Production Services (15 services - 100% complete)

#### exprsn-ca (Port 3000)
**Certificate Authority** - MUST START FIRST. Handles X.509 certificates, CA token generation/validation, OCSP responses (Port 2560), CRL distribution. Uses 4096-bit RSA for root CA, 2048-bit for end entities.

#### exprsn-setup (Port 3015)
**Setup & Management** - Service discovery, environment configuration, system initialization. Provides health checks and service registry.

#### exprsn-auth (Port 3001)
**Authentication & SSO** - OAuth2/OIDC provider, SAML 2.0 SSO, MFA (TOTP/SMS/email/hardware), session management. 260+ test cases. Integrates with Google/GitHub OAuth.

#### exprsn-spark (Port 3002)
**Real-time Messaging** - WebSocket-based instant messaging with end-to-end encryption (E2EE), presence tracking, typing indicators, read receipts. Uses Socket.IO.

#### exprsn-timeline (Port 3004)
**Social Feed** - Social timeline with Bull queues for fan-out, Elasticsearch + PostgreSQL for search, integrates with Herald for notifications. Includes worker process.

#### exprsn-prefetch (Port 3005)
**Timeline Prefetching** - Optimized timeline feed prefetching and caching layer. Reduces latency for frequently accessed feeds.

#### exprsn-moderator (Port 3006)
**Content Moderation** - AI-powered content moderation with configurable rules, automatic flagging, review workflows. Uses Bull queue worker for async processing.

#### exprsn-filevault (Port 3007)
**File Storage** - S3-compatible file storage with encryption at rest, virus scanning, quota management. Supports local disk and cloud storage backends.

#### exprsn-gallery (Port 3008)
**Media Galleries** - Photo/video galleries with image processing (resize, crop, filters), EXIF data extraction, thumbnail generation. Uses worker for media processing.

#### exprsn-live (Port 3009)
**Live Streaming** - WebRTC-based live video streaming, HLS/DASH transcoding, viewer analytics, chat integration.

#### exprsn-bridge (Port 3010)
**API Gateway** - Unified API gateway with request routing, rate limiting, request/response transformation, API versioning.

#### exprsn-nexus (Port 3011)
**Groups & Events** - Social groups, events management, RSVP tracking, group messaging, event calendars.

#### exprsn-pulse (Port 3012)
**Analytics & Metrics** - Real-time analytics, custom dashboards, Prometheus metrics export, performance monitoring.

#### exprsn-vault (Port 3013)
**Secrets Management** - Centralized secrets storage with encryption, access control, audit logging, key rotation.

#### exprsn-herald (Port 3014)
**Notifications & Alerts** - Multi-channel notifications (email, SMS, push, in-app), templating, delivery tracking. Uses worker for async delivery.

#### exprsn-svr (Port 5001)
**Business Hub** - Unified business application platform combining Low-Code and Forge (merged December 2024):
- **Low-Code Platform** (`/lowcode`): Entity Designer, Form Designer (27 components), Grid Designer, Visual Query Builder
- **Forge CRM** (`/forge/crm`): 92 endpoints - Contact, Account, Lead, Opportunity, Case, Task (100% complete)
- **Forge Groupware** (`/forge/groupware`): Calendar (CalDAV), email, tasks, documents
- **Forge ERP** (`/forge/erp`): Financial, inventory, HR, assets, reporting
- **Integration:** Workflow automation, JSONLex expressions, schema management, dynamic DDL
- **Frontend:** React/Vite SPA with Bootstrap 5.3 UI

#### exprsn-workflow (Port 3017)
**Workflow Automation** - Visual workflow builder with 15 step types including sandboxed JavaScript execution (VM2), real-time tracking via Socket.IO, conditional branching, loops.

### Development Services

#### exprsn-payments (Port 3018)
**Payment Processing** - Multi-gateway payment processing (Stripe, PayPal, Authorize.Net), Bull queue worker, subscription management, PCI-DSS compliant tokenization.

#### exprsn-atlas (Port 3019)
**Geospatial Services** - PostGIS-based location services, geocoding, reverse geocoding, route planning, geofencing, heatmaps.

#### exprsn-dbadmin (Port TBD)
**Database Administration** - Web-based database management UI, query builder, schema migrations, backup/restore.

#### exprsn-bluesky (Port TBD)
**Bluesky/AT Protocol Integration** - AT Protocol client, cross-posting to Bluesky, identity verification, DID management.

---

## Development Guidelines

### DO:
- Use `@exprsn/shared` for common middleware/utilities
- Add Joi validation for all user inputs
- Use CA token system for authentication between services
- Use Sequelize for database queries with parameterized queries
- Add indexes for foreign keys and frequently queried columns
- Use Bull queues for background jobs (if Redis enabled)
- Log with structured logging via shared `logger`
- Use bcrypt with 12+ rounds for password hashing
- Apply rate limiting to public endpoints
- Sanitize HTML content with `sanitize-html`

### DON'T:
- Weaken cryptographic security (always use RSA-PSS with SHA-256)
- Skip input validation on user-supplied data
- Log private keys, secrets, or full tokens (log token ID only)
- Use string concatenation for SQL queries
- Bypass authentication middleware
- Use synchronous blocking operations in request handlers
- Store passwords in plaintext
- Disable CSRF protection on web UIs
- Skip OCSP validation when checking certificates

### Security Critical
- **SQL Injection:** Always use Sequelize parameterized queries, never string concatenation
- **XSS:** Sanitize HTML content with `sanitize-html`, escape output in templates
- **Rate Limiting:** Apply rate limiters from `@exprsn/shared` to auth and public endpoints
- **CSRF:** Use csurf middleware for web UIs with forms
- **Passwords:** Use bcrypt with 12 rounds minimum, enforce password complexity
- **Token Security:** Always validate CA token signatures, check OCSP status, verify expiry
- **File Uploads:** Validate file types, scan for viruses, enforce size limits
- **Session Security:** Use secure cookies in production, set appropriate expiry

---

## Troubleshooting

### Database Connection Errors
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@15

# Verify .env credentials
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password

# Create database if missing
npm run db:create
```

### Token Validation Failures
- Check certificate not revoked (OCSP status at port 2560)
- Verify certificate/key pair match
- Ensure using RSA-SHA256-PSS signature algorithm (not plain RSA)
- Confirm token not expired (check `expiresAt` timestamp)
- Verify resource pattern matches request URL
- Check required permissions are granted

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Redis Connection Errors
```bash
# Check Redis is running
redis-cli ping

# Start Redis (macOS)
brew services start redis

# Disable Redis if not needed
REDIS_ENABLED=false npm start
```

### Service Startup Issues
```bash
# Check setup completed
npm run preflight

# Fix setup issues
npm run preflight:fix

# Reinitialize system
npm run init:force

# Start CA first
npm run start:ca

# Then start other services
npm start
```

---

## Environment Variables

Key variables (see `.env.example` for complete list):

### Core Settings
```bash
NODE_ENV=development|production
PORT=3000

# Service startup control
AUTO_START_SERVICES=ca,setup,timeline,bridge
# If not set, all production services start automatically
```

### Database (each service has its own DB)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_ca  # Service-specific
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Redis
```bash
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=exprsn:ca:
```

### CA Configuration
```bash
CA_NAME=Exprsn Root CA
CA_DOMAIN=localhost
OCSP_ENABLED=true
OCSP_PORT=2560
CRL_ENABLED=true

# Certificate validity (in days)
CA_ROOT_VALIDITY_DAYS=7300
CA_INTERMEDIATE_VALIDITY_DAYS=3650
CA_ENTITY_VALIDITY_DAYS=365

# Key sizes (in bits)
CA_ROOT_KEY_SIZE=4096
CA_INTERMEDIATE_KEY_SIZE=4096
CA_ENTITY_KEY_SIZE=2048
```

### JWT Configuration
```bash
JWT_PRIVATE_KEY=  # RSA 4096-bit, base64-encoded PEM
JWT_PUBLIC_KEY=   # RSA 4096-bit, base64-encoded PEM
JWT_ISSUER=exprsn-ca
JWT_ALGORITHM=RS256
JWT_ACCESS_TOKEN_EXPIRY=3600
JWT_REFRESH_TOKEN_EXPIRY=2592000
```

### Session Configuration
```bash
SESSION_SECRET=  # Generate with: npm run setup
SESSION_MAX_AGE=86400000
SESSION_SECURE=false  # Set true in production
SESSION_SAME_SITE=lax
```

### Security Settings
```bash
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TICKET_EXPIRY_SECONDS=300
```

### SAML SSO (exprsn-auth)
```bash
SAML_ENABLED=false
SAML_ENTITY_ID=https://auth.exprsn.io
SAML_CALLBACK_URL=http://localhost:3001/api/saml/callback
SAML_CERT_PATH=./keys/saml-cert.pem
SAML_KEY_PATH=./keys/saml-key.pem
SAML_IDP_ENTITY_ID=
SAML_IDP_SSO_URL=
SAML_AUTO_PROVISION=true
```

---

## Testing

```bash
# All services
npm run test:all
npm run test:coverage

# Specific service
cd src/exprsn-timeline
npm test
npm run test:coverage
```

**Coverage goals:**
- Minimum: 60% overall
- Target: 70%+
- Critical paths (auth, tokens, payments, CA): 90%+

**Test structure:**
```javascript
const request = require('supertest');
const app = require('../index');

describe('POST /api/posts', () => {
  it('should create a new post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: 'Test post' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe('Test post');
  });
});
```

---

## Production Deployment

### Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `SESSION_SECRET`
- [ ] Generate RSA key pairs for JWT
- [ ] Configure PostgreSQL with SSL (`DB_SSL=true`)
- [ ] Enable Redis for caching and rate limiting
- [ ] Configure OCSP responder with HTTPS
- [ ] Set `SESSION_SECURE=true` for HTTPS-only cookies
- [ ] Configure email provider (SMTP, SendGrid, SES, Mailgun)
- [ ] Set up S3 or equivalent for file storage
- [ ] Configure backup strategy for databases
- [ ] Set up monitoring and alerting (Prometheus/Grafana)
- [ ] Configure reverse proxy (nginx) with SSL/TLS
- [ ] Enable firewall rules to restrict port access
- [ ] Set up log aggregation (ELK stack or similar)
- [ ] Configure auto-restart with PM2 or systemd
- [ ] Review and harden rate limits
- [ ] Enable audit logging
- [ ] Configure CORS policies appropriately

### Recommended Architecture
```
                   ┌─────────────────┐
                   │   Load Balancer │
                   │   (nginx/HAProxy)│
                   └────────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  exprsn-ca│    │exprsn-auth│    │exprsn-    │
    │  Port 3000│    │ Port 3001 │    │ bridge    │
    │  (Primary)│    │           │    │ Port 3010 │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                 │
          └────────────────┼─────────────────┘
                           │
                   ┌───────▼────────┐
                   │   PostgreSQL   │
                   │   (with SSL)   │
                   └───────┬────────┘
                           │
                   ┌───────▼────────┐
                   │     Redis      │
                   │  (persistence) │
                   └────────────────┘
```

### Performance Tuning
- Enable clustering: `CLUSTER_ENABLED=true` and `CLUSTER_WORKERS=4`
- Use connection pooling: `DB_POOL_MIN=2` and `DB_POOL_MAX=10`
- Enable Redis persistence for cache reliability
- Configure PostgreSQL shared_buffers and work_mem
- Use CDN for static assets
- Enable gzip compression (already configured via compression middleware)
- Implement database query caching where appropriate
- Monitor slow queries and add indexes as needed

---

## Additional Resources

For comprehensive documentation on:
- **Architecture patterns** - See service-specific README files
- **API specifications** - Check routes/ directories in each service
- **Security implementation** - Review src/shared/middleware/
- **SAML configuration** - See .env.example SAML section
- **Workflow automation** - See exprsn-workflow documentation
- **Low-Code platform** - See exprsn-svr/lowcode/ documentation

---

## Quick Reference

### Service Ports
- 3000 - CA (critical)
- 3001 - Auth
- 3002 - Spark (messaging)
- 3004 - Timeline
- 3005 - Prefetch
- 3006 - Moderator
- 3007 - FileVault
- 3008 - Gallery
- 3009 - Live
- 3010 - Bridge (gateway)
- 3011 - Nexus (groups)
- 3012 - Pulse (analytics)
- 3013 - Vault (secrets)
- 3014 - Herald (notifications)
- 3015 - Setup (management)
- 3017 - Workflow
- 3018 - Payments
- 3019 - Atlas (geospatial)
- 5001 - SVR (business hub)
- 2560 - OCSP Responder

### Common Tasks
```bash
# Fresh start
npm run reset:full && npm run init

# Start development environment
npm run dev:auth & npm run dev:timeline & npm run dev:spark

# Check service health
npm run health:watch

# View logs
tail -f src/logs/*.log

# Generate documentation
npm run docs:generate && npm run docs:open
```
