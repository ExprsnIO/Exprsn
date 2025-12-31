# Exprsn Certificate Authority (exprsn-ca)

**Version:** 1.0.0
**Port:** 3000
**OCSP Port:** 2560
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

The **Exprsn Certificate Authority (CA)** is the foundational security service of the Exprsn ecosystem. It provides a comprehensive Public Key Infrastructure (PKI) implementation with X.509 certificate management and cryptographically-signed CA tokens for inter-service authentication.

**⚠️ CRITICAL:** This service **MUST START FIRST** as all other services depend on it for token generation and validation.

---

## Key Features

### Certificate Management
- **Root CA Certificate Generation** - Self-signed root certificate with 4096-bit RSA keys
- **X.509 v3 Certificates** - Full support for X.509 certificate standards
- **Certificate Lifecycle** - Issuance, renewal, and revocation management
- **Certificate Storage** - PostgreSQL-backed certificate repository

### CA Token System
- **Cryptographically Signed Tokens** - RSA-SHA256-PSS signature algorithm
- **Fine-Grained Permissions** - read, write, append, delete, update
- **Resource-Specific** - URL-based resource targeting with wildcard support
- **Expiry Management** - Time-based and usage-based expiration
- **Token Validation API** - Fast signature and permission verification

### OCSP (Online Certificate Status Protocol)
- **Real-time Certificate Status** - Instant revocation checking
- **RFC 6960 Compliant** - Standard OCSP implementation
- **Separate OCSP Responder** - Runs on dedicated port (2560)
- **High Performance** - Cached responses with configurable TTL

### CRL (Certificate Revocation List)
- **Delta CRLs** - Incremental revocation lists for efficiency
- **Automatic Generation** - Scheduled CRL updates
- **HTTP Distribution** - Standard CRL download endpoints
- **PEM Format** - Industry-standard encoding

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (database: `exprsn_ca`)
- **Cache:** Redis (optional but recommended)
- **Cryptography:** node-forge, built-in crypto
- **View Engine:** EJS
- **Session Store:** connect-pg-simple

### Security Features
- **Helmet.js** - Security headers
- **Rate Limiting** - Express rate limiter with Redis backend
- **CORS Protection** - Configurable cross-origin policies
- **Session Management** - PostgreSQL-backed sessions
- **Input Validation** - Joi schemas for all endpoints
- **Audit Logging** - Winston-based structured logging

### Database Schema

**Tables:**
- `certificates` - X.509 certificate storage
- `tokens` - CA token registry
- `revocations` - Certificate/token revocation records
- `ocsp_responses` - Cached OCSP responses
- `sessions` - User session data
- `audit_logs` - Security audit trail

---

## CA Token Specification (v1.0)

### Token Structure

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "version": "1.0",
  "permissions": {
    "read": true,
    "write": false,
    "append": false,
    "delete": false,
    "update": false
  },
  "resource": {
    "type": "url",
    "value": "https://api.exprsn.io/resource/*"
  },
  "expiryType": "time",
  "expiresAt": 1730419200000,
  "signature": "base64-encoded-rsa-pss-signature"
}
```

### Permission Types

| Permission | Description |
|------------|-------------|
| `read` | Read access to resource |
| `write` | Write/create new resources |
| `append` | Append to existing resources |
| `delete` | Delete resources |
| `update` | Modify existing resources |

### Resource Types

| Type | Description | Example |
|------|-------------|---------|
| `url` | HTTP/HTTPS endpoint | `https://api.exprsn.io/*` |
| `service` | Service identifier | `exprsn-timeline` |
| `database` | Database resource | `exprsn_timeline.posts` |

### Expiry Types

| Type | Description |
|------|-------------|
| `time` | Unix timestamp expiration |
| `usage` | Max usage count |
| `session` | Session-based expiration |

---

## API Endpoints

### Certificate Endpoints

#### `POST /api/certificates/generate`
Generate a new certificate.

**Request:**
```json
{
  "commonName": "user@example.com",
  "validityDays": 365,
  "keySize": 2048
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificateId": "uuid",
    "certificate": "-----BEGIN CERTIFICATE-----...",
    "privateKey": "-----BEGIN PRIVATE KEY-----...",
    "serialNumber": "1234567890",
    "validFrom": "2024-01-01T00:00:00Z",
    "validTo": "2025-01-01T00:00:00Z"
  }
}
```

#### `GET /api/certificates/:id`
Retrieve certificate by ID.

#### `POST /api/certificates/:id/revoke`
Revoke a certificate.

