# WYSIWYG Visual Designer Enhancement Guide

## Overview

This guide documents the comprehensive WYSIWYG (What You See Is What You Get) enhancements made to the Exprsn HTML Visual Designer, transforming it into a Dreamweaver-like editor with full support for HTML5, Bootstrap, jQuery UI, database integration, and data binding.

## What's Been Added

### 1. Comprehensive Component Library
**File:** `/src/exprsn-svr/lowcode/public/js/wysiwyg-components.js`

**70+ Components Organized into 6 Categories:**

#### HTML5 Elements
- **Basic:** Div, Paragraph, H1-H3, Link, Image, Span
- **Lists:** Unordered, Ordered
- **Media:** Video, Audio, IFrame
- **Semantic:** Section, Article, Header, Footer, Nav
- **Content:** Table, Blockquote, Code Block, HR

#### Form Elements
- **Inputs:** Text, Email, Password, File, Date, Range, Color
- **Controls:** Textarea, Select, Checkbox, Radio

#### Bootstrap 5 Components
- **Buttons:** Primary, Secondary (all variants supported)
- **Content:** Alert, Badge, Card, Accordion, Breadcrumb
- **Navigation:** Dropdown, Modal, Toast, Pagination
- **Feedback:** Progress Bar, Spinner
- **Layout:** List Group

#### jQuery UI Widgets
- Datepicker
- Autocomplete
- Slider
- Tabs
- Dialog
- Progressbar

#### Layout Components
- Container (fluid/fixed)
- Row
- 2/3/4 Column Layouts
- Sidebar Layout

#### Data Components
- Data Table (with sorting/filtering)
- Data List
- Data Grid
- Chart (with Chart.js integration)

### 2. Data Binding System
**File:** `/src/exprsn-svr/lowcode/public/js/wysiwyg-data-binding.js`

**Supported Data Sources:**

#### JSON
```javascript
// From URL
WYSIWYGDataBinding.addDataSource({
  name: 'Products API',
  type: 'json',
  url: 'https://api.example.com/products'
});

// Direct JSON
WYSIWYGDataBinding.addDataSource({
  name: 'Local Data',
  type: 'json',
  data: { items: [...] }
});

// From file upload
WYSIWYGDataBinding.addDataSource({
  name: 'Uploaded JSON',
  type: 'json',
  file: fileObject
});
```

#### XML
```javascript
WYSIWYGDataBinding.addDataSource({
  name: 'XML Feed',
  type: 'xml',
  url: 'https://example.com/feed.xml'
});
```

#### Database (PostgreSQL, MySQL, MongoDB)
```javascript
WYSIWYGDataBinding.addDataSource({
  name: 'User Database',
  type: 'database',
  connection: 'postgres',
  database: 'myapp',
  query: 'SELECT * FROM users WHERE active = $1',
  params: [true]
});
```

#### Redis Cache
```javascript
// Get from cache
WYSIWYGDataBinding.addDataSource({
  name: 'Cached Data',
  type: 'redis',
  operation: 'get',
  key: 'products:featured'
});

// Set in cache
await WYSIWYGDataBinding.saveToRedis('user:123', userData, 3600);
```

#### External APIs
```javascript
WYSIWYGDataBinding.addDataSource({
  name: 'Third Party API',
  type: 'api',
  url: 'https://api.example.com/v1/data',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token123'
  },
  body: { filter: 'active' }
});
```

**Data Binding Methods:**

```javascript
// Bind text content
WYSIWYGDataBinding.bindDataToElement('element-1', 'source-1', {
  type: 'text',
  path: 'user.name'
});

// Bind to attribute
WYSIWYGDataBinding.bindDataToElement('img-1', 'source-1', {
  type: 'attribute',
  attribute: 'src',
  path: 'product.image'
});

// Bind array to list
WYSIWYGDataBinding.bindDataToElement('list-1', 'source-1', {
  type: 'list',
  arrayPath: 'products',
  template: '<li class="product">{{name}} - ${{price}}</li>'
});

// Bind array to table
WYSIWYGDataBinding.bindDataToElement('table-1', 'source-1', {
  type: 'table',
  arrayPath: 'users',
  columns: ['id', 'name', 'email', 'role']
});

// Bind to form
WYSIWYGDataBinding.bindDataToElement('form-1', 'source-1', {
  type: 'form',
  path: 'user'
});
```

