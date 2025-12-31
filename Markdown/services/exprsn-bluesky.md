# Exprsn BlueSky (exprsn-bluesky)

**Version:** 1.0.0
**Port:** 3018
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn BlueSky** is a Personal Data Server (PDS) implementation for the AT Protocol (Authenticated Transfer Protocol), enabling decentralized social networking with full integration into the Exprsn ecosystem. It allows Exprsn users to participate in the federated BlueSky network while leveraging Exprsn's existing services for content, media, and moderation.

---

## Key Features

### AT Protocol Implementation
- **Complete XRPC API** - Full AT Protocol support
- **DID Management** - Decentralized identifier system (did:web)
- **Repository System** - Content-addressed data storage with CIDs
- **Firehose Events** - Real-time event stream
- **Session Management** - JWT-based authentication
- **Federation Ready** - Prepared for cross-instance communication

### Core Functionality
- **Account Management** - Create and manage BlueSky accounts
- **Feed Integration** - Timeline and author feeds
- **Social Graph** - Follows, followers, blocks, mutes
- **Actor Profiles** - User profiles with search
- **Blob Storage** - Media upload/download with FileVault
- **Record Management** - Create, read, update, delete records

### Exprsn Integration
- **Unified Authentication** - Integration with exprsn-auth
- **Timeline Synchronization** - Bidirectional sync with exprsn-timeline
- **Content Moderation** - Automated filtering via exprsn-moderator
- **Media Storage** - FileVault backend for blobs
- **Notifications** - Herald integration
- **Workflow Automation** - Workflow triggers for account events

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (`exprsn_bluesky`)
- **Cache:** Redis (sessions, events)
- **Real-Time:** Socket.IO (firehose)
- **AT Protocol:** @atproto/* libraries
- **Queue:** Bull (event processing)

### Database Schema

**Tables:**
- `accounts` - BlueSky account records
- `repositories` - User data repositories
- `records` - AT Protocol records (posts, likes, follows)
- `blobs` - Media file metadata
- `subscriptions` - Firehose subscriptions
- `events` - Event log for firehose

---

## API Endpoints

### Session Management

#### `POST /xrpc/com.atproto.server.createSession`
Create session (login).

**Request:**
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessJwt": "eyJhbGciOiJIUzI1NiIs...",
  "refreshJwt": "eyJhbGciOiJIUzI1NiIs...",
  "handle": "user.exprsn.io",
  "did": "did:web:exprsn.io:user",
  "email": "user@example.com",
  "displayName": "User Name"
}
```

#### `POST /xrpc/com.atproto.server.refreshSession`
Refresh access token.

#### `GET /xrpc/com.atproto.server.getSession`
Get current session info.

#### `POST /xrpc/com.atproto.server.deleteSession`
Logout (delete session).

---

### Feed Endpoints

#### `GET /xrpc/app.bsky.feed.getTimeline`
Get user's personalized timeline.

**Query Parameters:**
- `limit` - Results per page (default: 50)
- `cursor` - Pagination cursor

**Response:**
```json
{
  "cursor": "abc123xyz",
  "feed": [
    {
      "post": {
        "uri": "at://did:web:exprsn.io:user/app.bsky.feed.post/123",
        "cid": "bafyreig...",
        "author": {
          "did": "did:web:exprsn.io:user",
          "handle": "user.exprsn.io",
          "displayName": "User Name",
          "avatar": "https://..."
        },
        "record": {
          "text": "Hello Bluesky!",
          "createdAt": "2024-01-01T00:00:00Z",
          "$type": "app.bsky.feed.post"
        },
        "likeCount": 42,
        "repostCount": 5,
        "replyCount": 3,
        "indexedAt": "2024-01-01T00:00:00Z"
      }
    }
  ]
}
```

#### `GET /xrpc/app.bsky.feed.getAuthorFeed`
Get specific user's posts.

#### `GET /xrpc/app.bsky.feed.getPostThread`
Get post with replies.

#### `GET /xrpc/app.bsky.feed.getLikes`
Get users who liked a post.

#### `GET /xrpc/app.bsky.feed.getFeedSkeleton`
Get feed algorithm skeleton.

---

### Social Graph

#### `GET /xrpc/app.bsky.graph.getFollows`
Get user's following list.

#### `GET /xrpc/app.bsky.graph.getFollowers`
Get user's followers.

#### `GET /xrpc/app.bsky.graph.getBlocks`
Get blocked users.

#### `GET /xrpc/app.bsky.graph.getMutes`
Get muted users.

---

### Actor/Profile

#### `GET /xrpc/app.bsky.actor.getProfile`
Get user profile.

**Query Parameters:**
- `actor` - Handle or DID

**Response:**
```json
{
  "did": "did:web:exprsn.io:user",
  "handle": "user.exprsn.io",
  "displayName": "User Name",
  "description": "Bio text",
  "avatar": "bafyreig...",
  "banner": "bafyreig...",
  "followersCount": 1234,
  "followsCount": 567,
  "postsCount": 890,
  "indexedAt": "2024-01-01T00:00:00Z"
}
```

#### `GET /xrpc/app.bsky.actor.getProfiles`
Get multiple profiles (batch).

#### `GET /xrpc/app.bsky.actor.searchActors`
Search for users.

#### `GET /xrpc/app.bsky.actor.searchActorsTypeahead`
Autocomplete user search.

---

### Repository Operations

#### `GET /xrpc/com.atproto.identity.resolveHandle`
Resolve handle to DID.

#### `GET /xrpc/com.atproto.repo.describeRepo`
Get repository description.

#### `GET /xrpc/com.atproto.repo.getRecord`
Get single record.

#### `GET /xrpc/com.atproto.repo.listRecords`
List records in collection.

#### `POST /xrpc/com.atproto.repo.createRecord`
Create new record.

#### `POST /xrpc/com.atproto.repo.putRecord`
Update record.

#### `POST /xrpc/com.atproto.repo.deleteRecord`
Delete record.

---

### Blob Storage

#### `POST /xrpc/com.atproto.repo.uploadBlob`
Upload media file.

**Request:**
```
Content-Type: multipart/form-data
file: <binary>
```

**Response:**
```json
{
  "blob": {
    "$type": "blob",
    "ref": {
      "$link": "bafyreig..."
    },
    "mimeType": "image/jpeg",
    "size": 524288
  }
}
```

#### `GET /xrpc/com.atproto.sync.getBlob`
Download media file.

**Query Parameters:**
- `did` - User DID
- `cid` - Blob CID

---

### Account Management

#### `POST /api/accounts`
Create BlueSky account.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "exprsnUserId": "user-uuid",
  "displayName": "John Doe",
  "description": "Software developer"
}
```

#### `GET /api/accounts/:did`
Get account details.

#### `PUT /api/accounts/:did`
Update account.

#### `DELETE /api/accounts/:did`
Delete account (soft delete).

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=3018
SERVICE_NAME=exprsn-bluesky

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_bluesky
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Bluesky PDS
BLUESKY_DOMAIN=exprsn.io
PDS_ENDPOINT=http://localhost:3018

# JWT
JWT_SECRET=your-secret-key-change-this

# Service Integration
CA_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
SPARK_SERVICE_URL=http://localhost:3002
TIMELINE_SERVICE_URL=http://localhost:3004
MODERATOR_SERVICE_URL=http://localhost:3006
FILEVAULT_SERVICE_URL=http://localhost:3007
HERALD_SERVICE_URL=http://localhost:3014
WORKFLOW_SERVICE_URL=http://localhost:3017

# Features
FIREHOSE_ENABLED=true

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### Create Account and Login

```javascript
const axios = require('axios');

// 1. Create BlueSky account (requires CA token)
async function createBlueSkyAccount(token) {
  const response = await axios.post(
    'http://localhost:3018/api/accounts',
    {
      username: 'johndoe',
      email: 'john@example.com',
      exprsnUserId: 'user-uuid-from-auth',
      displayName: 'John Doe'
    },
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  return response.data.data;
}

// 2. Login to get session
async function loginBlueSky() {
  const response = await axios.post(
    'http://localhost:3018/xrpc/com.atproto.server.createSession',
    {
      identifier: 'johndoe',
      password: 'password123'
    }
  );

  return response.data;
}

// 3. Get timeline
async function getTimeline(accessToken) {
  const response = await axios.get(
    'http://localhost:3018/xrpc/app.bsky.feed.getTimeline',
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { limit: 20 }
    }
  );

  return response.data;
}
```

### Create Post

```javascript
async function createPost(did, accessToken) {
  const response = await axios.post(
    'http://localhost:3018/xrpc/com.atproto.repo.createRecord',
    {
      repo: did,
      collection: 'app.bsky.feed.post',
      record: {
        text: 'Hello from Exprsn!',
        createdAt: new Date().toISOString(),
        $type: 'app.bsky.feed.post'
      }
    },
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  return response.data;
}
```

### Upload Media

```javascript
const FormData = require('form-data');
const fs = require('fs');

async function uploadImage(filePath, accessToken) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    'http://localhost:3018/xrpc/com.atproto.repo.uploadBlob',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return response.data.blob;
}
```

---

## Development

```bash
cd src/exprsn-bluesky

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start in development mode
npm run dev

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

---

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/sessionService.test.js

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Firehose (Real-Time Events)

The firehose provides a real-time stream of all repository changes.

### Subscribe via Socket.IO

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3018');

socket.on('connect', () => {
  console.log('Connected to firehose');

  // Subscribe to events
  socket.emit('subscribe', {
    collection: 'app.bsky.feed.post'
  });
});

socket.on('commit', (event) => {
  console.log('New event:', event);
  // event.operation: 'create', 'update', 'delete'
  // event.collection: 'app.bsky.feed.post'
  // event.record: the actual record data
});
```

---

## Admin Dashboard

Access the admin dashboard at: `http://localhost:3018/admin`

**Features:**
- View all accounts
- Monitor events
- View firehose activity
- Queue management
- System statistics

---

## Production Readiness

### ✅ Completed Features
- [x] AT Protocol core endpoints
- [x] Session management
- [x] Feed endpoints
- [x] Social graph
- [x] Actor profiles
- [x] Blob storage
- [x] Repository operations
- [x] Firehose
- [x] Exprsn service integration
- [x] Basic test coverage

### 🚧 Roadmap
- [ ] Federation with other PDS instances
- [ ] Advanced moderation tools
- [ ] DID:PLC support (currently did:web)
- [ ] Enhanced test coverage (target: 70%+)
- [ ] Performance optimizations
- [ ] Advanced feed algorithms

---

## Security Considerations

### Authentication
- JWT-based session tokens
- Refresh token rotation
- Session storage in Redis (30-day TTL)
- Integration with exprsn-auth

### Private Key Storage
- **Current:** Base64 encoding (suitable for development)
- **Production TODO:** Implement AES-256 encryption with KMS

### Rate Limiting
- Shared rate limiting via exprsn-bridge
- Per-endpoint limits via middleware

---

## Dependencies

- **express** (^4.18.2)
- **@atproto/api** (^0.12.0)
- **@atproto/xrpc-server** (^0.5.0)
- **socket.io** (^4.6.1)
- **sequelize** (^6.35.2)
- **redis** (^4.6.12)
- **bull** (^4.12.0)
- **@exprsn/shared** (file:../shared)

---

## Troubleshooting

**Issue:** Session creation fails
**Solution:** Ensure exprsn-auth service is running and user has Exprsn account

**Issue:** Timeline is empty
**Solution:** Verify exprsn-timeline integration and user has followed accounts

**Issue:** Blob upload fails
**Solution:** Check exprsn-filevault service and file size limits

**Issue:** Firehose not receiving events
**Solution:** Verify Redis connection and FIREHOSE_ENABLED=true

---

## Related Documentation

- **Production Readiness Plan:** `/src/exprsn-bluesky/PRODUCTION_READINESS.md`
- **AT Protocol Spec:** https://atproto.com/specs/atp
- **BlueSky Documentation:** https://docs.bsky.app/

---

## Support

- **Email:** engineering@exprsn.com
- **Status:** ✅ Production-Ready
- **License:** UNLICENSED
