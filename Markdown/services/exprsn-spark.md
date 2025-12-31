# Exprsn Spark (exprsn-spark)

**Version:** 1.0.0
**Port:** 3002
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Spark** is the real-time messaging and communication service that powers direct messages, group chats, and encrypted communications across the Exprsn platform. Built on Socket.IO with end-to-end encryption (E2EE) support, Spark provides a secure, scalable messaging infrastructure.

---

## Key Features

### Messaging
- **Direct Messages** - One-on-one encrypted conversations
- **Group Chats** - Multi-user conversations (up to 256 members)
- **Message Threading** - Organized conversation threads
- **Message Reactions** - Emoji reactions to messages
- **Message Editing** - Edit sent messages (with history)
- **Message Deletion** - Delete for self or all
- **Read Receipts** - Delivery and read status tracking
- **Typing Indicators** - Real-time typing status

### End-to-End Encryption (E2EE)
- **Signal Protocol** - Industry-standard encryption
- **Perfect Forward Secrecy** - Unique keys per session
- **Key Exchange** - Automated key negotiation
- **Device Verification** - Trust verification between devices
- **Encrypted Attachments** - Secure file transfers

### Real-Time Features
- **Socket.IO** - WebSocket-based real-time communication
- **Presence** - Online/offline/away status
- **Connection Pooling** - Efficient connection management
- **Redis Adapter** - Multi-server synchronization
- **Reconnection Logic** - Automatic connection recovery

### Media Sharing
- **File Attachments** - Images, videos, documents
- **Voice Messages** - Audio recording and playback
- **Location Sharing** - GPS coordinates with maps
- **Link Previews** - Automatic link metadata extraction
- **GIF Support** - Integrated GIF search

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Real-Time:** Socket.IO v4+
- **Database:** PostgreSQL (`exprsn_spark`)
- **Cache:** Redis (message caching, presence)
- **Encryption:** libsignal-protocol
- **Media:** Sharp (image processing)

### Database Schema

**Tables:**
- `conversations` - Conversation metadata
- `conversation_members` - Membership tracking
- `messages` - Message content and metadata
- `message_reactions` - Emoji reactions
- `message_edits` - Edit history
- `attachments` - File attachments
- `encryption_keys` - User public keys
- `device_keys` - Device-specific keys
- `read_receipts` - Message read tracking
- `typing_indicators` - Active typing states
- `presence` - User online status

---

## API Endpoints

### Conversation Management

#### `GET /api/conversations`
List user's conversations.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "type": "direct",
        "participants": [
          {
            "userId": "uuid",
            "username": "johndoe",
            "avatar": "https://..."
          }
        ],
        "lastMessage": {
          "id": "uuid",
          "content": "Hello!",
          "senderId": "uuid",
          "createdAt": "2024-01-01T00:00:00Z"
        },
        "unreadCount": 3,
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### `POST /api/conversations`
Create new conversation.

**Request:**
```json
{
  "type": "direct",
  "participantIds": ["user-uuid-1"],
  "encrypted": true
}
```

#### `GET /api/conversations/:id`
Get conversation details.

#### `DELETE /api/conversations/:id`
Leave/delete conversation.

---

### Message Management

#### `GET /api/conversations/:id/messages`
Get conversation messages.

**Query Parameters:**
- `cursor` - Pagination cursor
- `limit` - Messages per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "conversationId": "uuid",
        "senderId": "uuid",
        "content": "Hello World!",
        "encrypted": false,
        "attachments": [],
        "reactions": {
          "👍": ["user-id-1", "user-id-2"],
          "❤️": ["user-id-3"]
        },
        "edited": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "nextCursor": "abc123",
    "hasMore": true
  }
}
```

#### `POST /api/conversations/:id/messages`
Send message.

**Request:**
```json
{
  "content": "Hello!",
  "encrypted": false,
  "replyToId": "parent-message-uuid",
  "attachments": ["attachment-uuid-1"]
}
```

#### `PUT /api/messages/:id`
Edit message.

**Request:**
```json
{
  "content": "Updated message content"
}
```

#### `DELETE /api/messages/:id`
Delete message.

**Query Parameters:**
- `deleteFor` - "self" or "everyone" (default: "self")

---

### Real-Time Socket Events

#### Client → Server Events

**`send_message`**
```javascript
socket.emit('send_message', {
  conversationId: 'uuid',
  content: 'Hello!',
  encrypted: false
});
```

**`typing_start`**
```javascript
socket.emit('typing_start', {
  conversationId: 'uuid'
});
```

**`typing_stop`**
```javascript
socket.emit('typing_stop', {
  conversationId: 'uuid'
});
```

**`mark_read`**
```javascript
socket.emit('mark_read', {
  conversationId: 'uuid',
  messageId: 'uuid'
});
```

#### Server → Client Events

**`new_message`**
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

**`message_updated`**
```javascript
socket.on('message_updated', (data) => {
  console.log('Message edited:', data);
});
```

**`message_deleted`**
```javascript
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

**`user_typing`**
```javascript
socket.on('user_typing', (data) => {
  console.log(`${data.username} is typing...`);
});
```

**`presence_update`**
```javascript
socket.on('presence_update', (data) => {
  console.log(`${data.userId} is now ${data.status}`);
});
```