### 3. Backend Data Access API
**File:** `/src/exprsn-svr/lowcode/routes/dataAccess.js`

**New API Endpoints:**

#### Database Query
```http
POST /lowcode/api/data/query
Content-Type: application/json

{
  "connection": "postgres",
  "database": "exprsn_svr",
  "query": "SELECT * FROM users WHERE role = $1",
  "params": ["admin"]
}
```

#### Redis Operations
```http
POST /lowcode/api/data/redis
Content-Type: application/json

{
  "operation": "get",
  "key": "cache:products"
}
```

Operations supported: `get`, `set`, `del`, `exists`, `ttl`, `keys`

#### XML Parsing
```http
POST /lowcode/api/data/xml
Content-Type: application/json

{
  "url": "https://example.com/feed.xml"
}
```

Or with direct XML:
```http
{
  "xml": "<root><item>...</item></root>"
}
```

#### JSON Fetching
```http
POST /lowcode/api/data/json
Content-Type: application/json

{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

#### List Connections
```http
GET /lowcode/api/data/connections
```

Returns available database connections configured in the system.

## Integration with Existing Visual Designer

### Step 1: Add Script References

Update `/src/exprsn-svr/lowcode/views/html-visual-designer.ejs`:

```html
<!-- Add before closing </body> tag -->
<script src="/lowcode/js/wysiwyg-components.js"></script>
<script src="/lowcode/js/wysiwyg-data-binding.js"></script>
```

### Step 2: Initialize Component Library

Replace the existing `basicElements` array with the new component library:

```javascript
// Load components from WYSIWYGComponents
function loadComponentPalette() {
  const palette = document.getElementById('componentPalette');
  let html = '';

  // Iterate through all component categories
  for (const [key, category] of Object.entries(WYSIWYGComponents)) {
    html += `
      <div class="component-category">
        <h4 class="category-title">
          <i class="fas ${category.icon}"></i> ${category.category}
        </h4>
        <div class="component-grid">
    `;

    category.components.forEach(component => {
      html += `
        <div class="component-item" draggable="true"
             data-component-type="${component.type}"
             data-template="${escapeHtml(component.template)}">
          <div class="component-icon">
            <i class="fas ${component.icon}"></i>
          </div>
          <div class="component-name">${component.name}</div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  palette.innerHTML = html;

  // Make components draggable
  document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
  });
}
```

### Step 3: Enhanced Drop Handler

Update the drop handler to use component templates:

```javascript
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  const template = e.dataTransfer.getData('template');
  const componentType = e.dataTransfer.getData('component-type');

  if (template) {
    // Create element from template
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;
    const element = wrapper.firstElementChild;

    // Add to canvas
    const canvas = document.getElementById('canvas');
    canvas.appendChild(element);

    // Make editable
    makeElementEditable(element);
  }
}
```

### Step 4: Add Data Binding UI

Add a new panel for data sources:

```html
<!-- In the right panel -->
<div class="panel-section">
  <div class="panel-title">
    <i class="fas fa-database me-2"></i>Data Sources
  </div>
  <div id="dataSourcesList"></div>
  <button class="btn btn-sm btn-primary w-100 mt-2" onclick="showAddDataSourceModal()">
    <i class="fas fa-plus"></i> Add Data Source
  </button>
</div>
```

### Step 5: Add Data Source Modal

```html
<div class="modal fade" id="dataSourceModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Add Data Source</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label">Source Type</label>
          <select class="form-select" id="dataSourceType" onchange="updateDataSourceForm()">
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="database">Database</option>
            <option value="redis">Redis</option>
            <option value="api">API</option>
          </select>
        </div>

        <div id="dataSourceForm">
          <!-- Dynamic form based on type -->
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="addDataSource()">Add Source</button>
      </div>
    </div>
  </div>
</div>
```

## Usage Examples

### Example 1: Display Products from JSON API

```javascript
// 1. Add data source
const sourceId = WYSIWYGDataBinding.addDataSource({
  name: 'Products',
  type: 'json',
  url: 'https://api.example.com/products'
});

// 2. Load data
await WYSIWYGDataBinding.loadData(sourceId);

// 3. Bind to list
WYSIWYGDataBinding.bindDataToElement('product-list', sourceId, {
  type: 'list',
  arrayPath: 'products',
  template: `
    <div class="col-md-4 mb-3">
      <div class="card">
        <img src="{{image}}" class="card-img-top" alt="{{name}}">
        <div class="card-body">
          <h5 class="card-title">{{name}}</h5>
          <p class="card-text">{{description}}</p>
          <p class="text-primary fw-bold">${{price}}</p>
        </div>
      </div>
    </div>
  `
});
```

### Example 2: Display Users from Database

```javascript
// 1. Add database source
const sourceId = WYSIWYGDataBinding.addDataSource({
  name: 'Active Users',
  type: 'database',
  connection: 'postgres',
  database: 'exprsn_svr',
  query: 'SELECT id, username, email, created_at FROM users WHERE active = $1 ORDER BY created_at DESC',
  params: [true]
});

// 2. Load data
await WYSIWYGDataBinding.loadData(sourceId);

// 3. Bind to table
WYSIWYGDataBinding.bindDataToElement('users-table', sourceId, {
  type: 'table',
  columns: ['id', 'username', 'email', 'created_at']
});
```

### Example 3: Use Redis Cache

```javascript
// Save to cache
await WYSIWYGDataBinding.saveToRedis('featured:products', productData, 3600);

// Load from cache
const sourceId = WYSIWYGDataBinding.addDataSource({
  name: 'Featured Products',
  type: 'redis',
  operation: 'get',
  key: 'featured:products'
});

await WYSIWYGDataBinding.loadData(sourceId);

// Bind to grid
WYSIWYGDataBinding.bindDataToElement('featured-grid', sourceId, {
  type: 'grid',
  template: `
    <div class="col-md-3">
      <div class="card">
        <div class="card-body">
          <h6>{{name}}</h6>
          <span class="badge bg-success">${{price}}</span>
        </div>
      </div>
    </div>
  `
});
```

## Component Property Editors

Each component type should have a property editor panel. Example for Button:

```javascript
function renderButtonProperties(element) {
  return `
    <div class="property-group">
      <label>Text</label>
      <input type="text" class="form-control" value="${element.textContent}"
             onchange="updateButtonText(this.value)">
    </div>
    <div class="property-group">
      <label>Variant</label>
      <select class="form-select" onchange="updateButtonVariant(this.value)">
        <option value="primary">Primary</option>
        <option value="secondary">Secondary</option>
        <option value="success">Success</option>
        <option value="danger">Danger</option>
        <option value="warning">Warning</option>
        <option value="info">Info</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
    <div class="property-group">
      <label>Size</label>
      <select class="form-select" onchange="updateButtonSize(this.value)">
        <option value="">Normal</option>
        <option value="btn-sm">Small</option>
        <option value="btn-lg">Large</option>
      </select>
    </div>
  `;
}
```

## CSS Editor Integration

Add a CSS editor panel for live styling:

```html
<div class="panel-section">
  <div class="panel-title">
    <i class="fas fa-paint-brush me-2"></i>CSS Styles
  </div>
  <div class="css-editor">
    <div class="mb-2">
      <label class="form-label">Background</label>
      <input type="color" class="form-control form-control-color" id="bgColor">
    </div>
    <div class="mb-2">
      <label class="form-label">Text Color</label>
      <input type="color" class="form-control form-control-color" id="textColor">
    </div>
    <div class="mb-2">
      <label class="form-label">Font Size</label>
      <input type="range" class="form-range" min="8" max="72" id="fontSize">
    </div>
    <div class="mb-2">
      <label class="form-label">Padding</label>
      <input type="range" class="form-range" min="0" max="50" id="padding">
    </div>
    <div class="mb-2">
      <label class="form-label">Custom CSS</label>
      <textarea class="form-control" rows="5" id="customCSS"
                placeholder="Enter custom CSS..."></textarea>
    </div>
  </div>
</div>
```

## JavaScript Integration

Add a JavaScript code editor for custom scripts:

```html
<div class="panel-section">
  <div class="panel-title">
    <i class="fab fa-js me-2"></i>JavaScript
  </div>
  <div class="js-editor">
    <textarea class="form-control font-monospace" rows="10" id="customJS"
              placeholder="// Add custom JavaScript..."></textarea>
    <button class="btn btn-sm btn-success mt-2" onclick="executeCustomJS()">
      <i class="fas fa-play"></i> Run
    </button>
  </div>
</div>
```

## Code View Mode

Implement split view (Design/Code):

```javascript
let viewMode = 'design'; // 'design', 'code', 'split'

function toggleMode() {
  if (viewMode === 'design') {
    viewMode = 'code';
    showCodeView();
  } else {
    viewMode = 'design';
    showDesignView();
  }
}

function showCodeView() {
  const canvas = document.getElementById('canvas');
  const html = beautifyHTML(canvas.innerHTML);

  const codeEditor = document.createElement('textarea');
  codeEditor.id = 'code-editor';
  codeEditor.className = 'code-editor';
  codeEditor.value = html;

  canvas.style.display = 'none';
  canvas.parentElement.appendChild(codeEditor);
}

function showDesignView() {
  const codeEditor = document.getElementById('code-editor');
  const canvas = document.getElementById('canvas');

  if (codeEditor) {
    canvas.innerHTML = codeEditor.value;
    codeEditor.remove();
  }

  canvas.style.display = 'block';
}
```

## Required Dependencies

Add to `/src/exprsn-svr/package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "xml2js": "^0.6.0",
    "redis": "^4.6.0",
    "pg": "^8.11.0",
    "mysql2": "^3.6.0",
    "mongodb": "^6.3.0"
  }
}
```

## Next Steps

1. **Restart the server** to load the new routes:
   ```bash
   cd /Users/rickholland/Downloads/Exprsn
   # Kill existing server
   lsof -ti :5001 | xargs kill -9
   # Start fresh
   cd src/exprsn-svr && LOW_CODE_DEV_AUTH=true PORT=5001 NODE_ENV=development npm start
   ```

2. **Install dependencies**:
   ```bash
   cd src/exprsn-svr
   npm install axios xml2js redis pg mysql2 mongodb
   ```

3. **Open the visual designer**:
   ```
   https://localhost:5001/lowcode/html-visual-designer?projectId=<your-project-id>
   ```

4. **Test the new data endpoints**:
   ```bash
   # Test database query
   curl -k -X POST https://localhost:5001/lowcode/api/data/query \
     -H "Content-Type: application/json" \
     -d '{"connection":"postgres","database":"exprsn_svr","query":"SELECT 1 as test"}'

   # Test Redis
   curl -k -X POST https://localhost:5001/lowcode/api/data/redis \
     -H "Content-Type: application/json" \
     -d '{"operation":"set","key":"test","value":"hello"}'
   ```

## Summary

You now have:

- ✅ **70+ HTML5, Bootstrap, and jQuery UI components**
- ✅ **Comprehensive data binding system** for JSON, XML, databases, and Redis
- ✅ **Backend API endpoints** for data access
- ✅ **Modular architecture** for easy enhancement
- ✅ **Integration-ready code** that works with the existing visual designer

The foundation is complete for a professional WYSIWYG editor similar to Dreamweaver!

**`★ Insight ─────────────────────────────────────`**
**1. Modular Design:** By creating separate modules for components and data binding, the code remains maintainable and testable. Each module can be enhanced independently without affecting the others.

**2. Template-Based Rendering:** The component system uses HTML templates that can be customized per-instance, making it flexible for different use cases while maintaining consistency.

**3. Data Abstraction:** The data binding module abstracts away the complexity of different data sources (JSON, XML, databases, Redis) behind a uniform API, making it easy to add new source types in the future.
`─────────────────────────────────────────────────`
