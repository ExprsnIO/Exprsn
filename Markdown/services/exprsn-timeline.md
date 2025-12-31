# Exprsn Timeline (exprsn-timeline)

**Version:** 1.0.0
**Port:** 3004
**Status:** ✅ Production-Ready (50+ test cases, 70% coverage)
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

The **Exprsn Timeline Service** powers the social feed and content distribution system for the Exprsn platform. It provides a high-performance, real-time timeline generation engine with advanced ranking algorithms, fan-out architecture, and full-text search capabilities using Elasticsearch.

---

## Key Features

### Timeline Generation
- **Personalized Feeds** - Algorithm-ranked content based on user interests
- **Fan-Out Architecture** - Write fan-out for efficient timeline generation
- **Cursor-Based Pagination** - Infinite scroll support
- **Real-Time Updates** - Socket.IO-based live feed updates
- **Content Filtering** - Visibility controls (public, private, followers-only)

### Content Management
- **Posts** - Text, images, videos, polls, links
- **Comments** - Threaded discussion support
- **Likes & Reactions** - Multiple reaction types
- **Shares & Retweets** - Content amplification
- **Bookmarks** - Save posts for later
- **Hashtags** - Content categorization and discovery
- **Mentions** - User tagging and notifications

### Search & Discovery
- **Full-Text Search** - Elasticsearch-powered content search
- **Hashtag Search** - Find trending topics
- **User Search** - Discover people
- **Advanced Filters** - Date range, media type, source
- **Autocomplete** - Real-time search suggestions

### Ranking Algorithm
- **Engagement Score** - Weighted likes, comments, shares
- **Recency Boost** - Time-decay function
- **Personalization** - User interest matching
- **Diversity** - Content source variety
- **Quality Signals** - Verified accounts, content quality

### Background Processing
- **Bull Queues** - Redis-backed job processing
- **Fan-Out Workers** - Distribute posts to follower timelines
- **Content Indexing** - Async Elasticsearch updates
- **Notification Triggers** - Herald integration
- **Analytics Events** - Pulse integration

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Databases:**
  - PostgreSQL (relational data: `exprsn_timeline`)
  - Elasticsearch (search and discovery)
- **Cache/Queues:** Redis with Bull
- **Real-Time:** Socket.IO
- **Media Processing:** Sharp (image optimization)

### Performance Optimizations
- **Read/Write Separation** - Optimized for read-heavy workload
- **Timeline Caching** - Redis-cached timeline segments
- **Connection Pooling** - PostgreSQL connection management
- **Batch Operations** - Bulk inserts for fan-out
- **Lazy Loading** - On-demand content fetching
- **CDN Integration** - Static asset delivery

### Database Schema

**Tables:**
- `posts` - Post content and metadata
- `comments` - Post comments
- `likes` - Post/comment likes
- `shares` - Post shares/retweets
- `bookmarks` - Saved posts
- `hashtags` - Hashtag registry
- `post_hashtags` - Post-hashtag mapping
- `mentions` - User mentions
- `timelines` - User timeline cache
- `timeline_entries` - Timeline post entries
- `user_follows` - Follow relationships
- `muted_users` - Muted user list
- `blocked_users` - Blocked user list
- `media_attachments` - Post media files
- `polls` - Poll definitions
- `poll_votes` - User poll votes

---

## API Endpoints

### Post Management

#### `POST /api/posts`
Create a new post.

**Request:**
```json
{
  "content": "Hello World! #introduction",
  "visibility": "public",
  "mediaUrls": [
    "https://cdn.exprsn.io/media/abc123.jpg"
  ],
  "poll": {
    "question": "What's your favorite color?",
    "options": ["Red", "Blue", "Green"],
    "duration": 86400
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "content": "Hello World! #introduction",
    "visibility": "public",
    "mediaUrls": ["https://..."],
    "hashtags": ["introduction"],
    "mentions": [],
    "stats": {
      "likes": 0,
      "comments": 0,
      "shares": 0
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `GET /api/posts/:id`
Get post by ID.

#### `PUT /api/posts/:id`
Update post (owner only).

#### `DELETE /api/posts/:id`
Delete post (owner or admin).

---

### Timeline Endpoints

#### `GET /api/timeline`
Get user's personalized timeline.

**Query Parameters:**
- `cursor` - Pagination cursor (optional)
- `limit` - Results per page (default: 20, max: 100)
- `since` - Timestamp for real-time updates (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "userId": "uuid",
        "username": "johndoe",
        "content": "Post content...",
        "createdAt": "2024-01-01T00:00:00Z",
        "stats": {
          "likes": 42,
          "comments": 5,
          "shares": 3
        },
        "userInteraction": {
          "liked": false,
          "bookmarked": false,
          "shared": false
        }
      }
    ],
    "nextCursor": "abc123xyz",
    "hasMore": true
  }
}
```

