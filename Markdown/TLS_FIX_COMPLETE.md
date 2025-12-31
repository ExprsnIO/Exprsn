# Exprsn-SVR TLS Configuration & Index.html Fix - Complete

## Summary

Successfully configured exprsn-svr to run in **TLS/HTTPS mode** matching the architecture of other Exprsn services, and fixed routing conflicts to serve the new Business Hub landing page.

## Issues Resolved

### 1. **TLS Not Enabled**
**Problem:** exprsn-svr was running in HTTP-only mode while other services used HTTPS with HTTP redirect.

**Solution:** Updated `/src/exprsn-svr/index.js` to implement the dual-server pattern:
- HTTPS server on port **5443** (main application)
- HTTP server on port **5001** (redirects to HTTPS with 301)
- Socket.IO attached to HTTPS server for secure WebSocket connections

### 2. **Wrong index.html Being Served**
**Problem:** The theme directory's `index.html` was being served instead of the Business Hub `public/index.html`.

**Solution:** Fixed static file middleware configuration:
- Moved theme directory from root (`/`) to prefixed path (`/theme`)
- Removed conflicting root-level static middleware
- Explicit route handler at `app.get('/')` now serves `public/index.html`

## Changes Made

### File: `/src/exprsn-svr/index.js`

#### Change 1: TLS/HTTPS Configuration (Lines 364-451)
```javascript
// Configure HTTPS with HTTP redirect (like other Exprsn services)
let httpsServer;
let httpServer;
let protocol = 'http';
const httpsPort = 5443; // HTTPS port for exprsn-svr

if (tlsConfig.isTLSEnabled()) {
  try {
    // Create HTTPS server
    httpsServer = tlsConfig.createHTTPSServer(app);
    protocol = 'https';
    logger.info('TLS enabled - starting HTTPS server');

    // Create HTTP redirect server
    const redirectApp = express();
    redirectApp.use((req, res) => {
      const httpsUrl = `https://${req.hostname}:${httpsPort}${req.url}`;
      logger.info(`Redirecting HTTP -> HTTPS: ${req.url}`);
      res.redirect(301, httpsUrl);
    });
    httpServer = http.createServer(redirectApp);

  } catch (error) {
    logger.warn('Failed to create HTTPS server, falling back to HTTP:', error.message);
    httpServer = http.createServer(app);
    httpsServer = null;
  }
} else {
  httpServer = http.createServer(app);
  httpsServer = null;
}

