# Plugin Creation System

## Overview

The Exprsn Low-Code Platform now includes a comprehensive plugin creation wizard that enables developers to quickly scaffold custom plugins with full support for routes, middleware, Socket.IO handlers, database models, views, and static assets.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Plugin Creator Wizard                   │
│         (/lowcode/plugins/create)                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Basic   │  │ Features │  │  Routes  │             │
│  │   Info   │  │ Selection│  │  Config  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Middleware│  │ Socket.IO│  │  Review  │             │
│  │  Config  │  │  Events  │  │ Generate │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
         POST /lowcode/api/plugins/generate
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Plugin Scaffolder Service                   │
│      (lowcode/services/PluginScaffolder.js)             │
│                                                          │
│  • Validates plugin configuration                       │
│  • Creates plugin directory structure                   │
│  • Generates index.js with lifecycle hooks              │
│  • Generates routes.js (if enabled)                     │
│  • Generates middleware.js (if enabled)                 │
│  • Generates socketHandlers.js (if enabled)             │
│  • Generates models/ directory (if enabled)             │
│  • Generates views/ directory (if enabled)              │
│  • Generates public/ assets (if enabled)                │
│  • Generates package.json with metadata                 │
│  • Generates README.md documentation                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Generated Plugin                        │
│           (plugins/{plugin-name}/)                       │
│                                                          │
│  plugin-name/                                           │
│  ├── index.js           # Main plugin class             │
│  ├── package.json       # NPM metadata                  │
│  ├── README.md          # Documentation                 │
│  ├── routes.js          # HTTP route handlers           │
│  ├── middleware.js      # Express middleware            │
│  ├── socketHandlers.js  # Socket.IO event handlers      │
│  ├── settings.js        # Configuration                 │
│  ├── models/            # Database models               │
│  │   └── index.js                                       │
│  ├── views/             # EJS templates                 │
│  │   └── *.ejs                                          │
│  └── public/            # Static assets                 │
│      ├── css/                                           │
│      ├── js/                                            │
│      └── images/                                        │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │   Hot Reload System │
              │   Automatically     │
              │   detects and       │
              │   reloads plugin    │
              │   changes           │
              └─────────────────────┘
```

## Features

### 1. Visual Wizard Interface

- **6-Step Process**: Guides users through plugin configuration
  - Basic Info (name, description, author, version, license)
  - Features Selection (routes, middleware, Socket.IO, database, views, assets)
  - Route Configuration (path, method, description)
  - Middleware Configuration (name, global/local, description)
  - Socket.IO Events Configuration (event name, description)
  - Review & Generate

- **Theme Integration**: Fully styled with Exprsn theme (light/dark mode support)
- **Auto-Save**: Drafts saved to localStorage
- **Progress Tracking**: Visual step navigation with completion indicators
- **Real-Time Feedback**: Socket.IO integration for generation status updates

### 2. Plugin Scaffolder Service

**Location**: `lowcode/services/PluginScaffolder.js`

Generates complete plugin structure based on wizard configuration:

```javascript
await PluginScaffolder.generatePlugin({
  basic: {
    name: 'my-awesome-plugin',
    description: 'A plugin that does awesome things',
    author: 'Your Name',
    version: '1.0.0',
    license: 'MIT'
  },
  features: {
    routes: true,
    middleware: true,
    socketio: true,
    database: true,
    views: true,
    assets: true
  },
  routes: [
    { method: 'GET', path: '/api/data', description: 'Get data' },
    { method: 'POST', path: '/api/data', description: 'Create data' }
  ],
  middleware: [
    { name: 'authCheck', global: true, description: 'Authentication middleware' }
  ],
  socketEvents: [
    { name: 'data:update', description: 'Handle data updates' }
  ]
});
```

### 3. Generated Plugin Structure

#### Main Plugin Class (`index.js`)

```javascript
class MyAwesomePluginPlugin {
  constructor() {
    this.name = 'my-awesome-plugin';
    this.version = '1.0.0';
    this.description = 'A plugin that does awesome things';
  }