---

### Group Chat Management

#### `POST /api/conversations/:id/members`
Add member to group.

**Request:**
```json
{
  "userId": "user-uuid"
}
```

#### `DELETE /api/conversations/:id/members/:userId`
Remove member from group.

#### `PUT /api/conversations/:id`
Update group details.

**Request:**
```json
{
  "name": "Team Chat",
  "avatar": "https://...",
  "description": "Our team discussion"
}
```

---

### Encryption Endpoints

#### `POST /api/encryption/keys`
Upload public key.

**Request:**
```json
{
  "publicKey": "base64-encoded-public-key",
  "deviceId": "device-uuid"
}
```

#### `GET /api/encryption/keys/:userId`
Get user's public keys.

#### `POST /api/encryption/verify`
Verify device key.

**Request:**
```json
{
  "deviceId": "device-uuid",
  "verificationCode": "123456"
}
```

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=3002
SERVICE_NAME=exprsn-spark

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_spark
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PREFIX=spark:

# Socket.IO
SOCKET_IO_PATH=/socket.io
SOCKET_IO_PING_TIMEOUT=60000
SOCKET_IO_PING_INTERVAL=25000
SOCKET_IO_MAX_CONNECTIONS=10000

# Encryption
E2EE_ENABLED=true
KEY_ROTATION_DAYS=90
VERIFY_DEVICE_REQUIRED=true

# Message Configuration
MAX_MESSAGE_LENGTH=10000
MAX_ATTACHMENTS_PER_MESSAGE=10
MESSAGE_EDIT_WINDOW_MINUTES=15
MAX_GROUP_SIZE=256

# Media
MEDIA_MAX_SIZE=10485760
IMAGE_MAX_WIDTH=2048
IMAGE_MAX_HEIGHT=2048

# Presence
PRESENCE_TIMEOUT_SECONDS=300
PRESENCE_UPDATE_INTERVAL=60

# Service Integration
CA_URL=http://localhost:3000
AUTH_URL=http://localhost:3001
FILEVAULT_URL=http://localhost:3007
HERALD_URL=http://localhost:3014
```

---

## Usage Examples

### Socket.IO Client

```javascript
const io = require('socket.io-client');

// Connect with authentication
const socket = io('http://localhost:3002', {
  auth: {
    token: 'your-ca-token'
  },
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to Spark');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Spark');
});

// Send message
function sendMessage(conversationId, content) {
  socket.emit('send_message', {
    conversationId,
    content,
    encrypted: false
  });
}

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('Received message:', message);
  displayMessage(message);
});

// Typing indicators
function startTyping(conversationId) {
  socket.emit('typing_start', { conversationId });
}

function stopTyping(conversationId) {
  socket.emit('typing_stop', { conversationId });
}

// Handle typing updates
socket.on('user_typing', (data) => {
  showTypingIndicator(data.userId, data.conversationId);
});

// Mark messages as read
socket.on('new_message', (message) => {
  socket.emit('mark_read', {
    conversationId: message.conversationId,
    messageId: message.id
  });
});
```

### REST API Integration

```javascript
const axios = require('axios');

// Get conversations
async function getConversations(token) {
  const response = await axios.get('http://localhost:3002/api/conversations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data.data.conversations;
}

// Create direct message conversation
async function createConversation(recipientId, token) {
  const response = await axios.post('http://localhost:3002/api/conversations', {
    type: 'direct',
    participantIds: [recipientId],
    encrypted: true
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data.data;
}

// Get conversation messages
async function getMessages(conversationId, token, cursor = null) {
  const params = cursor ? { cursor } : {};
  const response = await axios.get(
    `http://localhost:3002/api/conversations/${conversationId}/messages`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
      params
    }
  );
  return response.data.data;
}
```

---

## End-to-End Encryption

### Key Exchange Flow

1. **User A** uploads public key to server
2. **User A** initiates conversation with **User B**
3. **User A** fetches **User B**'s public key
4. Both users derive shared secret using Diffie-Hellman
5. Messages encrypted with shared secret before sending
6. Messages decrypted on recipient device only

### Encryption Implementation

```javascript
// Client-side encryption example
const crypto = require('crypto');

// Generate key pair
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

// Encrypt message
function encryptMessage(content, recipientPublicKey) {
  const encrypted = crypto.publicEncrypt(
    recipientPublicKey,
    Buffer.from(content, 'utf8')
  );
  return encrypted.toString('base64');
}

// Decrypt message
function decryptMessage(encryptedContent, privateKey) {
  const decrypted = crypto.privateDecrypt(
    privateKey,
    Buffer.from(encryptedContent, 'base64')
  );
  return decrypted.toString('utf8');
}
```

---

## Development

```bash
cd src/exprsn-spark
npm install
npm run migrate
npm run seed
npm run dev
```

---

## Monitoring

### Key Metrics
- **Active Connections** - Current socket connections
- **Messages Per Second** - Throughput
- **Message Delivery Time** - Latency
- **Failed Deliveries** - Error rate
- **Encryption Success Rate** - E2EE adoption
- **Presence Updates** - User activity

---

## Dependencies

- **express** (^4.18.2)
- **socket.io** (^4.7.2)
- **sequelize** (^6.35.2)
- **redis** (^4.6.11)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