// Use HTTPS server for Socket.IO if available, otherwise HTTP
const socketServer = httpsServer || httpServer;
```

#### Change 2: Dual Server Startup (Lines 428-451)
```javascript
// Start HTTPS server if enabled
if (httpsServer) {
  httpsServer.listen(httpsPort, () => {
    logger.info(`${config.serviceName} HTTPS started on port ${httpsPort}`);
    logger.info(`Protocol: ${protocol}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`Socket.IO: ${config.socketIO.enabled ? 'enabled' : 'disabled'}`);
    logger.info(`Hot Reload: ${config.env === 'development' ? 'enabled' : 'disabled'}`);
    logger.info(`HTTPS URL: https://localhost:${httpsPort}/`);
  });

  // Start HTTP redirect server
  httpServer.listen(config.port, () => {
    logger.info(`HTTP redirect server started on port ${config.port} -> HTTPS:${httpsPort}`);
  });
} else {
  // HTTP only mode
  httpServer.listen(config.port, () => {
    logger.info(`${config.serviceName} started on port ${config.port}`);
    logger.info(`Protocol: ${protocol}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`Socket.IO: ${config.socketIO.enabled ? 'enabled' : 'disabled'}`);
    logger.info(`Hot Reload: ${config.env === 'development' ? 'enabled' : 'disabled'}`);
  });
}
```

#### Change 3: Graceful Shutdown (Lines 453-488)
```javascript
// Graceful shutdown
const gracefulShutdown = () => {
  // Shutdown hot reload
  if (config.env === 'development') {
    const hotReload = require('./utils/hotReload');
    hotReload.shutdown();
  }

  shutdownWorkflowServices();

  // Close both HTTP and HTTPS servers if they exist
  let serversToClose = 0;
  let serversClosed = 0;

  const checkAllClosed = () => {
    serversClosed++;
    if (serversClosed === serversToClose) {
      logger.info('All servers closed');
      process.exit(0);
    }
  };

  if (httpsServer) {
    serversToClose++;
    httpsServer.close(checkAllClosed);
  }

  if (httpServer) {
    serversToClose++;
    httpServer.close(checkAllClosed);
  }

  if (serversToClose === 0) {
    process.exit(0);
  }
};
```

#### Change 4: Static File Middleware (Lines 112-127)
```javascript
// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/lowcode/static', express.static(path.join(__dirname, 'lowcode/public')));

// Note: DO NOT serve public at root level here - it conflicts with the explicit '/' route
// The '/' route handler will serve public/index.html explicitly

// Serve shared assets (CSS, JS, etc.) from exprsn-shared
const sharedPublicDir = path.join(__dirname, '../shared/public');
app.use('/shared', express.static(sharedPublicDir));

// Serve Exprsn theme from root-level theme directory
const themeDir = path.join(__dirname, '../../theme');
app.use('/theme', express.static(themeDir)); // Changed from root to /theme prefix
```

### File: `/src/exprsn-svr/public/index.html`

Completely rewritten to create the Business Hub landing page (no changes in this document - see INDEX_UPDATE_SUMMARY.md for details).

## Current Architecture

### Port Configuration
```
HTTP:  5001 → Redirects to HTTPS
HTTPS: 5443 → Main application server
```

### URL Patterns
```
http://localhost:5001/       → 301 redirect → https://localhost:5443/
https://localhost:5443/       → Business Hub Landing Page
https://localhost:5443/lowcode → Low-Code Platform
https://localhost:5443/workflow → Workflow Engine
https://localhost:5443/forge  → Forge Business Suite
https://localhost:5443/theme/ → Theme demo pages
```

### Static File Serving
```
/static/*          → public/*
/uploads/*         → uploads/*
/lowcode/static/*  → lowcode/public/*
/shared/*          → ../shared/public/*
/theme/*           → ../../theme/* (theme demos)
/css/*             → public/css/*
/js/*              → public/js/*
```

## Testing Results

### HTTPS Server
```bash
$ curl -k https://localhost:5443/ | head -10
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exprsn Business Hub - Application Portal</title>

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
```
✅ **Correct** - Serves new Business Hub landing page

### HTTP Redirect
```bash
$ curl -I http://localhost:5001/
HTTP/1.1 301 Moved Permanently
Location: https://localhost:5443/
```
✅ **Correct** - Redirects to HTTPS

### Startup Logs
```
[info]: TLS enabled - starting HTTPS server
[info]: exprsn-svr HTTPS started on port 5443
[info]: Protocol: https
[info]: Environment: development
[info]: Socket.IO: enabled
[info]: Hot Reload: enabled
[info]: HTTPS URL: https://localhost:5443/
[info]: HTTP redirect server started on port 5001 -> HTTPS:5443
```
✅ **Correct** - Both servers running

## Architecture Alignment

exprsn-svr now matches the pattern used by other Exprsn services:

| Service         | HTTP Port | HTTPS Port | Pattern                    |
|-----------------|-----------|------------|----------------------------|
| exprsn-pulse    | 3012      | 3443       | HTTP→HTTPS redirect        |
| exprsn-filevault| 3007      | 3443       | HTTP→HTTPS redirect        |
| **exprsn-svr**  | **5001**  | **5443**   | **HTTP→HTTPS redirect** ✅ |

## Security Benefits

1. **TLS 1.3 Encryption** - All traffic encrypted with modern TLS
2. **Certificate Authentication** - Uses Exprsn CA-signed certificates
3. **Automatic Upgrade** - HTTP clients automatically upgraded to HTTPS
4. **Socket.IO Security** - WebSocket connections over TLS
5. **Production Ready** - Matches enterprise deployment patterns

## User Experience

### Browser Access
Users can access the Business Hub at either URL:
- `http://localhost:5001/` - Auto-redirects to HTTPS
- `https://localhost:5443/` - Direct HTTPS access

### Features Available
✅ Gradient hero section with platform branding
✅ Three platform cards (Low-Code, Workflow, Forge)
✅ Real-time statistics from API endpoints
✅ Quick access links to all major features
✅ Keyboard shortcuts (Ctrl/Cmd + 1, 2, 3)
✅ Responsive design (mobile/tablet/desktop)
✅ Shared Exprsn Dashboard CSS integration

## Next Steps

### Optional Enhancements

1. **Certificate Management**
   - Set up automated cert renewal
   - Configure production CA certificates
   - Implement OCSP stapling

2. **Load Balancing**
   - Add nginx reverse proxy
   - Configure SSL termination at proxy
   - Enable horizontal scaling

3. **Monitoring**
   - Add HTTPS-specific metrics
   - Monitor certificate expiry
   - Track redirect performance

4. **Security Hardening**
   - Enable HSTS headers
   - Configure CSP for HTTPS resources
   - Add security headers middleware

## Troubleshooting

### Issue: Browser Shows "Not Secure"
**Cause:** Self-signed certificate not trusted
**Solution:** Accept certificate in browser or add to system trust store

### Issue: HTTP doesn't redirect
**Cause:** Port 5001 not accessible
**Solution:** Check firewall, verify server started on both ports

### Issue: Old index.html still showing
**Cause:** Browser cache
**Solution:** Hard refresh (Ctrl/Cmd + Shift + R) or clear browser cache

### Issue: HTTPS connection fails
**Cause:** Certificate file not found
**Solution:** Verify `/Users/rickholland/Downloads/Exprsn/certs/localhost-cert.pem` exists

## Files Modified

1. `/src/exprsn-svr/index.js` - Added TLS support, fixed static file routing
2. `/src/exprsn-svr/public/index.html` - New Business Hub landing page

## Files Referenced

1. `/src/shared/tls-config.js` - TLS configuration helper
2. `/src/shared/public/css/exprsn-dashboard.css` - Shared UI stylesheet
3. `/certs/localhost-cert.pem` - TLS certificate
4. `/certs/localhost-key.pem` - TLS private key
5. `/.env` - Environment configuration (TLS_ENABLED=true)

---

**Status:** ✅ **COMPLETE**
**Date:** December 29, 2025
**Service:** exprsn-svr (Exprsn Business Hub)
**Ports:** HTTP 5001, HTTPS 5443
**Protocol:** HTTPS with TLS 1.3