  async initialize(app, io) {
    // Register database models
    await models.sync();

    // Register middleware
    middleware.register(app);

    // Register routes
    app.use('/my-awesome-plugin', routes);

    // Register Socket.IO handlers
    socketHandlers.register(io);
  }

  async shutdown() {
    // Cleanup resources
  }
}

module.exports = MyAwesomePluginPlugin;
```

#### Routes (`routes.js`)

```javascript
const express = require('express');
const router = express.Router();

router.get('/api/data', async (req, res) => {
  try {
    // TODO: Implement handler logic
    res.json({ success: true, message: 'GET /api/data endpoint' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

#### Middleware (`middleware.js`)

```javascript
function authCheck(req, res, next) {
  // TODO: Implement middleware logic
  console.log('[authCheck] Processing request:', req.path);
  next();
}

function register(app) {
  app.use(authCheck); // Global middleware
}

module.exports = { authCheck, register };
```

#### Socket.IO Handlers (`socketHandlers.js`)

```javascript
function handleDataUpdate(socket, data) {
  console.log('[Socket.IO] data:update:', data);
  // TODO: Implement event handler logic
  socket.emit('data:update:response', {
    success: true,
    message: 'Event processed'
  });
}

function register(io) {
  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    socket.on('data:update', (data) => {
      handleDataUpdate(socket, data);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });
}

module.exports = { register };
```

#### Database Models (`models/index.js`)

```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exprsn',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: false
});

// Import models here
// const SampleModel = require('./SampleModel');

const models = {
  sequelize,
  Sequelize,
  // Add models here
};

async function sync() {
  await sequelize.sync({ alter: false });
  console.log('Models synchronized');
}

module.exports = { ...models, sync };
```

#### Package.json

```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "A plugin that does awesome things",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT",
  "keywords": [],
  "dependencies": {},
  "exprsn": {
    "plugin": true,
    "version": "1.0.0",
    "compatibility": "^1.0.0"
  }
}
```

## API Endpoints

### Plugin Generation

**POST** `/lowcode/api/plugins/generate`

Generate a new plugin from wizard configuration.

**Request Body:**
```json
{
  "basic": {
    "name": "my-plugin",
    "description": "Plugin description",
    "author": "Author Name",
    "version": "1.0.0",
    "license": "MIT"
  },
  "features": {
    "routes": true,
    "middleware": true,
    "socketio": true,
    "database": false,
    "views": false,
    "assets": false
  },
  "routes": [
    { "method": "GET", "path": "/api/test", "description": "Test endpoint" }
  ],
  "middleware": [
    { "name": "logger", "global": true, "description": "Log requests" }
  ],
  "socketEvents": [
    { "name": "message", "description": "Handle messages" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "path": "/path/to/plugins/my-plugin",
    "name": "my-plugin"
  },
  "message": "Plugin \"my-plugin\" generated successfully"
}
```

### List Plugins

**GET** `/lowcode/api/plugins`

Get all installed plugins.

**Response:**
```json
{
  "success": true,
  "data": {
    "plugins": [
      {
        "name": "my-plugin",
        "version": "1.0.0",
        "description": "Plugin description",
        "author": "Author Name",
        "license": "MIT",
        "keywords": [],
        "path": "/path/to/plugins/my-plugin",
        "compatibility": "^1.0.0",
        "enabled": false
      }
    ],
    "total": 1
  }
}
```

### Get Plugin Details

**GET** `/lowcode/api/plugins/:name`

Get detailed information about a specific plugin.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "my-plugin",
    "version": "1.0.0",
    "description": "Plugin description",
    "author": "Author Name",
    "license": "MIT",
    "keywords": [],
    "dependencies": {},
    "exprsn": {
      "plugin": true,
      "version": "1.0.0",
      "compatibility": "^1.0.0"
    },
    "readme": "# Plugin README content...",
    "structure": [
      { "type": "file", "name": "index.js", "path": "index.js", "size": 1234 },
      { "type": "file", "name": "routes.js", "path": "routes.js", "size": 567 }
    ],
    "path": "/path/to/plugins/my-plugin"
  }
}
```

### Delete Plugin

**DELETE** `/lowcode/api/plugins/:name`

Delete a plugin.

**Response:**
```json
{
  "success": true,
  "message": "Plugin \"my-plugin\" deleted successfully"
}
```

## Socket.IO Events

### Plugin Generation Events

```javascript
// Plugin generated successfully
socket.on('plugin:generated', (data) => {
  console.log('Plugin generated:', data);
  // { name: 'my-plugin', path: '/path/to/plugins/my-plugin', timestamp: 1234567890 }
});

// Plugin deleted
socket.on('plugin:deleted', (data) => {
  console.log('Plugin deleted:', data);
  // { name: 'my-plugin', timestamp: 1234567890 }
});
```

### Hot Reload Events

```javascript
// Plugin code reloaded (from hot reload system)
socket.on('plugin:reloaded', (data) => {
  console.log('Plugin reloaded:', data);
  // { plugin: 'my-plugin', timestamp: 1234567890 }
});

// Plugin unloaded
socket.on('plugin:unloaded', (data) => {
  console.log('Plugin unloaded:', data);
  // { plugin: 'my-plugin', timestamp: 1234567890 }
});

// Plugin reload error
socket.on('plugin:reload:error', (data) => {
  console.error('Plugin reload failed:', data);
  // { filePath: 'plugins/my-plugin/index.js', error: 'Error message' }
});
```

## Usage

### Creating a Plugin

1. Navigate to `/lowcode/plugins/create`
2. Fill in basic information (name, description, author, version, license)
3. Select features to include (routes, middleware, Socket.IO, etc.)
4. Configure routes (if enabled)
5. Configure middleware (if enabled)
6. Configure Socket.IO events (if enabled)
7. Review configuration
8. Click "Generate Plugin"

### Plugin Naming Rules

- Must contain only lowercase letters, numbers, hyphens, and underscores
- Examples:
  - ✅ `my-awesome-plugin`
  - ✅ `data_processor`
  - ✅ `analytics-dashboard-v2`
  - ❌ `MyPlugin` (uppercase)
  - ❌ `plugin with spaces`
  - ❌ `plugin@special`

### Loading a Plugin

Plugins are automatically detected by the hot reload system in development mode. To load a plugin:

1. Generate or copy plugin to `src/exprsn-svr/plugins/`
2. Plugin will be auto-detected by file watcher
3. Plugin main class will be instantiated
4. `initialize(app, io)` method called with Express app and Socket.IO instance

### Development Workflow

1. **Create Plugin**: Use wizard to scaffold initial structure
2. **Edit Code**: Modify generated files to implement functionality
3. **Auto-Reload**: Hot reload system detects changes and reloads plugin
4. **Test**: Test plugin functionality in browser
5. **Iterate**: Make changes and see results immediately

## Integration with Hot Reload System

The plugin creation system is fully integrated with the hot reload system:

- **Automatic Detection**: New plugin files are detected immediately
- **Dynamic Loading**: Plugins are loaded without server restart
- **Live Updates**: Changes to plugin code trigger automatic reload
- **Client Notifications**: Socket.IO events notify connected clients of changes

### Watched Directories

```
src/exprsn-svr/plugins/**/*.js
```

### Reload Workflow

```
1. Edit plugin file (e.g., plugins/my-plugin/routes.js)
2. File watcher detects change
3. Hot reload system clears require cache
4. Plugin module reloaded
5. Socket.IO event emitted: 'plugin:reloaded'
6. Client receives notification
7. Toast message displayed: "Plugin reloaded: my-plugin"
```

## File Structure

```
src/exprsn-svr/
├── lowcode/
│   ├── views/
│   │   └── plugin-creator.ejs        # Wizard UI
│   ├── routes/
│   │   └── plugins.js                 # API routes
│   └── services/
│       └── PluginScaffolder.js        # Code generation service
├── plugins/                            # Generated plugins directory
│   ├── .gitkeep
│   └── my-plugin/                      # Example plugin
│       ├── index.js
│       ├── package.json
│       ├── README.md
│       ├── routes.js
│       ├── middleware.js
│       ├── socketHandlers.js
│       ├── settings.js
│       ├── models/
│       ├── views/
│       └── public/
└── utils/
    └── hotReload.js                    # Hot reload manager
```

## Best Practices

### Plugin Development

1. **Follow Naming Conventions**: Use kebab-case for plugin names
2. **Version Semantically**: Follow semver (MAJOR.MINOR.PATCH)
3. **Document Thoroughly**: Update README.md with usage instructions
4. **Handle Errors**: Wrap async operations in try-catch blocks
5. **Log Appropriately**: Use console.log with plugin name prefix
6. **Clean Up Resources**: Implement shutdown() method for cleanup
7. **Test Thoroughly**: Test all routes, middleware, and Socket.IO handlers

### Route Handlers

```javascript
router.get('/api/resource', async (req, res) => {
  try {
    // Validate input
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'ID is required'
      });
    }

    // Business logic here
    const result = await fetchResource(id);

    // Send response
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[my-plugin] Route error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});
```

### Middleware

```javascript
function myMiddleware(req, res, next) {
  try {
    console.log('[my-plugin] Processing:', req.path);

    // Middleware logic here

    next(); // Continue to next middleware/handler
  } catch (error) {
    console.error('[my-plugin] Middleware error:', error);
    next(error); // Pass error to error handler
  }
}
```

### Socket.IO Handlers

```javascript
function handleEvent(socket, data) {
  try {
    console.log('[my-plugin] Event received:', data);

    // Validate data
    if (!data || !data.payload) {
      socket.emit('error', { message: 'Invalid data' });
      return;
    }

    // Process event
    const result = processData(data.payload);

    // Send response
    socket.emit('event:response', {
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[my-plugin] Socket handler error:', error);
    socket.emit('error', { message: error.message });
  }
}
```

## Security Considerations

1. **Input Validation**: Always validate user input
2. **Error Handling**: Never expose sensitive error details to clients
3. **Authentication**: Implement proper authentication in routes
4. **Authorization**: Check user permissions before operations
5. **SQL Injection**: Use parameterized queries (Sequelize handles this)
6. **XSS Prevention**: Sanitize HTML output in views
7. **Rate Limiting**: Apply rate limits to public endpoints
8. **CSRF Protection**: Use CSRF tokens for state-changing operations

## Troubleshooting

### Plugin Not Loading

- Check plugin name follows naming rules
- Verify `package.json` has `exprsn.plugin: true`
- Check console for error messages
- Verify hot reload system is running (development mode)

### Hot Reload Not Working

- Ensure `NODE_ENV=development`
- Check file watcher is active
- Verify file is in watched directory (`plugins/**/*.js`)
- Check console for hot reload notifications

### Routes Not Accessible

- Verify routes are registered in plugin `initialize()` method
- Check route mount path matches expected URL
- Ensure Express app is passed to `initialize()`
- Test route handler for errors

### Socket.IO Events Not Firing

- Verify Socket.IO instance is passed to `initialize()`
- Check event names match client-side code
- Ensure handlers are registered in `socketHandlers.register(io)`
- Test with Socket.IO client debugging enabled

## Future Enhancements

1. **Plugin Marketplace**: Browse and install community plugins
2. **Plugin Dependencies**: Support for inter-plugin dependencies
3. **Plugin CLI**: Command-line tool for plugin management
4. **Plugin Testing**: Built-in testing framework for plugins
5. **Plugin Versioning**: Upgrade/downgrade plugin versions
6. **Plugin Conflicts**: Detect and resolve conflicting plugins
7. **Plugin Analytics**: Usage tracking and performance metrics
8. **Plugin Templates**: Pre-built templates for common use cases

## Summary

The Plugin Creation System provides a complete, production-ready solution for extending the Exprsn Low-Code Platform:

✅ Visual wizard interface with 6-step configuration process
✅ Intelligent code scaffolding with template-based generation
✅ Full support for routes, middleware, Socket.IO, database, views, and assets
✅ Seamless integration with hot reload system
✅ RESTful API for plugin management (list, create, delete)
✅ Real-time Socket.IO events for status updates
✅ Comprehensive error handling and validation
✅ Theme-consistent UI with light/dark mode support

Developers can now create fully-functional plugins in minutes instead of hours, with all the boilerplate code generated automatically based on their requirements.
