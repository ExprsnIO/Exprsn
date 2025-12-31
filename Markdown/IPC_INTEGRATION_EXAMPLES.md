# IPC Integration Examples

This guide provides practical examples of integrating the IPC system into different types of Exprsn services.

## Table of Contents

1. [Timeline Service Pattern](#timeline-service-pattern) - Social feed with real-time updates
2. [Notification Service Pattern](#notification-service-pattern) - Event-driven notifications
3. [Messaging Service Pattern](#messaging-service-pattern) - Real-time messaging
4. [Auth Service Pattern](#auth-service-pattern) - User authentication events
5. [Worker Service Pattern](#worker-service-pattern) - Background job processing

---

## Timeline Service Pattern

**Use case:** Social timeline with real-time post updates across services

### Integration Code

```javascript
// src/exprsn-timeline/src/index.js
const IPCWorker = require('../../shared/ipc/IPCWorker');
const { HTTPSServerManager } = require('../../shared/utils/httpsServer');
const { bypassAll, logBypassStatus } = require('../../shared/middleware/devBypass');

// Initialize IPC Worker
const ipc = new IPCWorker({
  serviceName: 'exprsn-timeline',
  namespace: 'ipc'
});

// IPC Event Handlers
ipc.on('ready', () => {
  logger.info('IPC Worker ready');
});

// Listen for post creation events from other services
ipc.on('post:created', async (data, meta) => {
  logger.debug('Post created event received', {
    postId: data.id,
    source: meta.source
  });

  // Broadcast to Socket.IO clients
  if (io) {
    io.emit('post:created', data);
  }

  // Update cache or search index
  await elasticsearchService.indexPost(data);
});

// Listen for user updates (profile changes affect posts)
ipc.on('user:updated', async (data, meta) => {
  const { userId, updates } = data;

  // Update all posts by this user in cache
  await updateUserPostsCache(userId, updates);
});

// Add bypass middleware before auth
app.use(bypassAll);

// Make IPC available to routes
app.use((req, res, next) => {
  req.ipc = ipc;
  next();
});
```

### Using IPC in Routes

```javascript
// src/exprsn-timeline/src/routes/posts.js
router.post('/', validateCAToken, requirePermissions({ write: true }), async (req, res) => {
  const post = await Post.create({
    userId: req.user.id,
    content: req.body.content
  });

  // Emit post creation event to all services
  await req.ipc.emit('post:created', {
    id: post.id,
    userId: post.userId,
    content: post.content,
    createdAt: post.createdAt
  }, {
    target: 'broadcast' // Send to all services
  });

  // Also notify Herald for user notifications
  await req.ipc.emit('notification:trigger', {
    type: 'new_post',
    userId: post.userId,
    postId: post.id
  }, {
    target: 'exprsn-herald'
  });

  res.json({ success: true, data: post });
});
```

### Server Initialization

```javascript
async function startServer() {
  // ... other initialization ...

  // Setup HTTPS with HTTPSServerManager
  const serverManager = new HTTPSServerManager({
    serviceName: 'exprsn-timeline',
    port: 3004,
    httpsPort: 3004,
    httpPort: 3003,
    enableHTTP: true,
    redirectHTTP: true
  });

  const servers = await serverManager.start(app);
  const server = servers.https || servers.http;

  // Initialize Socket.IO
  io = new Server(server, {
    cors: { origin: '*', credentials: true }
  });

  logger.info('Timeline service ready with IPC and HTTPS');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (io) io.close();
  if (ipc) await ipc.disconnect();
  await db.sequelize.close();
  process.exit(0);
});
```

---

## Notification Service Pattern

**Use case:** Herald notification service listening for notification triggers

### Integration Code

```javascript
// src/exprsn-herald/src/index.js
const IPCWorker = require('../../shared/ipc/IPCWorker');
const { HTTPSServerManager } = require('../../shared/utils/httpsServer');

const ipc = new IPCWorker({
  serviceName: 'exprsn-herald',
  namespace: 'ipc'
});

// Listen for notification trigger events from any service
ipc.on('notification:trigger', async (data, meta) => {
  const { type, userId, ...payload } = data;

  logger.info('Notification trigger received', {
    type,
    userId,
    source: meta.source
  });

  // Process notification based on type
  switch (type) {
    case 'new_post':
      await sendNewPostNotification(userId, payload);
      break;
    case 'new_message':
      await sendMessageNotification(userId, payload);
      break;
    case 'mention':
      await sendMentionNotification(userId, payload);
      break;
    default:
      logger.warn('Unknown notification type', { type });
  }
});

// Listen for bulk notification events
ipc.on('notification:bulk', async (data, meta) => {
  const { notifications } = data;

  logger.info('Bulk notification request', {
    count: notifications.length,
    source: meta.source
  });

  // Queue bulk notifications
  await notificationQueue.addBulk(notifications.map(n => ({
    name: 'send-notification',
    data: n
  })));
});

// Emit notification sent confirmation back to source
async function sendNotification(notification) {
  const result = await deliverNotification(notification);

  // Notify source service that notification was sent
  await ipc.emit('notification:sent', {
    notificationId: notification.id,
    userId: notification.userId,
    deliveredAt: new Date(),
    status: result.success ? 'delivered' : 'failed'
  }, {
    target: meta.source || 'broadcast'
  });

  return result;
}
```

### Worker Queue Integration

```javascript
// src/exprsn-herald/src/workers/notificationWorker.js
const IPCWorker = require('../../../shared/ipc/IPCWorker');

const ipc = new IPCWorker({
  serviceName: 'exprsn-herald-worker',
  namespace: 'ipc'
});

// Process notifications from Bull queue
notificationQueue.process(async (job) => {
  const { userId, type, data } = job.data;

  // Send notification
  const result = await sendEmail(userId, type, data);

  // Emit delivery confirmation via IPC
  await ipc.emit('notification:delivered', {
    userId,
    type,
    deliveredAt: new Date(),
    channel: 'email',
    success: result.success
  }, {
    target: 'broadcast'
  });

  return result;
});
```

---

## Messaging Service Pattern

**Use case:** Spark real-time messaging with delivery tracking

### Integration Code

```javascript
// src/exprsn-spark/src/index.js
const IPCWorker = require('../../shared/ipc/IPCWorker');
const { HTTPSServerManager } = require('../../shared/utils/httpsServer');

const ipc = new IPCWorker({
  serviceName: 'exprsn-spark',
  namespace: 'ipc'
});

// Listen for user status changes from Auth service
ipc.on('user:status', async (data, meta) => {
  const { userId, status } = data;

  logger.debug('User status changed', { userId, status });

  // Update presence in Socket.IO
  io.to(`user:${userId}`).emit('presence:update', {
    userId,
    status,
    timestamp: new Date()
  });
});

// Listen for message delivery requests
ipc.on('message:send', async (data, meta) => {
  const { senderId, recipientId, content, encrypted } = data;

  // Store message
  const message = await Message.create({
    senderId,
    recipientId,
    content,
    encrypted,
    source: meta.source
  });

  // Deliver via Socket.IO if recipient is online
  const recipientSocket = onlineUsers.get(recipientId);
  if (recipientSocket) {
    recipientSocket.emit('message:new', {
      id: message.id,
      senderId,
      content,
      encrypted,
      timestamp: message.createdAt
    });

    // Emit delivery confirmation
    await ipc.emit('message:delivered', {
      messageId: message.id,
      deliveredAt: new Date()
    }, {
      target: meta.source
    });
  } else {
    // User offline - notify Herald to send push notification
    await ipc.emit('notification:trigger', {
      type: 'new_message',
      userId: recipientId,
      messageId: message.id,
      senderId
    }, {
      target: 'exprsn-herald'
    });
  }
});

// Socket.IO handler
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;

  // Register user as online
  onlineUsers.set(userId, socket);

  // Broadcast online status via IPC
  ipc.emit('user:status', {
    userId,
    status: 'online'
  }, {
    target: 'broadcast'
  });

  // Handle messages
  socket.on('message:send', async (data) => {
    const { recipientId, content, encrypted } = data;

    // Emit via IPC for persistence and delivery
    await ipc.emit('message:send', {
      senderId: userId,
      recipientId,
      content,
      encrypted
    }, {
      target: 'exprsn-spark' // Route back to self for processing
    });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);

    // Broadcast offline status
    ipc.emit('user:status', {
      userId,
      status: 'offline'
    }, {
      target: 'broadcast'
    });
  });
});
```

---

## Auth Service Pattern

**Use case:** User authentication events affecting other services

### Integration Code

```javascript
// src/exprsn-auth/src/index.js
const IPCWorker = require('../../shared/ipc/IPCWorker');
const { HTTPSServerManager } = require('../../shared/utils/httpsServer');

const ipc = new IPCWorker({
  serviceName: 'exprsn-auth',
  namespace: 'ipc'
});

// Listen for user validation requests from other services
ipc.on('user:validate', async (data, meta) => {
  const { userId, sessionId } = data;

  const session = await Session.findOne({
    where: { id: sessionId, userId, active: true }
  });

  // Respond with validation result
  await ipc.emit('user:validated', {
    userId,
    sessionId,
    valid: !!session,
    roles: session ? session.user.roles : []
  }, {
    target: meta.source
  });
});

// Route handlers
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const session = await Session.create({ userId: user.id });

  // Emit login event to all services
  await req.ipc.emit('user:login', {
    userId: user.id,
    sessionId: session.id,
    email: user.email,
    roles: user.roles,
    timestamp: new Date()
  }, {
    target: 'broadcast'
  });

  res.json({ success: true, sessionId: session.id });
});

router.post('/logout', async (req, res) => {
  const { sessionId } = req.body;

  await Session.update(
    { active: false },
    { where: { id: sessionId } }
  );

  // Emit logout event
  await req.ipc.emit('user:logout', {
    sessionId,
    timestamp: new Date()
  }, {
    target: 'broadcast'
  });

  res.json({ success: true });
});

router.put('/profile/:userId', validateCAToken, async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  await User.update(updates, { where: { id: userId } });

  // Emit profile update event
  await req.ipc.emit('user:updated', {
    userId,
    updates,
    timestamp: new Date()
  }, {
    target: 'broadcast'
  });

  res.json({ success: true });
});
```

---

## Worker Service Pattern

**Use case:** Background worker processing IPC-triggered jobs

### Integration Code

```javascript
// src/exprsn-moderator/src/workers/contentModerationWorker.js
const IPCWorker = require('../../../shared/ipc/IPCWorker');
const { createLogger } = require('@exprsn/shared');

const logger = createLogger('moderator-worker');

const ipc = new IPCWorker({
  serviceName: 'exprsn-moderator-worker',
  namespace: 'ipc'
});

// Listen for content moderation requests
ipc.on('content:moderate', async (data, meta) => {
  const { contentId, type, content, userId } = data;

  logger.info('Content moderation request', {
    contentId,
    type,
    source: meta.source
  });

  // Run AI moderation
  const result = await aiModerationService.analyze(content);

  // If content is flagged, emit alert
  if (result.flagged) {
    await ipc.emit('content:flagged', {
      contentId,
      type,
      userId,
      reason: result.reason,
      confidence: result.confidence,
      categories: result.categories
    }, {
      target: 'broadcast'
    });

    // Notify moderators via Herald
    await ipc.emit('notification:trigger', {
      type: 'content_flagged',
      moderators: true,
      contentId,
      reason: result.reason
    }, {
      target: 'exprsn-herald'
    });
  }

  // Emit moderation complete
  await ipc.emit('content:moderated', {
    contentId,
    type,
    result: {
      approved: !result.flagged,
      flagged: result.flagged,
      reason: result.reason
    }
  }, {
    target: meta.source
  });
});

// Listen for batch moderation requests
ipc.on('content:moderate:batch', async (data, meta) => {
  const { items } = data;

  logger.info('Batch moderation request', {
    count: items.length,
    source: meta.source
  });

  const results = await Promise.all(
    items.map(item => aiModerationService.analyze(item.content))
  );

  // Emit batch results
  await ipc.emit('content:moderated:batch', {
    results: results.map((result, i) => ({
      contentId: items[i].contentId,
      approved: !result.flagged,
      flagged: result.flagged,
      reason: result.reason
    }))
  }, {
    target: meta.source
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await ipc.disconnect();
  process.exit(0);
});
```

### Triggering Worker Jobs via IPC

```javascript
// From Timeline service when post is created
router.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);

  // Trigger content moderation via IPC
  await req.ipc.emit('content:moderate', {
    contentId: post.id,
    type: 'post',
    content: post.content,
    userId: req.user.id
  }, {
    target: 'exprsn-moderator'
  });

  res.json({ success: true, data: post });
});

// Listen for moderation results
ipc.on('content:moderated', async (data, meta) => {
  const { contentId, result } = data;

  if (!result.approved) {
    // Hide or remove flagged content
    await Post.update(
      { visible: false, moderationFlag: result.reason },
      { where: { id: contentId } }
    );

    // Notify user
    await ipc.emit('notification:trigger', {
      type: 'content_flagged',
      userId: post.userId,
      contentId,
      reason: result.reason
    }, {
      target: 'exprsn-herald'
    });
  }
});
```

---

## Common Patterns

### 1. Request-Response Pattern

```javascript
// Service A - Make request
const requestId = uuid();
let responseHandler;

const responsePromise = new Promise((resolve) => {
  responseHandler = (data, meta) => {
    if (data.requestId === requestId) {
      ipc.off('data:response', responseHandler);
      resolve(data.result);
    }
  };
  ipc.on('data:response', responseHandler);
});

await ipc.emit('data:request', {
  requestId,
  query: { userId: '123' }
}, {
  target: 'exprsn-timeline'
});

const result = await responsePromise;

// Service B - Handle request and respond
ipc.on('data:request', async (data, meta) => {
  const { requestId, query } = data;

  const result = await Post.findAll({ where: query });

  await ipc.emit('data:response', {
    requestId,
    result
  }, {
    target: meta.source
  });
});
```

### 2. Event Chain Pattern

```javascript
// User creates post -> Timeline -> Moderator -> Herald

// Timeline service
router.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);

  // Emit to moderator
  await req.ipc.emit('content:moderate', {
    contentId: post.id,
    content: post.content,
    userId: req.user.id
  }, {
    target: 'exprsn-moderator'
  });

  res.json({ success: true, data: post });
});

// Moderator service
ipc.on('content:moderate', async (data, meta) => {
  const result = await moderate(data.content);

  // Emit to Herald if flagged
  if (result.flagged) {
    await ipc.emit('notification:trigger', {
      type: 'content_flagged',
      moderators: true,
      contentId: data.contentId
    }, {
      target: 'exprsn-herald'
    });
  }

  // Emit back to Timeline
  await ipc.emit('content:moderated', {
    contentId: data.contentId,
    approved: !result.flagged
  }, {
    target: meta.source
  });
});

// Herald service
ipc.on('notification:trigger', async (data, meta) => {
  await sendNotification(data);
});
```

### 3. Pub/Sub Pattern

```javascript
// Multiple services subscribe to same event

// Timeline subscribes to user updates
ipc.on('user:updated', async (data, meta) => {
  await updateUserPostsCache(data.userId, data.updates);
});

// Gallery subscribes to user updates
ipc.on('user:updated', async (data, meta) => {
  await updateUserAlbumsCache(data.userId, data.updates);
});

// Spark subscribes to user updates
ipc.on('user:updated', async (data, meta) => {
  await updateUserPresenceInfo(data.userId, data.updates);
});

// Auth service publishes one event, all subscribers receive it
await ipc.emit('user:updated', {
  userId: user.id,
  updates: { displayName: 'New Name' }
}, {
  target: 'broadcast'
});
```

---

## Best Practices

### 1. Always Handle IPC Errors

```javascript
ipc.on('error', (error) => {
  logger.error('IPC error', {
    error: error.message,
    stack: error.stack
  });

  // Optionally emit error event
  ipc.emit('service:error', {
    service: 'exprsn-timeline',
    error: error.message
  }, {
    target: 'exprsn-monitoring'
  });
});
```

### 2. Use Meaningful Event Names

```javascript
// Good - clear action and resource
ipc.emit('post:created', data);
ipc.emit('user:updated', data);
ipc.emit('message:delivered', data);

// Bad - vague or unclear
ipc.emit('update', data);
ipc.emit('event', data);
ipc.emit('thing:happened', data);
```

### 3. Include Metadata in Events

```javascript
await ipc.emit('post:created', {
  id: post.id,
  userId: post.userId,
  content: post.content,
  createdAt: post.createdAt,
  // Metadata
  source: 'web',
  version: '1.0',
  locale: 'en-US'
}, {
  target: 'broadcast'
});
```

### 4. Graceful Degradation

```javascript
// Don't fail request if IPC fails
try {
  await req.ipc.emit('post:created', post, {
    target: 'broadcast'
  });
} catch (error) {
  logger.error('Failed to emit post:created event', { error });
  // Continue - the post was still created
}

res.json({ success: true, data: post });
```

### 5. Use Development Bypass

```javascript
const { bypassAll, logBypassStatus } = require('../../shared/middleware/devBypass');

// Log bypass status on startup
logBypassStatus();

// Apply bypass BEFORE auth middleware
app.use(bypassAll);
app.use(validateCAToken);  // Will be bypassed in dev
app.use(requireAuth);       // Will be bypassed in dev
```

---

## Testing IPC Integration

### Unit Test Example

```javascript
// test/ipc.test.js
const IPCWorker = require('../../shared/ipc/IPCWorker');

describe('IPC Integration', () => {
  let ipc;

  beforeAll(async () => {
    ipc = new IPCWorker({
      serviceName: 'test-service',
      namespace: 'ipc'
    });

    await new Promise(resolve => ipc.on('ready', resolve));
  });

  afterAll(async () => {
    await ipc.disconnect();
  });

  test('should emit and receive events', async () => {
    const received = [];

    ipc.on('test:event', (data, meta) => {
      received.push({ data, meta });
    });

    await ipc.emit('test:event', {
      message: 'Hello'
    }, {
      target: 'test-service'
    });

    // Wait for event
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(received.length).toBe(1);
    expect(received[0].data.message).toBe('Hello');
  });
});
```

---

## Migration Checklist

- [ ] Install dependencies: `npm install ioredis socket.io-client`
- [ ] Import IPC utilities and HTTPSServerManager
- [ ] Initialize IPCWorker with service name
- [ ] Add IPC event handlers for service-specific events
- [ ] Apply `bypassAll` middleware before auth
- [ ] Add `req.ipc` to request context
- [ ] Update server initialization to use HTTPSServerManager
- [ ] Update shutdown handlers to disconnect IPC
- [ ] Update routes to emit IPC events when data changes
- [ ] Test IPC communication with Bridge service
- [ ] Monitor IPC statistics at `/api/ipc/stats` on Bridge

---

See [IPC_SYSTEM.md](./IPC_SYSTEM.md) for complete documentation and [IPC_QUICK_START.md](./IPC_QUICK_START.md) for quick reference.
