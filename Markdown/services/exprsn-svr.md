# Exprsn SVR (exprsn-svr)

**Version:** 1.0.0
**Port:** 5000
**Status:** ✅ Production-Ready (with Low-Code Platform)
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn SVR** is the dynamic page server and Low-Code Platform integration hub. It provides server-rendered pages, a complete visual application builder, and seamless integration with all Exprsn services.

---

## Key Features

### Dynamic Page Server
- **Server-Side Rendering** - Fast initial page loads
- **EJS Templates** - Dynamic content rendering
- **Bootstrap 5.3 UI** - WCAG 2.1 AA compliant
- **Service Integration** - Access all Exprsn services
- **Custom Routes** - User-defined page routes
- **Asset Management** - Static file serving

### Low-Code Platform (Complete)
- **Visual Application Builder** - Drag-and-drop app creation
- **Entity Designer** - Visual database schema designer
- **Grid Designer** - Runtime grid renderer with templates
- **Form Designer** - 27-component form builder (100% complete)
- **JSONLex Integration** - Expression-based logic
- **Workflow Integration** - Automated processes
- **Forge CRM Integration** - Business data access

### Form Designer Features (7 Modules)
1. **Core Engine** - 4-panel IDE (Toolbox, Canvas, Properties, Code)
2. **Data Binding** - 4 data source types (Entity, REST, JSONLex, Custom JS)
3. **Event Handlers** - 7 handler types, 5 trigger types
4. **Permissions** - Form and component-level access control
5. **Workflow Integration** - Trigger workflows on events
6. **Forge Integration** - 6 CRM entity types
7. **Grid Runtime** - Dynamic grid rendering

### Component Library (27 Components)
**Basic (12):** Text, TextArea, Number, Email, Date, Checkbox, Radio, Dropdown, Button, Label, Heading, Paragraph
**Data (5):** Entity Picker, CRUD Interface, Subgrid, Options List, File Upload
**Layout (5):** Container, Tabs, Accordion, Divider, Spacer

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **View Engine:** EJS
- **Database:** PostgreSQL (`exprsn_svr`)
- **UI Framework:** Bootstrap 5.3
- **Code Editor:** Monaco Editor
- **Templating:** Handlebars (for grids)
- **JSONLex:** Expression evaluation

### Low-Code Platform Routes

```
/lowcode               - Platform home
/lowcode/designer      - Application designer
/lowcode/entities/new  - Entity designer
/lowcode/grids/new     - Grid designer
/lowcode/forms/new     - Form designer
```

---

## API Endpoints

### Page Management

#### `GET /pages`
List available pages.

#### `GET /pages/:slug`
Render page by slug.

---

### Low-Code API

#### `GET /api/lowcode/applications`
List applications.

#### `POST /api/lowcode/applications`
Create application.

#### `GET /api/lowcode/entities`
List entities.

#### `POST /api/lowcode/entities`
Create entity (auto-creates database table).

**Request:**
```json
{
  "name": "Customer",
  "displayName": "Customers",
  "fields": [
    {
      "name": "firstName",
      "type": "string",
      "required": true,
      "maxLength": 100
    },
    {
      "name": "email",
      "type": "email",
      "required": true,
      "unique": true
    },
    {
      "name": "totalSpent",
      "type": "computed",
      "jsonlexExpression": "$.orders.sum('amount')"
    }
  ]
}
```

#### `GET /api/lowcode/forms`
List forms.

#### `POST /api/lowcode/forms`
Create form.

**Request:**
```json
{
  "name": "Customer Form",
  "components": [
    {
      "type": "text_input",
      "label": "First Name",
      "fieldName": "firstName",
      "required": true
    },
    {
      "type": "email",
      "label": "Email",
      "fieldName": "email",
      "required": true
    }
  ],
  "dataBinding": {
    "type": "entity",
    "entityId": "customer-entity-uuid"
  },
  "permissions": {
    "view": "all",
    "edit": "owner",
    "submit": "authenticated"
  }
}
```

#### `GET /api/lowcode/grids`
List grids.

