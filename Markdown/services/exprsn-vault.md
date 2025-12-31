# Exprsn Vault (exprsn-vault)

**Version:** 1.0.0
**Port:** 3013
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Vault** is the secrets management service that securely stores and manages API keys, passwords, certificates, and other sensitive configuration data.

---

## Key Features

### Secrets Management
- **Encrypted Storage** - AES-256 encryption at rest
- **Key-Value Store** - Simple secret storage
- **Secret Versioning** - Track secret changes
- **Access Control** - Role-based access
- **Audit Logging** - Track secret access
- **Secret Rotation** - Automatic rotation policies

### Features
- **Dynamic Secrets** - Generate temporary credentials
- **Lease Management** - Time-limited access
- **Secret Engines** - Multiple secret types
- **Encryption as a Service** - Encrypt/decrypt API
- **Certificate Authority** - PKI integration

---

## API Endpoints

#### `POST /api/secrets`
Store secret.

**Request:**
```json
{
  "key": "database_password",
  "value": "secret-value",
  "metadata": {
    "env": "production",
    "service": "exprsn-timeline"
  }
}
```

#### `GET /api/secrets/:key`
Retrieve secret.

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "database_password",
    "value": "secret-value",
    "version": 2,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `PUT /api/secrets/:key`
Update secret (creates new version).

#### `DELETE /api/secrets/:key`
Delete secret.

---

## Configuration

```env
PORT=3013
DB_NAME=exprsn_vault
ENCRYPTION_KEY=your-master-key
AUTO_ROTATE_ENABLED=true
AUDIT_LOGGING_ENABLED=true
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
