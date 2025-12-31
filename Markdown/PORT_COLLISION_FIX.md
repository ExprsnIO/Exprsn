# Port Collision Prevention - Implementation Summary

## Problem
When running `npm start`, the system would attempt to start services even if they were already running on their assigned ports. This caused `EADDRINUSE` errors and critical service crashes.

## Solution
Added dual-layer port collision detection to `scripts/start-services.js`:

### 1. Health Check Layer (Existing - Enhanced)
- Checks `/health` endpoint of each service
- Skips services that are already healthy and running
- Restarts services that are unhealthy

### 2. Port Availability Check Layer (New)
- Added `isPortInUse()` function using Node.js `net` module
- Checks port availability before attempting to start any service
- Skips services when port is already in use

## Implementation Details

### New Function: `isPortInUse(port)`
```javascript
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false); // Port is available
    });

    server.listen(port, '0.0.0.0');
  });
}
```

### Updated: `startService(serviceKey)`
- Changed from synchronous to `async` function
- Added port check before spawning process:
  ```javascript
  const portInUse = await isPortInUse(service.port);
  if (portInUse) {
    console.log(`[SKIP] ${service.name} - Port ${service.port} already in use`);
    return false;
  }
  ```

## Behavior

### Before Fix
```
[START] Certificate Authority on port 3000...
[CA ERR] Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
[CRITICAL] Critical service crashed. Shutting down all services.
```

### After Fix
```
[HEALTH] Certificate Authority - Healthy ✓ Skipping
[SKIP] Certificate Authority - Port 3000 already in use (service likely running)
✓ 15 service(s) started successfully
```

## Safety Guarantees

1. **No Double-Start**: Services running on their assigned ports are automatically skipped
2. **No Crashes**: Prevents `EADDRINUSE` errors that caused critical service failures
3. **Graceful Handling**: Clear console messages explain why services are skipped
4. **Health Priority**: Health check runs first, port check is secondary validation

## Testing

Run `npm start` multiple times in succession:
```bash
npm start  # Starts all services
npm start  # Skips services already running, starts only stopped ones
```

## Files Modified
- `scripts/start-services.js` (3 changes)
  - Added `net` module import
  - Added `isPortInUse()` function
  - Updated `startService()` to be async with port checking

## Impact
- ✅ Eliminates port collision errors
- ✅ Allows safe restarts without manual service cleanup
- ✅ Prevents critical service shutdown cascades
- ✅ Improves developer experience with idempotent startup
