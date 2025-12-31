# Exprsn Setup (exprsn-setup)

**Version:** 1.0.0
**Port:** 3015
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Setup** is the service discovery and health monitoring service that tracks all Exprsn services, monitors their health status, and provides a centralized dashboard for system administration.

---

## Key Features

### Service Discovery
- **Auto-Discovery** - Automatic service registration
- **Service Registry** - Centralized service catalog
- **Health Monitoring** - Real-time health checks
- **Dependency Tracking** - Service dependency graph
- **Load Balancing Info** - Instance availability

### Health Monitoring
- **HTTP Health Checks** - Endpoint monitoring
- **Database Connectivity** - DB health verification
- **Redis Connectivity** - Cache health checks
- **Response Time Tracking** - Latency monitoring
- **Error Rate Monitoring** - Failure detection

### Admin Dashboard
- **Service Status Overview** - Visual status dashboard
- **System Metrics** - CPU, memory, disk usage
- **Service Logs** - Centralized log viewer
- **Configuration Management** - Service configuration
- **Quick Actions** - Restart, stop, start services

---

## API Endpoints

#### `GET /api/services`
List all registered services.

**Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "name": "exprsn-ca",
        "port": 3000,
        "status": "healthy",
        "uptime": 86400,
        "version": "1.0.0",
        "lastCheck": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### `GET /api/services/:name/health`
Get service health details.

#### `POST /api/services/:name/restart`
Restart service (admin only).

---

## Configuration

```env
PORT=3015
SERVICE_NAME=exprsn-setup
HEALTH_CHECK_INTERVAL=30000
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
