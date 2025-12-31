# Exprsn IPC System Documentation

## Overview

The Exprsn IPC (Inter-Process Communication) system provides a robust, Redis-based communication layer for all microservices in the ecosystem. It enables services to communicate via Socket.IO with broker tokens that bypass normal rate limiting and authentication in development mode.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Exprsn Bridge (IPC Router)                │
│  - Routes all inter-service communication                    │
│  - Manages Socket.IO namespaces                             │
│  - Handles CRUD operations                                   │
│  - Executes JSONLex expressions                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
    ┌──────▼──────┐         ┌─────▼──────┐
    │   Redis     │         │  Socket.IO │
    │   Pub/Sub   │         │ Namespaces │
    └──────┬──────┘         └─────┬──────┘
           │                       │
    ┌──────┴───────────────────────┴──────┐
    │         Service IPC Workers          │
    │  (Timeline, Auth, Spark, etc.)      │
    └──────────────────────────────────────┘
```

## Key Components

### 1. Broker Token System

Unlike CA tokens, broker tokens:
- **Do NOT count against rate limits**
- **Do NOT require CA validation** in development mode
- Support state management for long-running operations
- Include revocation verification
- Bypass Auth in development mode

**Token Structure:**
```javascript
{
  id: "unique-token-id",
  type: "broker",
  version: "1.0",
  source: "exprsn-timeline",
  target: "exprsn-spark",
  operation: "ipc",
  iat: 1234567890,
  exp: 1234567890,
  stateful: false,
  rateLimitExempt: true,
  authBypass: true,  // Only in development
  data: { /* custom payload */ }
}
```

### 2. IPC Worker

Each service has an IPC worker that:
- Subscribes to service-specific Redis channels
- Subscribes to broadcast channel for system-wide announcements
- Handles incoming events
- Emits events to other services
- Manages CRUD operations
- Executes JSONLex expressions

### 3. Bridge IPC Router

The Bridge service acts as the central router:
- Creates Socket.IO namespaces for each service (`/ipc/timeline`, `/ipc/auth`, etc.)
- Routes events between services
- Enforces rate limiting
- Manages connection state
- Provides service discovery

## TLS/HTTPS Configuration

All services run in HTTPS mode with TLS certificates:

### Certificate Generation

```bash
# Generate certificates for all services
node scripts/generate-tls-certs.js
```

This creates:
- Root CA certificate
- Individual certificates for each service
- Shared localhost certificate (fallback)

Certificates are stored in `/certs/`:
```
certs/
├── ca-cert.pem
├── ca-key.pem
├── localhost-cert.pem
├── localhost-key.pem
├── exprsn-auth-cert.pem
├── exprsn-auth-key.pem
├── exprsn-timeline-cert.pem
├── exprsn-timeline-key.pem
└── ... (one for each service)
```

### Using HTTPS in Services

```javascript
const { HTTPSServerManager } = require('@exprsn/shared/utils/httpsServer');

const serverManager = new HTTPSServerManager({
  serviceName: 'exprsn-timeline',
  port: 3004,
  httpsPort: 3004,
  httpPort: 3003,  // Optional HTTP redirect server
  enableHTTP: true,
  redirectHTTP: true
});

const servers = await serverManager.start(app);
// servers.https - HTTPS server on port 3004
// servers.http - HTTP redirect server on port 3003
```

## Usage Examples

### Setting Up IPC Worker in a Service

```javascript
const IPCWorker = require('@exprsn/shared/ipc/IPCWorker');

// Initialize IPC worker
const ipc = new IPCWorker({
  serviceName: 'exprsn-timeline',
  namespace: 'ipc'
});

// Wait for ready
ipc.on('ready', () => {
  console.log('IPC Worker ready');
});

// Handle events
ipc.on('post:created', async (data, meta) => {
  console.log('Post created:', data);
  console.log('From:', meta.source);
  console.log('Token:', meta.token);
});