#### `GET /api/timeline/user/:userId`
Get user's posts (public profile).

#### `GET /api/timeline/hashtag/:hashtag`
Get posts by hashtag.

#### `GET /api/timeline/bookmarks`
Get user's bookmarked posts.

---

### Engagement Endpoints

#### `POST /api/posts/:id/like`
Like a post.

#### `DELETE /api/posts/:id/like`
Unlike a post.

#### `POST /api/posts/:id/share`
Share/retweet a post.

**Request:**
```json
{
  "comment": "Check this out!"
}
```

#### `POST /api/posts/:id/bookmark`
Bookmark a post.

#### `DELETE /api/posts/:id/bookmark`
Remove bookmark.

---

### Comment Endpoints

#### `GET /api/posts/:id/comments`
Get post comments.

**Query Parameters:**
- `cursor` - Pagination cursor
- `limit` - Results per page
- `sort` - Sort order (popular, recent)

#### `POST /api/posts/:id/comments`
Add comment.

**Request:**
```json
{
  "content": "Great post!",
  "parentId": "uuid"
}
```

#### `PUT /api/comments/:id`
Update comment.

#### `DELETE /api/comments/:id`
Delete comment.

---

### Search Endpoints

#### `GET /api/search/posts`
Search posts.

**Query Parameters:**
- `q` - Search query (required)
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)
- `mediaType` - Filter by media (image, video, poll)
- `hashtags` - Hashtag filters (comma-separated)
- `cursor` - Pagination cursor
- `limit` - Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "content": "Matching post content...",
        "highlights": {
          "content": "Matching <em>post</em> content..."
        },
        "score": 8.5,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 156,
    "nextCursor": "xyz789",
    "hasMore": true
  }
}
```

#### `GET /api/search/hashtags`
Search hashtags with autocomplete.

**Query Parameters:**
- `q` - Search prefix
- `limit` - Results count (default: 10)

#### `GET /api/search/users`
Search users.

---

### Follow Management

#### `POST /api/users/:id/follow`
Follow a user.

#### `DELETE /api/users/:id/follow`
Unfollow a user.

#### `GET /api/users/:id/followers`
Get user's followers.

#### `GET /api/users/:id/following`
Get users followed by user.

---

### Moderation Endpoints

#### `POST /api/posts/:id/report`
Report post for moderation.

**Request:**
```json
{
  "reason": "spam",
  "details": "This appears to be spam content"
}
```

#### `POST /api/users/:id/mute`
Mute user (hide their content).

#### `POST /api/users/:id/block`
Block user (mutual visibility restriction).

---

## Configuration

### Environment Variables

```env
# Application
NODE_ENV=development|production
PORT=3004
SERVICE_NAME=exprsn-timeline

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_timeline
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_MIN=5
DB_POOL_MAX=30

# Elasticsearch
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=exprsn_timeline
ELASTICSEARCH_MAX_RETRIES=3

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_KEY_PREFIX=timeline:

# Bull Queues
QUEUE_CONCURRENCY=10
QUEUE_MAX_ATTEMPTS=3
QUEUE_BACKOFF_TYPE=exponential
QUEUE_BACKOFF_DELAY=2000

# Timeline Configuration
TIMELINE_PAGE_SIZE=20
TIMELINE_MAX_PAGE_SIZE=100
TIMELINE_CACHE_TTL=300
HOME_TIMELINE_SIZE=1000
FAN_OUT_BATCH_SIZE=1000

# Ranking Algorithm
RANKING_RECENCY_WEIGHT=0.4
RANKING_ENGAGEMENT_WEIGHT=0.4
RANKING_PERSONALIZATION_WEIGHT=0.2
RANKING_TIME_DECAY_HOURS=48

# Content Limits
MAX_POST_LENGTH=5000
MAX_COMMENT_LENGTH=1000
MAX_HASHTAGS_PER_POST=10
MAX_MENTIONS_PER_POST=20
MAX_MEDIA_PER_POST=4
MAX_POLL_OPTIONS=10

