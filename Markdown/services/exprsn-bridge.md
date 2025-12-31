# Exprsn Bridge (exprsn-bridge)

**Version:** 1.0.0
**Port:** 3010
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Bridge** is the API Gateway for the Exprsn ecosystem. It provides a unified entry point for all external API requests, handling authentication, rate limiting, request routing, load balancing, and API transformation.

---

## Key Features

### API Gateway
- **Unified Endpoint** - Single entry point for all services
- **Request Routing** - Intelligent service routing
- **Load Balancing** - Distribute load across service instances
- **Service Discovery** - Automatic service detection
- **Health Checking** - Monitor backend service health
- **Failover** - Automatic failover to healthy instances

### Security
- **Token Validation** - CA token verification
- **Rate Limiting** - Per-user and per-IP limits
- **IP Whitelisting/Blacklisting** - Access control
- **Request Signing** - Verify request integrity
- **CORS Handling** - Cross-origin request management
- **Security Headers** - Helmet.js integration

### Rate Limiting
- **User-Based Limits** - Per-user quotas
- **IP-Based Limits** - Per-IP rate limits
- **Endpoint-Specific Limits** - Custom limits per route
- **Burst Protection** - Token bucket algorithm
- **Redis-Backed** - Distributed rate limiting
- **Custom Strategies** - Flexible limit configuration

### Request/Response Transformation
- **Request Mapping** - Transform incoming requests
- **Response Formatting** - Standardize responses
- **Data Enrichment** - Add metadata to responses
- **Error Normalization** - Consistent error format
- **Versioning** - API version management

### Monitoring & Analytics
- **Request Logging** - Comprehensive audit trail
- **Metrics Collection** - Performance metrics
- **Error Tracking** - Centralized error logging
- **Usage Analytics** - API usage patterns
- **Performance Monitoring** - Response time tracking

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (`exprsn_bridge`)
- **Cache:** Redis (rate limiting, caching)
- **HTTP Client:** Axios
- **Rate Limiter:** express-rate-limit with Redis

### Route Configuration

**Service Routing Table:**
```
/api/auth/*       → exprsn-auth (3001)
/api/timeline/*   → exprsn-timeline (3004)
/api/spark/*      → exprsn-spark (3002)
/api/crm/*        → exprsn-forge (3016)
/api/workflow/*   → exprsn-workflow (3017)
/api/files/*      → exprsn-filevault (3007)
/api/live/*       → exprsn-live (3009)
/api/nexus/*      → exprsn-nexus (3011)
/api/analytics/*  → exprsn-pulse (3012)
```

---

## API Endpoints

### Gateway Management

#### `GET /health`
Gateway health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "exprsn-bridge",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 86400,
  "services": {
    "auth": "healthy",
    "timeline": "healthy",
    "spark": "healthy",
    "forge": "healthy"
  }
}
```

#### `GET /api/gateway/routes`
List available routes.

#### `GET /api/gateway/stats`
Get gateway statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1234567,
    "requestsPerMinute": 450,
    "averageResponseTime": 125,
    "errorRate": 0.02,
    "activeConnections": 234
  }
}
```

---

### Rate Limit Information

#### `GET /api/gateway/rate-limit`
Get current rate limit status.

**Response:**
```json
{
  "success": true,
  "data": {
    "limit": 1000,
    "remaining": 856,
    "reset": 1704067200000,
    "retryAfter": null
  }
}
```

---

## Rate Limiting Configuration

### Default Limits

| Tier | Requests/Hour | Requests/Minute | Burst |
|------|---------------|-----------------|-------|
| Free | 1000 | 50 | 20 |
| Basic | 5000 | 100 | 50 |
| Pro | 20000 | 500 | 100 |
| Enterprise | Unlimited | 2000 | 500 |

### Endpoint-Specific Limits

```javascript
{
  "POST /api/timeline/posts": {
    "limit": 20,
    "window": "1h"
  },
  "POST /api/auth/login": {
    "limit": 10,
    "window": "15m"
  },
  "POST /api/files/upload": {
    "limit": 50,
    "window": "1h",
    "maxSize": "10MB"
  }
}
```

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=3010
SERVICE_NAME=exprsn-bridge

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_bridge
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PREFIX=bridge:

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# Service Discovery
SERVICE_DISCOVERY_ENABLED=true
SERVICE_HEALTH_CHECK_INTERVAL=30000
SERVICE_TIMEOUT_MS=30000

# Backend Services
AUTH_SERVICE_URL=http://localhost:3001
TIMELINE_SERVICE_URL=http://localhost:3004
SPARK_SERVICE_URL=http://localhost:3002
FORGE_SERVICE_URL=http://localhost:3016
WORKFLOW_SERVICE_URL=http://localhost:3017
FILEVAULT_SERVICE_URL=http://localhost:3007
LIVE_SERVICE_URL=http://localhost:3009
NEXUS_SERVICE_URL=http://localhost:3011
PULSE_SERVICE_URL=http://localhost:3012
VAULT_SERVICE_URL=http://localhost:3013
HERALD_SERVICE_URL=http://localhost:3014

# Load Balancing
LOAD_BALANCER_STRATEGY=round-robin
MAX_RETRIES=3
RETRY_DELAY_MS=1000

# Security
CORS_ENABLED=true
CORS_ORIGIN=*
HELMET_ENABLED=true
IP_WHITELIST=
IP_BLACKLIST=

# Caching
RESPONSE_CACHE_ENABLED=true
RESPONSE_CACHE_TTL=300

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
LOG_REQUESTS=true
```

---

## Usage Examples

### Making API Requests Through Bridge

```javascript
const axios = require('axios');

// All requests go through bridge gateway
const BRIDGE_URL = 'http://localhost:3010';

// Authentication
async function login() {
  const response = await axios.post(`${BRIDGE_URL}/api/auth/login`, {
    email: 'user@example.com',
    password: 'password'
  });
  return response.data.data.accessToken;
}

// Timeline operations
async function createPost(token, content) {
  const response = await axios.post(
    `${BRIDGE_URL}/api/timeline/posts`,
    { content },
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return response.data.data;
}

// File upload
async function uploadFile(token, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${BRIDGE_URL}/api/files/upload`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}
```

### Handling Rate Limits

```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios(url, options);
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const delay = (retryAfter || (i + 1) * 1000);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Development

```bash
cd src/exprsn-bridge
npm install
npm run migrate
npm run dev
```

---

## Monitoring

### Key Metrics
- **Request Rate** - Requests per second
- **Response Time** - Average latency
- **Error Rate** - Failed requests percentage
- **Rate Limit Hits** - Throttled requests
- **Service Health** - Backend availability
- **Cache Hit Rate** - Response cache effectiveness

---

## Dependencies

- **express** (^4.18.2)
- **axios** (^1.6.5)
- **express-rate-limit** (^7.1.5)
- **rate-limit-redis** (^4.2.0)
- **helmet** (^7.1.0)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