// Emit events
await ipc.emit('post:created', {
  id: '123',
  content: 'Hello World',
  userId: 'user-456'
}, {
  target: 'exprsn-spark',  // or 'broadcast' for all
  requireAck: true
});
```

### CRUD Operations

```javascript
// Create
await ipc.create('posts', {
  content: 'New post',
  userId: '123'
}, {
  target: 'exprsn-timeline',
  useJSONLex: false
});

// Read
await ipc.read('posts', {
  userId: '123'
}, {
  target: 'exprsn-timeline'
});

// Update
await ipc.update('posts', 'post-id-123', {
  content: 'Updated content'
}, {
  target: 'exprsn-timeline'
});

// Delete
await ipc.delete('posts', 'post-id-123', {
  target: 'exprsn-timeline'
});
```

### JSONLex Expressions

```javascript
// Execute JSONLex expression
const expression = {
  __jsonlex: true,
  expr: {
    fullName: {
      $concat: [
        { $var: 'user.firstName' },
        ' ',
        { $var: 'user.lastName' }
      ]
    },
    isActive: {
      $eq: [{ $var: 'user.status' }, 'active']
    }
  }
};

await ipc.executeJSONLex(expression, {
  user: {
    firstName: 'John',
    lastName: 'Doe',
    status: 'active'
  }
}, {
  target: 'exprsn-bridge'
});

// Result: { fullName: 'John Doe', isActive: true }
```

### Using Socket.IO from Services

```javascript
const io = require('socket.io-client');

// Connect to Bridge IPC namespace
const socket = io('https://localhost:3010/ipc/timeline', {
  rejectUnauthorized: false  // Development only
});

socket.on('connect', () => {
  console.log('Connected to IPC');

  // Emit event
  socket.emit('ipc:emit', {
    event: 'post:created',
    payload: { id: '123', content: 'Hello' },
    target: 'broadcast'
  });

  // Handle acknowledgment
  socket.on('ipc:ack', (data) => {
    console.log('Event acknowledged:', data);
  });
});

// CRUD via Socket.IO
socket.emit('ipc:create', {
  resource: 'posts',
  data: { content: 'New post' }
}, (response) => {
  if (response.success) {
    console.log('Created:', response.data);
  }
});
```

## Development Mode Bypass

In development mode, you can bypass CA and Auth validation:

### Configuration

```bash
# .env
NODE_ENV=development
DEV_BYPASS=true
IPC_BYPASS_AUTH=true
```

### Using Bypass Middleware

```javascript
const { bypassAll } = require('@exprsn/shared/middleware/devBypass');

// Apply before CA/Auth middleware
app.use(bypassAll);
app.use(validateCAToken);  // Will be bypassed in dev
app.use(requireAuth);       // Will be bypassed in dev
```

### Marking IPC Requests

```javascript
// Add headers to mark as IPC request
axios.post('https://localhost:3004/api/posts', data, {
  headers: {
    'x-ipc-request': 'true',
    'x-broker-token': 'true'
  }
});
```

## Rate Limiting

IPC calls have separate rate limiting from regular API calls:

```bash
# .env
IPC_RATE_LIMIT=true
IPC_RATE_WINDOW=60000   # 1 minute
IPC_RATE_MAX=1000       # Max 1000 requests per minute per service
```

Broker tokens automatically set `rateLimitExempt: true`, but the Bridge still enforces IPC-specific limits.

## Broker Token Management

### Generate Token

```javascript
const BrokerTokenManager = require('@exprsn/shared/ipc/BrokerToken');

const tokenManager = new BrokerTokenManager({
  serviceName: 'exprsn-timeline'
});

const token = await tokenManager.generateToken({
  userId: '123',
  action: 'create_post'
}, {
  targetService: 'exprsn-spark',
  operation: 'notification',
  stateful: false,
  ttl: 300
});
```

### Verify Token

```javascript
const verified = await tokenManager.verifyToken(token);
console.log('Token data:', verified.data);
console.log('Source:', verified.source);
console.log('Target:', verified.target);
```

### Revoke Token

```javascript
await tokenManager.revokeToken(tokenId);
```

### Stateful Tokens

For long-running operations, use stateful tokens:

```javascript
const token = await tokenManager.generateToken(data, {
  stateful: true,
  ttl: null  // No expiration
});

