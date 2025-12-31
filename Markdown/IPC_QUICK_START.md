# IPC System Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Generate TLS Certificates
```bash
node scripts/generate-tls-certs.js
```

### Step 2: Configure Environment
Already configured in `.env`:
```bash
TLS_ENABLED=true
DEV_BYPASS=true
IPC_BYPASS_AUTH=true
```

### Step 3: Add IPC to Your Service

```javascript
const IPCWorker = require('@exprsn/shared/ipc/IPCWorker');
const { HTTPSServerManager } = require('@exprsn/shared/utils/httpsServer');

// Initialize IPC
const ipc = new IPCWorker({
  serviceName: 'exprsn-yourservice'
});

// Setup HTTPS
const serverManager = new HTTPSServerManager({
  serviceName: 'exprsn-yourservice',
  port: 3XXX
});

const servers = await serverManager.start(app);
```

### Step 4: Send Events

```javascript
// Broadcast to all services
await ipc.emit('user:created', {
  id: '123',
  username: 'john'
}, {
  target: 'broadcast'
});

// Send to specific service
await ipc.emit('notification:send', {
  userId: '123',
  message: 'Hello!'
}, {
  target: 'exprsn-herald'
});
```

### Step 5: Receive Events

```javascript
ipc.on('user:created', async (data, meta) => {
  console.log('User created:', data);
  console.log('From service:', meta.source);

  // Your handler logic here
  await processNewUser(data);
});
```

## 📋 Common Operations

### CRUD Operations

```javascript
// Create
const result = await ipc.create('posts', {
  content: 'Hello World',
  userId: '123'
});

// Read
const posts = await ipc.read('posts', { userId: '123' });

// Update
await ipc.update('posts', 'post-id', { content: 'Updated' });

// Delete
await ipc.delete('posts', 'post-id');
```

### JSONLex Expressions

```javascript
const result = await ipc.executeJSONLex({
  __jsonlex: true,
  expr: {
    fullName: {
      $concat: [
        { $var: 'firstName' },
        ' ',
        { $var: 'lastName' }
      ]
    }
  }
}, {
  firstName: 'John',
  lastName: 'Doe'
});
// Result: { fullName: 'John Doe' }
```

### Broker Tokens

```javascript
const BrokerTokenManager = require('@exprsn/shared/ipc/BrokerToken');

const tokenManager = new BrokerTokenManager({
  serviceName: 'exprsn-yourservice'
});

// Generate
const token = await tokenManager.generateToken({
  action: 'process_data',
  userId: '123'
});

// Verify
const verified = await tokenManager.verifyToken(token);

// Revoke
await tokenManager.revokeToken(verified.id);
```

## 🛡️ Development Mode Features

In development mode (`NODE_ENV=development` and `DEV_BYPASS=true`):

✅ **Auto-bypasses** CA token validation
✅ **Auto-bypasses** Auth requirements
✅ **Rate limits exempt** for broker tokens
✅ **Self-signed certificates** work without warnings
✅ **No OCSP/CRL** checks required

### Using Bypass Middleware

```javascript
const { bypassAll } = require('@exprsn/shared/middleware/devBypass');

// Add BEFORE authentication middleware
app.use(bypassAll);
app.use(validateCAToken);  // Bypassed in dev
app.use(requireAuth);       // Bypassed in dev
```

## 🔌 Socket.IO Integration

### Connect from Service

```javascript
const io = require('socket.io-client');

const socket = io('https://localhost:3010/ipc/yourservice', {
  rejectUnauthorized: false  // Dev only
});

socket.on('connect', () => {
  console.log('Connected to IPC Bridge');
});

// Emit events
socket.emit('ipc:emit', {
  event: 'data:updated',
  payload: { id: '123' },
  target: 'broadcast'
});

// CRUD via Socket.IO
socket.emit('ipc:create', {
  resource: 'users',
  data: { username: 'john' }
}, (response) => {
  console.log('Created:', response.data);
});
```

## 📊 Monitoring

### Get Active Services

```javascript
const services = await ipc.getActiveServices();
console.log('Active services:', services);
```

### Listen to IPC Events

```javascript
ipc.on('sent', ({ event, target }) => {
  console.log(`Sent ${event} to ${target}`);
});

ipc.on('received', ({ event, source }) => {
  console.log(`Received ${event} from ${source}`);
});

ipc.on('error', (error) => {
  console.error('IPC error:', error);
});
```

## 🏗️ Service Architecture Pattern

```javascript
// services/yourservice/index.js
const express = require('express');
const IPCWorker = require('@exprsn/shared/ipc/IPCWorker');
const { HTTPSServerManager } = require('@exprsn/shared/utils/httpsServer');
const { bypassAll } = require('@exprsn/shared/middleware/devBypass');

class YourService {
  constructor() {
    this.app = express();
    this.ipc = new IPCWorker({
      serviceName: 'exprsn-yourservice'
    });
  }

  async initialize() {
    // Setup middleware
    this.app.use(express.json());
    this.app.use(bypassAll);  // Dev bypass

    // Setup IPC handlers
    this.setupIPCHandlers();

    // Setup routes
    this.setupRoutes();

    // Start HTTPS server
    const serverManager = new HTTPSServerManager({
      serviceName: 'exprsn-yourservice',
      port: 3XXX
    });

    this.servers = await serverManager.start(this.app);
  }

  setupIPCHandlers() {
    this.ipc.on('ready', () => {
      console.log('IPC ready');
    });

    this.ipc.on('user:created', async (data, meta) => {
      await this.handleUserCreated(data);
    });
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
    });

    this.app.post('/api/data', async (req, res) => {
      // Emit IPC event
      await this.ipc.emit('data:created', req.body, {
        target: 'broadcast'
      });

      res.json({ success: true });
    });
  }

  async handleUserCreated(data) {
    console.log('User created:', data);
    // Your logic here
  }
}

// Start service
const service = new YourService();
service.initialize().catch(console.error);
```

## 🔍 Debugging

### Enable Verbose Logging

```bash
LOG_LEVEL=debug npm start
```

### Check Certificate Info

```javascript
const manager = new HTTPSServerManager({
  serviceName: 'exprsn-yourservice'
});

const certInfo = manager.getCertificateInfo();
console.log('Certificate:', certInfo);
```

### Test IPC Connection

```javascript
// Test emit
await ipc.emit('test:ping', { timestamp: Date.now() }, {
  target: 'broadcast',
  requireAck: true
});

// Listen for ack
ipc.on('ack', (data) => {
  console.log('Acknowledged:', data);
});
```

## 🚨 Common Issues

### 1. "Certificate not found"
```bash
node scripts/generate-tls-certs.js
```

### 2. "Connection refused"
- Ensure Bridge is running on port 3010
- Check `TLS_ENABLED=true` in .env

### 3. "Token verification failed"
- Check `IPC_BROKER_KEY` is consistent across services
- Verify token hasn't expired

### 4. "Rate limit exceeded"
- Increase `IPC_RATE_MAX` in .env
- Or disable: `IPC_RATE_LIMIT=false`

## 📚 Full Documentation

See [IPC_SYSTEM.md](./IPC_SYSTEM.md) for complete documentation.

## 🎯 Next Steps

1. Add IPC to your service using the pattern above
2. Define your event handlers
3. Emit events to other services
4. Use CRUD operations for data access
5. Monitor IPC traffic and performance

---

**Need Help?**
- Check logs for detailed error messages
- Review [IPC_SYSTEM.md](./IPC_SYSTEM.md) for advanced features
- Test with `LOG_LEVEL=debug` for verbose output
