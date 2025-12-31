# Exprsn Prefetch (exprsn-prefetch)

**Version:** 1.0.0
**Port:** 3005
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Prefetch** is the timeline caching service that pre-computes and caches user timelines for faster feed loading. It works in conjunction with exprsn-timeline to provide near-instant timeline delivery.

---

## Key Features

### Timeline Caching
- **Pre-Computed Timelines** - Background timeline generation
- **Redis-Backed Cache** - Fast cache storage
- **Cache Warming** - Proactive cache population
- **Cache Invalidation** - Smart cache updates
- **Multi-Tier Caching** - Hot/warm/cold data tiers

### Performance Optimization
- **Lazy Loading** - Load data on demand
- **Batch Processing** - Bulk cache operations
- **Priority Queue** - High-priority user timelines first
- **Cache Compression** - Reduce memory usage
- **TTL Management** - Automatic cache expiration

---

## API Endpoints

#### `GET /api/timeline/:userId`
Get cached timeline.

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "cached": true,
    "cacheAge": 45,
    "nextCursor": "abc123"
  }
}
```

#### `POST /api/prefetch/:userId`
Trigger timeline prefetch.

#### `DELETE /api/cache/:userId`
Invalidate user's cache.

---

## Configuration

```env
PORT=3005
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=300
PREFETCH_ENABLED=true
TIMELINE_URL=http://localhost:3004
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