// Set state
await tokenManager.setState(tokenId, {
  step: 'processing',
  progress: 50
});

// Get state
const state = await tokenManager.getState(tokenId);

// Clean up when done
await tokenManager.deleteState(tokenId);
await tokenManager.revokeToken(tokenId);
```

## Service Discovery

Get list of active services:

```javascript
const services = await ipc.getActiveServices();

console.log('Active services:', services);
// [
//   {
//     name: 'exprsn-timeline',
//     namespace: 'ipc',
//     pid: 12345,
//     hostname: 'localhost',
//     registered: 1234567890,
//     lastSeen: 1234567890
//   },
//   ...
// ]
```

## Monitoring and Debugging

### IPC Statistics

```javascript
const IPCRouter = require('./src/exprsn-bridge/src/ipc/IPCRouter');

const stats = await router.getStats();

console.log('Active services:', stats.activeServices);
console.log('Active connections:', stats.activeConnections);
console.log('Rate limits:', stats.rateLimits);
```

### Event Logging

The IPC system emits events for monitoring:

```javascript
ipc.on('sent', ({ event, target, channel }) => {
  console.log(`Sent ${event} to ${target} on ${channel}`);
});

ipc.on('received', ({ event, source, channel }) => {
  console.log(`Received ${event} from ${source} on ${channel}`);
});

ipc.on('error', (error) => {
  console.error('IPC error:', error);
});

ipc.on('handler-error', ({ event, error, handler }) => {
  console.error(`Handler ${handler} failed for event ${event}:`, error);
});
```

## Security Considerations

### Production Deployment

1. **Disable Development Bypass**:
   ```bash
   NODE_ENV=production
   DEV_BYPASS=false
   IPC_BYPASS_AUTH=false
   ```

2. **Use Real Certificates**:
   - Replace self-signed certificates with CA-issued certificates
   - Configure proper certificate validation

3. **Secure Redis**:
   ```bash
   REDIS_PASSWORD=strong-password
   REDIS_SSL=true
   ```

4. **Rate Limiting**:
   - Tune rate limits for production workload
   - Monitor IPC usage patterns

5. **Token Security**:
   - Generate strong `IPC_BROKER_KEY`
   - Rotate broker keys periodically
   - Monitor token revocation logs

### Best Practices

- **Never** disable TLS in production
- **Always** validate broker tokens
- **Monitor** IPC traffic for anomalies
- **Log** all IPC operations for audit
- **Limit** token TTL to minimum required
- **Revoke** tokens after use for sensitive operations
- **Use** stateful tokens only when necessary

## Troubleshooting

### Common Issues

**1. Connection Refused**
```
Error: connect ECONNREFUSED localhost:3010
```
- Ensure Bridge service is running
- Check TLS certificates exist
- Verify port is not blocked

**2. Token Verification Failed**
```
Error: Token verification failed: invalid signature
```
- Check `IPC_BROKER_KEY` matches across services
- Verify token hasn't been revoked
- Ensure token hasn't expired

**3. Rate Limit Exceeded**
```
Error: IPC rate limit exceeded
```
- Increase `IPC_RATE_MAX` in .env
- Check for infinite loops causing excessive IPC calls
- Verify rate limit window is appropriate

**4. Certificate Errors**
```
Error: unable to verify the first certificate
```
- Regenerate certificates: `node scripts/generate-tls-certs.js`
- Check certificate paths in service config
- In development, set `rejectUnauthorized: false` for Socket.IO client

## API Reference

See individual file documentation for detailed API:
- `src/shared/ipc/BrokerToken.js` - Broker token management
- `src/shared/ipc/IPCWorker.js` - IPC worker implementation
- `src/exprsn-bridge/src/ipc/IPCRouter.js` - Central router
- `src/shared/utils/jsonlex.js` - JSONLex expression engine
- `src/shared/utils/httpsServer.js` - HTTPS server utilities
- `src/shared/middleware/devBypass.js` - Development bypass middleware