**Request:**
```json
{
  "reason": "keyCompromise"
}
```

---

### Token Endpoints

#### `POST /api/tokens/generate`
Generate a new CA token.

**Request:**
```json
{
  "permissions": {
    "read": true,
    "write": true
  },
  "resource": {
    "type": "url",
    "value": "https://api.exprsn.io/timeline/*"
  },
  "expiryType": "time",
  "validityMinutes": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsInZlcnNpb24iOiIxLjAiLCAicGVybWlzc2lvbnMiOnsgInJlYWQiOnRydWUsIndyaXRlIjp0cnVlfSwicmVzb3VyY2UiOnsidHlwZSI6InVybCIsInZhbHVlIjoiaHR0cHM6Ly9hcGkuZXhwcnNuLmlvL3RpbWVsaW5lLyoifSwiZXhwaXJ5VHlwZSI6InRpbWUiLCAiZXhwaXJlc0F0IjoxNzMwNDE5MjAwMDAwLCAic2lnbmF0dXJlIjoiYmFzZTY0LXNpZ25hdHVyZSJ9",
    "expiresAt": 1730419200000
  }
}
```

#### `POST /api/tokens/validate`
Validate a CA token.

**Request:**
```json
{
  "token": "base64-token-string",
  "resource": "https://api.exprsn.io/timeline/posts/123",
  "requiredPermissions": ["read"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "tokenId": "uuid",
    "permissions": {
      "read": true,
      "write": true
    },
    "expiresAt": 1730419200000
  }
}
```

#### `POST /api/tokens/:id/revoke`
Revoke a token.

---

### OCSP Endpoints

#### `POST /api/ocsp`
OCSP request (DER-encoded).

**Headers:**
```
Content-Type: application/ocsp-request
```

**Response:**
```
Content-Type: application/ocsp-response
Status: good | revoked | unknown
```

#### `GET /api/ocsp/:serialNumber`
Check certificate status by serial number.

**Response:**
```json
{
  "success": true,
  "data": {
    "serialNumber": "1234567890",
    "status": "good",
    "thisUpdate": "2024-01-01T00:00:00Z",
    "nextUpdate": "2024-01-02T00:00:00Z"
  }
}
```

---

### CRL Endpoints

#### `GET /api/crl`
Download current Certificate Revocation List.

**Response:**
```
Content-Type: application/pkix-crl
-----BEGIN X509 CRL-----
...
-----END X509 CRL-----
```

#### `GET /api/crl/delta`
Download delta CRL (incremental changes).

---

### Admin Endpoints

#### `GET /api/admin/stats`
Get CA statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCertificates": 1234,
    "activeCertificates": 1000,
    "revokedCertificates": 234,
    "totalTokens": 5678,
    "activeTokens": 4000,
    "revokedTokens": 1678
  }
}
```

---

## Configuration

### Environment Variables

```env
# Application
NODE_ENV=development|production
PORT=3000
OCSP_PORT=2560

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_ca
DB_USER=postgres
DB_PASSWORD=your_password

# Redis (optional)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# CA Configuration
CA_NAME=Exprsn Root CA
CA_DOMAIN=localhost
CA_COUNTRY=US
CA_STATE=California
CA_CITY=San Francisco
CA_ORG=Exprsn Inc
CA_ORG_UNIT=Security

# Certificate Defaults
DEFAULT_CERT_VALIDITY_DAYS=365
DEFAULT_KEY_SIZE=2048
ROOT_CA_KEY_SIZE=4096

# Token Defaults
DEFAULT_TOKEN_VALIDITY_MINUTES=60
MAX_TOKEN_VALIDITY_DAYS=90

# OCSP Configuration
OCSP_ENABLED=true
OCSP_RESPONSE_CACHE_MINUTES=60

# CRL Configuration
CRL_ENABLED=true
CRL_UPDATE_INTERVAL_HOURS=24
DELTA_CRL_ENABLED=true

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-secret-key
SESSION_MAX_AGE=86400000

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### Service-to-Service Authentication

```javascript
const axios = require('axios');

// Generate service token
async function getServiceToken() {
  const response = await axios.post('http://localhost:3000/api/tokens/generate', {
    permissions: {
      read: true,
      write: true
    },
    resource: {
      type: 'url',
      value: 'http://localhost:3004/api/*'
    },
    expiryType: 'time',
    validityMinutes: 60
  });

  return response.data.data.token;
}

// Use token for API request
async function makeAuthenticatedRequest() {
  const token = await getServiceToken();

  const response = await axios.post('http://localhost:3004/api/posts', {
    content: 'Hello World!'
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data;
}
```