# Media Processing
MEDIA_UPLOAD_MAX_SIZE=10485760
IMAGE_MAX_WIDTH=2048
IMAGE_MAX_HEIGHT=2048
IMAGE_QUALITY=85
VIDEO_MAX_SIZE=104857600

# Rate Limiting
RATE_LIMIT_POST_PER_HOUR=20
RATE_LIMIT_COMMENT_PER_HOUR=60
RATE_LIMIT_LIKE_PER_HOUR=100

# Real-Time
SOCKET_IO_ENABLED=true
SOCKET_IO_PATH=/socket.io
SOCKET_IO_TRANSPORTS=websocket,polling

# Service Integration
CA_URL=http://localhost:3000
AUTH_URL=http://localhost:3001
HERALD_URL=http://localhost:3014
PULSE_URL=http://localhost:3012
MODERATOR_URL=http://localhost:3006
FILEVAULT_URL=http://localhost:3007

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### Create Post with Media

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Upload media to FileVault first
async function uploadMedia(filePath, token) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post('http://localhost:3007/api/upload', form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data.data.url;
}

// Create post with uploaded media
async function createPostWithMedia(token) {
  const mediaUrl = await uploadMedia('/path/to/image.jpg', token);

  const response = await axios.post('http://localhost:3004/api/posts', {
    content: 'Check out this amazing photo! #photography',
    visibility: 'public',
    mediaUrls: [mediaUrl]
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data.data;
}
```

### Real-Time Timeline Updates

```javascript
const io = require('socket.io-client');

// Connect to timeline socket
const socket = io('http://localhost:3004', {
  auth: {
    token: 'your-ca-token'
  }
});

// Listen for new posts
socket.on('new_post', (post) => {
  console.log('New post in timeline:', post);
  // Update UI with new post
});

// Listen for post updates
socket.on('post_updated', (data) => {
  console.log('Post updated:', data.postId);
  // Update post in UI
});

// Listen for post deletions
socket.on('post_deleted', (data) => {
  console.log('Post deleted:', data.postId);
  // Remove post from UI
});

// Request timeline updates
socket.emit('subscribe_timeline', {
  userId: 'current-user-id'
});
```

### Search with Filters

```javascript
async function searchPosts(query, filters, token) {
  const params = new URLSearchParams({
    q: query,
    ...filters
  });

  const response = await axios.get(
    `http://localhost:3004/api/search/posts?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data.data;
}

// Example: Search for posts with images from last week
const results = await searchPosts('vacation', {
  mediaType: 'image',
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  limit: 20
}, token);
```

---

## Development

### Setup

```bash
# Navigate to service directory
cd src/exprsn-timeline

# Install dependencies
npm install

# Setup PostgreSQL database
npm run migrate:pg

# Setup Elasticsearch
npm run setup:elasticsearch

# Seed data
npm run seed

# Start main service
npm run dev

# Start worker (separate terminal)
npm run worker
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage (target: 70%)
npm run test:coverage

# Run integration tests
npm run test:integration

# Run ranking algorithm tests
npm run test:ranking

# Load testing
npm run test:load
```

---

## Performance Considerations

### Timeline Generation
- **Fan-out on write** - Pre-compute timelines during post creation
- **Limit fan-out** - Use pull model for users with many followers (>10k)
- **Cache aggressively** - Redis cache for hot timelines
- **Pagination** - Always use cursor-based pagination

### Database Optimization
- **Index everything** - User IDs, timestamps, hashtags
- **Partial indexes** - For visibility filters
- **Materialized views** - For aggregate queries
- **Query optimization** - Use EXPLAIN ANALYZE

### Elasticsearch
- **Bulk indexing** - Batch document updates
- **Refresh interval** - Increase for write-heavy loads
- **Replica shards** - Scale read capacity
- **Index lifecycle** - Archive old posts

---

## Troubleshooting

**Issue:** Timeline updates are slow
**Solution:** Check Redis connection, increase cache TTL, optimize database queries

**Issue:** Search results are stale
**Solution:** Verify Elasticsearch indexing queue, check worker status

**Issue:** Fan-out queue backing up
**Solution:** Increase worker concurrency, add more workers, implement hybrid model

**Issue:** Memory usage high
**Solution:** Review timeline cache size, implement cache eviction policy

---

## Dependencies

- **express** (^4.18.2)
- **sequelize** (^6.35.2)
- **@elastic/elasticsearch** (^8.11.0)
- **bull** (^4.12.0)
- **socket.io** (^4.7.2)
- **sharp** (^0.33.1)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
