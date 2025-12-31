# IPC System Migration Guide

This guide walks you through migrating an existing Exprsn service to use the new IPC (Inter-Process Communication) system with HTTPS, broker tokens, and development bypass.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration Steps](#migration-steps)
3. [Service-by-Service Checklist](#service-by-service-checklist)
4. [Verification & Testing](#verification--testing)
5. [Troubleshooting](#troubleshooting)
6. [Rollback Plan](#rollback-plan)

---

## Prerequisites

### 1. Generate TLS Certificates

All services now run in HTTPS mode. Generate certificates before migrating:

```bash
# Run from project root
node scripts/generate-tls-certs.js
```

This creates certificates in `/certs/`:
- `ca-cert.pem` and `ca-key.pem` (Root CA)
- `localhost-cert.pem` and `localhost-key.pem` (Fallback)
- `exprsn-{service}-cert.pem` and `exprsn-{service}-key.pem` (Per-service)

### 2. Update Environment Variables

Add to `.env` (already configured if you followed setup):

```bash
# TLS Configuration
TLS_ENABLED=true
CERTS_DIR=/path/to/Exprsn/certs

# IPC Configuration
IPC_BROKER_KEY=<generated-in-setup>
IPC_TOKEN_TTL=300
IPC_RATE_LIMIT=true
IPC_RATE_WINDOW=60000
IPC_RATE_MAX=1000

# Development Bypass
DEV_BYPASS=true
IPC_BYPASS_AUTH=true
NODE_ENV=development
```

### 3. Ensure Redis is Running

IPC uses Redis for pub/sub and state management:

```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Start Redis if needed (macOS)
brew services start redis

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Install Dependencies

If not already installed in the service:

```bash
cd src/exprsn-{service}
npm install ioredis socket.io socket.io-client
```

---

## Migration Steps

### Step 1: Import IPC Utilities

Add these imports to your service's `index.js`:

```javascript
// HTTPS and IPC imports
const { HTTPSServerManager } = require('../../shared/utils/httpsServer');
const IPCWorker = require('../../shared/ipc/IPCWorker');
const { bypassAll, logBypassStatus } = require('../../shared/middleware/devBypass');
```

**Location:** Near the top of `src/exprsn-{service}/src/index.js`, after existing requires.

### Step 2: Initialize IPC Worker

After creating the Express app, initialize the IPC worker:

```javascript
const app = express();

// Log bypass status on startup
logBypassStatus();

// Initialize IPC Worker
const ipc = new IPCWorker({
  serviceName: 'exprsn-{service}', // IMPORTANT: Use exact service name
  namespace: 'ipc'
});

// IPC Event Handlers
ipc.on('ready', () => {
  logger.info('IPC Worker ready for inter-service communication');
});

ipc.on('error', (error) => {
  logger.error('IPC Worker error', {
    error: error.message,
    stack: error.stack
  });
});
```

**Location:** After `const app = express();` but before middleware setup.

### Step 3: Add Development Bypass Middleware

**CRITICAL:** This must come BEFORE any authentication or CA token middleware:

```javascript
// Middleware setup
app.use(helmet());
app.use(cors());
app.use(express.json());

// ⚠️ IMPORTANT: Add bypass BEFORE auth middleware
app.use(bypassAll);

// Now auth middleware (will be bypassed in development)
app.use(validateCAToken);    // Optional - if service uses CA tokens
app.use(requireAuth);         // Optional - if service requires auth
```

**Location:** In the middleware section, before `validateCAToken` or `requireAuth`.

### Step 4: Add IPC to Request Context

Make IPC available to all route handlers:

```javascript
// Make IPC available to routes
app.use((req, res, next) => {
  req.ipc = ipc;
  next();
});
```

**Location:** After middleware, before route definitions.

### Step 5: Replace Server Initialization

**Before:**
```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Service started on port ${port}`);
});
```

**After:**
```javascript
const port = process.env.PORT || 3000;

const serverManager = new HTTPSServerManager({
  serviceName: 'exprsn-{service}',
  port: port,
  httpsPort: port,
  httpPort: port - 1,  // HTTP redirect server (optional)
  enableHTTP: true,
  redirectHTTP: true
});

const servers = await serverManager.start(app);
const server = servers.https || servers.http;

logger.info(`Service started with IPC and HTTPS on port ${port}`);
```

**Location:** In the `startServer()` or equivalent async function.

### Step 6: Add IPC Event Handlers

Add service-specific event handlers based on your service's role:

```javascript
// Example: Timeline service
ipc.on('post:created', async (data, meta) => {
  logger.debug('Post created event received', {
    postId: data.id,
    source: meta.source
  });

  // Handle the event (update cache, trigger notifications, etc.)
  await handlePostCreated(data);
});

ipc.on('user:updated', async (data, meta) => {
  // Update cached user data in posts
  await updateUserCache(data.userId, data.updates);
});
```

**Location:** After IPC initialization, before route definitions.

### Step 7: Emit Events in Routes

Update routes to emit IPC events when data changes:

```javascript
// Example: Create post endpoint
router.post('/posts', validateCAToken, async (req, res) => {
  const post = await Post.create({
    userId: req.user.id,
    content: req.body.content
  });

  // Emit event via IPC
  try {
    await req.ipc.emit('post:created', {
      id: post.id,
      userId: post.userId,
      content: post.content,
      createdAt: post.createdAt
    }, {
      target: 'broadcast'  // Send to all services
    });
  } catch (error) {
    logger.error('Failed to emit post:created event', { error });
    // Don't fail the request - event is best-effort
  }

  res.json({ success: true, data: post });
});
```

**Location:** In route handlers after database operations.

### Step 8: Update Shutdown Handlers

Add IPC disconnect to graceful shutdown:

```javascript
// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  // Disconnect IPC
  if (ipc) {
    await ipc.disconnect();
  }

  // Close other connections
  if (io) io.close();
  await db.sequelize.close();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  // Disconnect IPC
  if (ipc) {
    await ipc.disconnect();
  }

  // Close other connections
  if (io) io.close();
  await db.sequelize.close();

  process.exit(0);
});
```

**Location:** At the bottom of `index.js`, before or after existing shutdown handlers.

---

## Service-by-Service Checklist

Use this checklist for each service you migrate:

### Pre-Migration
- [ ] Backup current `src/exprsn-{service}/src/index.js`
- [ ] Ensure TLS certificates generated (`ls certs/ | grep {service}`)
- [ ] Redis is running (`redis-cli ping`)
- [ ] Review service's event integration needs

### Code Changes
- [ ] Import HTTPSServerManager, IPCWorker, bypassAll, logBypassStatus
- [ ] Initialize IPCWorker with correct service name
- [ ] Add `logBypassStatus()` call
- [ ] Add IPC ready/error event handlers
- [ ] Add `bypassAll` middleware BEFORE auth
- [ ] Add `req.ipc` to request context
- [ ] Define service-specific IPC event handlers
- [ ] Replace server initialization with HTTPSServerManager
- [ ] Update routes to emit IPC events
- [ ] Add IPC disconnect to shutdown handlers

### Testing
- [ ] Service starts without errors
- [ ] HTTPS endpoint accessible (`https://localhost:{port}/health`)
- [ ] IPC worker connects to Bridge
- [ ] Events emit successfully
- [ ] Events received from other services
- [ ] Development bypass working (no CA/Auth errors)
- [ ] Graceful shutdown works

### Verification
- [ ] Check Bridge IPC stats (`curl https://localhost:3010/api/ipc/stats`)
- [ ] Verify service appears in active connections
- [ ] Monitor logs for IPC events
- [ ] Test with IPC test script (`node test-ipc-communication.js`)

---

## Service-Specific Migration Examples

### Auth Service Migration

**Key Events:**
- Emit: `user:login`, `user:logout`, `user:created`, `user:updated`, `user:deleted`
- Listen: `user:validate` (from other services)

```javascript
// Emit login event
router.post('/login', async (req, res) => {
  const session = await createSession(req.body);

  await req.ipc.emit('user:login', {
    userId: session.userId,
    sessionId: session.id,
    timestamp: new Date()
  }, { target: 'broadcast' });

  res.json({ success: true, sessionId: session.id });
});

// Handle validation requests
ipc.on('user:validate', async (data, meta) => {
  const { userId, sessionId } = data;
  const valid = await validateSession(sessionId, userId);

  await ipc.emit('user:validated', {
    userId,
    sessionId,
    valid
  }, { target: meta.source });
});
```

### Messaging Service (Spark) Migration

**Key Events:**
- Emit: `message:sent`, `message:delivered`, `message:read`
- Listen: `user:status`, `message:send`

```javascript
// Handle incoming messages
ipc.on('message:send', async (data, meta) => {
  const message = await Message.create(data);

  // Deliver via Socket.IO if user online
  const recipientSocket = onlineUsers.get(data.recipientId);
  if (recipientSocket) {
    recipientSocket.emit('message:new', message);

    await ipc.emit('message:delivered', {
      messageId: message.id,
      deliveredAt: new Date()
    }, { target: meta.source });
  }
});
```

### Worker Service Migration

**Key Events:**
- Listen: `content:moderate`, `image:process`, `video:transcode`
- Emit: `content:moderated`, `image:processed`, `video:transcoded`

```javascript
// Process moderation requests
ipc.on('content:moderate', async (data, meta) => {
  const result = await aiModeration.analyze(data.content);

  await ipc.emit('content:moderated', {
    contentId: data.contentId,
    approved: !result.flagged,
    reason: result.reason
  }, { target: meta.source });
});
```

---

## Verification & Testing

### 1. Start Services in Order

```bash
# Terminal 1 - Start Bridge first
cd src/exprsn-bridge
npm start

# Terminal 2 - Start migrated service
cd src/exprsn-{service}
npm start
```

### 2. Check Service Health

```bash
# Check HTTPS health endpoint
curl -k https://localhost:{port}/health

# Should return:
# {"status":"healthy","service":"exprsn-{service}","version":"1.0.0"}
```

### 3. Verify IPC Connection

```bash
# Check Bridge IPC statistics
curl -k https://localhost:3010/api/ipc/stats

# Look for your service in activeServices and connections arrays
```

### 4. Test Event Emission

Use the provided test script:

```bash
# Run IPC communication test
node test-ipc-communication.js
```

Expected output:
```
✓ Bridge Health Check
✓ Socket.IO Connection
✓ IPC Statistics Endpoint
✓ Event Emit
✓ JSONLex Execute
```

### 5. Monitor Logs

Watch for IPC events in service logs:

```bash
# Terminal 3 - Watch service logs
tail -f src/exprsn-{service}/logs/*.log | grep IPC
```

Expected log entries:
```
[INFO] IPC Worker ready for inter-service communication
[DEBUG] IPC: Post created event received {"postId":"123","source":"exprsn-timeline"}
```

### 6. Test Development Bypass

Verify CA/Auth bypass is working:

```bash
# Make request without CA token (should work in development)
curl -k -X POST https://localhost:{port}/api/resource \
  -H "Content-Type: application/json" \
  -H "x-ipc-request: true" \
  -d '{"test":"data"}'

# Should succeed without authentication errors
```

---

## Troubleshooting

### Issue: Service won't start - "TLS certificates not found"

**Solution:**
```bash
# Generate certificates
node scripts/generate-tls-certs.js

# Verify certificates created
ls -la certs/ | grep {service}

# Should see:
# exprsn-{service}-cert.pem
# exprsn-{service}-key.pem
```

### Issue: "IPC Worker connection failed"

**Symptoms:**
```
[ERROR] IPC Worker error: connect ECONNREFUSED localhost:3010
```

**Solution:**
1. Ensure Bridge service is running first
2. Check Bridge is listening on port 3010
3. Verify Redis is running: `redis-cli ping`
4. Check firewall isn't blocking port 3010

### Issue: "Rate limit exceeded" despite broker token

**Symptoms:**
```
[ERROR] IPC rate limit exceeded
```

**Solution:**
1. Check `IPC_RATE_LIMIT` in `.env` (set to `true`)
2. Verify broker token has `rateLimitExempt: true`
3. Increase rate limits in `.env`:
   ```bash
   IPC_RATE_MAX=2000
   IPC_RATE_WINDOW=60000
   ```

### Issue: Authentication still required in development

**Symptoms:**
```
[ERROR] CA token validation failed
[ERROR] Unauthorized: No valid token
```

**Solution:**
1. Verify `DEV_BYPASS=true` in `.env`
2. Check `NODE_ENV=development`
3. Ensure `bypassAll` middleware comes BEFORE auth:
   ```javascript
   app.use(bypassAll);        // ← Must be first
   app.use(validateCAToken);  // ← After bypass
   ```
4. Add IPC headers to requests:
   ```javascript
   headers: {
     'x-ipc-request': 'true',
     'x-broker-token': 'true'
   }
   ```

### Issue: Events not being received

**Symptoms:**
- Events emit successfully but handlers don't fire
- No errors in logs

**Solution:**
1. Check event names match exactly (case-sensitive):
   ```javascript
   // Emitter
   ipc.emit('post:created', data);

   // Listener - MUST match exactly
   ipc.on('post:created', handler);
   ```
2. Verify target is correct:
   ```javascript
   // Broadcast to all
   { target: 'broadcast' }

   // Specific service
   { target: 'exprsn-timeline' }
   ```
3. Check Bridge routing in logs:
   ```bash
   tail -f src/exprsn-bridge/logs/*.log | grep "post:created"
   ```

### Issue: Socket.IO connection timeout

**Symptoms:**
```
[ERROR] Socket.IO connection timeout
[ERROR] Transport error
```

**Solution:**
1. Check CORS configuration in Bridge:
   ```javascript
   io = socketIO(server, {
     cors: {
       origin: '*',
       credentials: true
     }
   });
   ```
2. Try different transport:
   ```javascript
   const socket = io(url, {
     transports: ['polling'] // Try polling instead of websocket
   });
   ```
3. Verify SSL certificate accepted:
   ```javascript
   const socket = io(url, {
     rejectUnauthorized: false // Dev only
   });
   ```

### Issue: "Module not found: @exprsn/shared"

**Symptoms:**
```
Error: Cannot find module '@exprsn/shared'
```

**Solution:**
```bash
# Install from project root
cd /path/to/Exprsn
npm install

# Or install shared package directly in service
cd src/exprsn-{service}
npm install ../../shared
```

---

## Rollback Plan

If migration causes critical issues, you can rollback:

### 1. Restore Backup

```bash
cd src/exprsn-{service}/src
cp index.js.backup index.js
```

### 2. Disable TLS (Temporary)

In `.env`:
```bash
TLS_ENABLED=false
```

### 3. Remove IPC Dependencies

Comment out IPC code:

```javascript
// const IPCWorker = require('../../shared/ipc/IPCWorker');
// const ipc = new IPCWorker({ serviceName: '...' });

// Comment out all ipc.on() and ipc.emit() calls
```

### 4. Revert Server Initialization

```javascript
// Use plain HTTP server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Service started on port ${port}`);
});
```

### 5. Restart Service

```bash
npm start
```

---

## Migration Order Recommendation

Migrate services in this order to minimize disruption:

1. **exprsn-bridge** ✅ (Already migrated)
2. **exprsn-timeline** ✅ (Already migrated)
3. **exprsn-auth** (Critical - provides authentication events)
4. **exprsn-herald** (Notifications - listens to many events)
5. **exprsn-spark** (Messaging - real-time communication)
6. **exprsn-moderator** (Content moderation - triggered by posts)
7. **exprsn-prefetch** (Timeline optimization)
8. **exprsn-gallery** (Media processing)
9. **exprsn-filevault** (File storage)
10. **exprsn-workflow** (Workflow automation)
11. Remaining services as needed

**Rationale:** Core services first (auth, notifications, messaging), then services that depend on them, then utility services.

---

## Post-Migration Checklist

After all services are migrated:

- [ ] All services start successfully with HTTPS
- [ ] All services connect to Bridge IPC
- [ ] Inter-service events flowing correctly
- [ ] Development bypass working across all services
- [ ] No authentication errors in development
- [ ] IPC statistics show all services active
- [ ] End-to-end test passes: `node test-ipc-communication.js`
- [ ] Documentation updated
- [ ] Team trained on IPC usage
- [ ] Monitoring configured for IPC metrics

---

## Additional Resources

- **IPC System Documentation:** [IPC_SYSTEM.md](./IPC_SYSTEM.md)
- **Quick Start Guide:** [IPC_QUICK_START.md](./IPC_QUICK_START.md)
- **Integration Examples:** [IPC_INTEGRATION_EXAMPLES.md](./IPC_INTEGRATION_EXAMPLES.md)
- **Broker Token System:** `src/shared/ipc/BrokerToken.js`
- **IPC Worker Implementation:** `src/shared/ipc/IPCWorker.js`
- **Development Bypass:** `src/shared/middleware/devBypass.js`

---

## Getting Help

If you encounter issues during migration:

1. Check troubleshooting section above
2. Review example implementations in Bridge and Timeline services
3. Run IPC test script: `node test-ipc-communication.js`
4. Check logs in `src/exprsn-{service}/logs/`
5. Verify environment variables in `.env`
6. Test with minimal IPC integration first, then add features

**Good luck with your migration!** 🚀