### Token Validation Middleware

```javascript
const axios = require('axios');

async function validateCAToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No token provided'
    });
  }

  try {
    const response = await axios.post('http://localhost:3000/api/tokens/validate', {
      token,
      resource: req.originalUrl,
      requiredPermissions: ['read']
    });

    if (response.data.data.valid) {
      req.token = response.data.data;
      next();
    } else {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token validation failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Token validation error'
    });
  }
}

// Use middleware
app.get('/api/protected', validateCAToken, (req, res) => {
  res.json({ message: 'Access granted!' });
});
```

---

## Development

### Setup

```bash
# Navigate to service directory
cd src/exprsn-ca

# Install dependencies
npm install

# Initialize database
npm run migrate

# Seed default data
npm run seed

# Start in development mode
npm run dev
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Database Operations

```bash
# Run migrations
npm run migrate

# Seed data
npm run seed

# Reset database
dropdb exprsn_ca
createdb exprsn_ca
npm run migrate
npm run seed
```

---

## Security Best Practices

### Certificate Management
1. **Never share private keys** - Keep private keys secure
2. **Use strong key sizes** - Minimum 2048-bit RSA (4096-bit for root CA)
3. **Rotate certificates regularly** - Follow your security policy
4. **Monitor OCSP responses** - Set up alerts for revocation spikes
5. **Secure certificate storage** - Encrypt at rest

### Token Management
1. **Minimize token validity** - Use shortest practical validity period
2. **Use specific permissions** - Grant only required permissions
3. **Resource scoping** - Be as specific as possible with resource paths
4. **Revoke compromised tokens** - Implement immediate revocation
5. **Audit token usage** - Monitor for suspicious patterns

### Cryptographic Requirements
1. **Always use RSA-SHA256-PSS** - Never plain RSA signatures
2. **Validate all signatures** - Never skip verification
3. **Check certificate chains** - Verify full trust path
4. **Enforce expiry checks** - No grace periods
5. **Use secure random** - For all cryptographic operations

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "exprsn-ca",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "connected",
  "redis": "connected",
  "ocsp": "running"
}
```

### Metrics to Monitor

- **Token Generation Rate** - Requests per minute
- **Token Validation Rate** - Validations per second
- **Token Validation Failures** - Failed validations
- **Certificate Issuance Rate** - New certificates per day
- **Revocation Rate** - Revocations per day
- **OCSP Response Time** - Average response latency
- **Database Connections** - Active connection count
- **Redis Hit Rate** - Cache effectiveness

---

## Troubleshooting

### Common Issues

**Issue:** Token validation fails with `INVALID_SIGNATURE`
**Solution:** Verify certificate/key pair match and using RSA-PSS algorithm

**Issue:** OCSP responder not accessible
**Solution:** Check OCSP_PORT (2560) is not blocked by firewall

**Issue:** High token generation latency
**Solution:** Enable Redis caching and check database performance

**Issue:** Certificate generation fails
**Solution:** Verify OpenSSL availability and key size configuration

**Issue:** Database connection errors
**Solution:** Check PostgreSQL is running and credentials are correct

---

## Dependencies

### Core Dependencies
- **express** (^4.18.2) - Web framework
- **sequelize** (^6.35.2) - ORM
- **pg** (^8.11.3) - PostgreSQL client
- **node-forge** (^1.3.1) - PKI and cryptography
- **jsonwebtoken** (^9.0.2) - JWT operations
- **bcrypt** (^5.1.1) - Password hashing
- **helmet** (^7.1.0) - Security headers
- **ioredis** (^5.3.2) - Redis client
- **winston** (^3.11.0) - Logging

### Development Dependencies
- **jest** (^29.7.0) - Testing framework
- **supertest** (^6.3.3) - HTTP assertions
- **nodemon** (^3.0.2) - Development server
- **eslint** (^8.56.0) - Linting
- **prettier** (^3.1.1) - Code formatting

---

## Related Documentation

- **Token Specification:** `/TOKEN_SPECIFICATION_V1.0.md`
- **Security Guide:** `/docs/SECURITY.md`
- **API Reference:** `/docs/API.md`
- **Deployment Guide:** `/docs/DEPLOYMENT.md`

---

## Support

For issues, questions, or contributions:
- **Email:** engineering@exprsn.com
- **Documentation:** See `/docs` directory
- **License:** MIT