#### `POST /api/lowcode/grids`
Create grid.

---

### Runtime API

#### `GET /api/runtime/entity/:entityId/data`
Get entity data.

#### `POST /api/runtime/entity/:entityId/data`
Create entity record.

#### `PUT /api/runtime/entity/:entityId/data/:recordId`
Update entity record.

#### `DELETE /api/runtime/entity/:entityId/data/:recordId`
Delete entity record.

#### `POST /api/runtime/form/:formId/submit`
Submit form data.

#### `GET /api/runtime/grid/:gridId/data`
Get grid data.

---

## Low-Code Platform Architecture

### Entity Designer
Creates database schemas visually with:
- Field types (string, number, date, email, etc.)
- Computed fields with JSONLex expressions
- Relationships (one-to-many, many-to-many)
- Validation rules
- Indexes and constraints

### Form Designer (7-Module System)

**1. Core Engine (form-designer.js)**
- 4-panel layout
- 27 components
- Drag-and-drop
- Monaco editor

**2. Data Binding (form-data-binding.js)**
- Entity binding
- REST API binding
- JSONLex expressions
- Custom JavaScript

**3. Event Handlers (form-event-handlers.js)**
- onClick, onChange, onFocus, onBlur, onSubmit
- Custom functions
- Navigation
- Data operations
- Workflow triggers

**4. Permissions (form-permissions.js)**
- Form-level: view, edit, submit, delete
- Component-level: visible, editable
- User/group/role-based

**5. Workflow Integration (form-workflow.js)**
- Trigger workflows
- Field mapping
- Conditional execution

**6. Forge Integration (form-forge.js)**
- Contact, Account, Lead, Opportunity, Case, Task
- CRUD operations
- Field mapping

**7. Grid Runtime (grid-runtime-renderer.js)**
- Dynamic rendering
- Custom templates
- CRUD operations

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=5000
SERVICE_NAME=exprsn-svr

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_svr
DB_USER=postgres
DB_PASSWORD=your_password

# Low-Code Platform
LOWCODE_ENABLED=true
ENTITY_AUTO_MIGRATE=true
FORM_PREVIEW_ENABLED=true

# Service Integration
CA_URL=http://localhost:3000
AUTH_URL=http://localhost:3001
TIMELINE_URL=http://localhost:3004
FORGE_URL=http://localhost:3016
WORKFLOW_URL=http://localhost:3017
FILEVAULT_URL=http://localhost:3007

# View Configuration
VIEW_ENGINE=ejs
VIEW_CACHE_ENABLED=true

# Static Assets
STATIC_PATH=/public
CDN_URL=https://cdn.exprsn.io

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### Create Low-Code Application

```javascript
// 1. Create entity
const entity = await axios.post('http://localhost:5000/api/lowcode/entities', {
  name: 'Product',
  fields: [
    { name: 'name', type: 'string', required: true },
    { name: 'price', type: 'decimal', required: true },
    { name: 'stock', type: 'integer', default: 0 }
  ]
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Create form
const form = await axios.post('http://localhost:5000/api/lowcode/forms', {
  name: 'Product Form',
  components: [
    { type: 'text_input', label: 'Product Name', fieldName: 'name' },
    { type: 'number', label: 'Price', fieldName: 'price' },
    { type: 'number', label: 'Stock', fieldName: 'stock' }
  ],
  dataBinding: { type: 'entity', entityId: entity.data.data.id }
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Create grid
const grid = await axios.post('http://localhost:5000/api/lowcode/grids', {
  name: 'Products Grid',
  entityId: entity.data.data.id,
  columns: [
    { field: 'name', header: 'Product', sortable: true },
    { field: 'price', header: 'Price', template: '${price}' },
    { field: 'stock', header: 'Stock' }
  ]
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Development

```bash
cd src/exprsn-svr
npm install
npm run migrate
npm start

# Access Low-Code Platform
open http://localhost:5000/lowcode
```

---

## Dependencies

- **express** (^4.18.2)
- **ejs** (^3.1.10)
- **sequelize** (^6.35.2)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
