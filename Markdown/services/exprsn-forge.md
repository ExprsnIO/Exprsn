# Exprsn Forge (exprsn-forge)

**Version:** 1.0.0
**Port:** 3016
**Status:** 🔄 Partial (CRM: 100%, Groupware: 40%, ERP: 15%)
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Forge** is a comprehensive business management platform that integrates **Groupware, CRM, and ERP** functionalities into a unified system. It provides enterprise-grade tools for customer relationship management, collaboration, and resource planning.

---

## Module Status

### ✅ CRM Module (100% Complete)
- **92 API Endpoints**
- **8,600+ Lines of Code**
- Production-ready customer relationship management

### 🔄 Groupware Module (40% Complete)
- Email integration
- Calendar and scheduling (partial)
- Document management (partial)

### 🚧 ERP Module (15% Complete)
- Inventory management (basic)
- Financial tracking (planned)
- Supply chain (planned)

---

## CRM Features (Complete)

### Contact Management
- **Contact Records** - Comprehensive contact profiles
- **Account Hierarchy** - Corporate account structures
- **Custom Fields** - Extensible contact data
- **Contact Segmentation** - Tags and categories
- **Duplicate Detection** - Automatic merge suggestions
- **Contact Timeline** - Activity history tracking
- **Import/Export** - CSV, vCard formats
- **Bulk Operations** - Mass updates and deletions

### Lead Management
- **Lead Capture** - Web forms, API integration
- **Lead Scoring** - Automated qualification scoring
- **Lead Assignment** - Rule-based routing
- **Lead Conversion** - Convert to opportunity workflow
- **Lead Nurturing** - Automated follow-up campaigns
- **Source Tracking** - Marketing attribution
- **Lead Status Workflow** - Customizable stages

### Opportunity Management
- **Deal Pipeline** - Visual pipeline management
- **Sales Stages** - Customizable stage definitions
- **Revenue Forecasting** - Weighted pipeline analysis
- **Win/Loss Analysis** - Deal outcome tracking
- **Quote Generation** - Integrated quoting
- **Product Catalog** - Product/service library
- **Competitor Tracking** - Competitive intelligence

### Case Management
- **Support Tickets** - Customer service cases
- **SLA Management** - Service level tracking
- **Case Assignment** - Automatic routing rules
- **Escalation Rules** - Priority-based escalation
- **Knowledge Base** - Article repository
- **Case Templates** - Standardized responses
- **Customer Portal** - Self-service access

### Task & Activity Management
- **Task Assignment** - User task management
- **Activity Logging** - Call, email, meeting logs
- **Follow-Up Reminders** - Automated notifications
- **Team Collaboration** - Shared activities
- **Calendar Integration** - Schedule management
- **Activity Reports** - Productivity analytics

### Reporting & Analytics
- **Sales Dashboard** - Real-time metrics
- **Pipeline Reports** - Deal flow analysis
- **Performance Reports** - User/team metrics
- **Custom Reports** - Report builder
- **Scheduled Reports** - Automated delivery
- **Export Formats** - PDF, Excel, CSV
- **Data Visualization** - Charts and graphs

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (`exprsn_forge`)
- **Cache/Queues:** Redis with Bull
- **Real-Time:** Socket.IO
- **Frontend:** React (separate frontend package)
- **Charts:** Chart.js
- **PDF Generation:** PDFKit
- **Excel:** ExcelJS

### Database Schema

**CRM Tables (Complete):**
- `contacts` - Contact records
- `accounts` - Company accounts
- `leads` - Sales leads
- `opportunities` - Sales opportunities
- `cases` - Support cases
- `tasks` - Activity tasks
- `notes` - Record notes
- `attachments` - File attachments
- `products` - Product catalog
- `quotes` - Sales quotes
- `quote_items` - Quote line items
- `custom_fields` - Field definitions
- `custom_field_values` - Field data
- `tags` - Tag definitions
- `record_tags` - Tag assignments
- `activities` - Activity log
- `pipelines` - Sales pipelines
- `pipeline_stages` - Pipeline stages

**Groupware Tables (Partial):**
- `emails` - Email messages
- `calendars` - Calendar definitions
- `events` - Calendar events
- `documents` - Document storage

**ERP Tables (Minimal):**
- `inventory_items` - Inventory records
- `warehouses` - Warehouse locations

---

## API Endpoints (CRM)

### Contact Management

#### `GET /api/crm/contacts`
List contacts.

**Query Parameters:**
- `page` - Page number
- `limit` - Results per page
- `search` - Search query
- `tags` - Filter by tags
- `segmentId` - Filter by segment

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "company": "Acme Corp",
        "title": "CEO",
        "tags": ["vip", "enterprise"],
        "customFields": {
          "industry": "Technology",
          "employeeCount": 500
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    }
  }
}
```

#### `POST /api/crm/contacts`
Create contact.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "title": "CEO",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "USA"
  },
  "tags": ["vip"],
  "customFields": {
    "industry": "Technology"
  }
}
```

#### `GET /api/crm/contacts/:id`
Get contact details.

#### `PUT /api/crm/contacts/:id`
Update contact.

#### `DELETE /api/crm/contacts/:id`
Delete contact.

#### `GET /api/crm/contacts/:id/timeline`
Get contact activity timeline.

---

### Lead Management

#### `GET /api/crm/leads`
List leads.

#### `POST /api/crm/leads`
Create lead.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@company.com",
  "company": "Tech Startup Inc",
  "title": "CTO",
  "source": "Website",
  "status": "new",
  "score": 75,
  "notes": "Interested in enterprise plan"
}
```

#### `POST /api/crm/leads/:id/convert`
Convert lead to opportunity.

**Request:**
```json
{
  "createContact": true,
  "createAccount": true,
  "opportunityName": "Tech Startup - Enterprise Deal",
  "expectedRevenue": 50000
}
```

#### `PUT /api/crm/leads/:id/assign`
Assign lead to user.

**Request:**
```json
{
  "assigneeId": "user-uuid"
}
```

---

### Opportunity Management

#### `GET /api/crm/opportunities`
List opportunities.

#### `POST /api/crm/opportunities`
Create opportunity.

**Request:**
```json
{
  "name": "Acme Corp - Enterprise License",
  "accountId": "account-uuid",
  "contactId": "contact-uuid",
  "stage": "qualification",
  "expectedRevenue": 100000,
  "probability": 60,
  "expectedCloseDate": "2024-06-30",
  "description": "500 user licenses for 3 years"
}
```

#### `PUT /api/crm/opportunities/:id/stage`
Update opportunity stage.

**Request:**
```json
{
  "stage": "proposal",
  "notes": "Sent proposal on 2024-01-15"
}
```

#### `POST /api/crm/opportunities/:id/close`
Close opportunity (won/lost).

**Request:**
```json
{
  "status": "won",
  "actualRevenue": 95000,
  "notes": "Closed with 5% discount"
}
```

---

### Case Management

#### `GET /api/crm/cases`
List support cases.

#### `POST /api/crm/cases`
Create case.

**Request:**
```json
{
  "subject": "Login Issues",
  "description": "User unable to login after password reset",
  "contactId": "contact-uuid",
  "priority": "high",
  "category": "technical",
  "status": "new"
}
```

#### `PUT /api/crm/cases/:id/status`
Update case status.

#### `POST /api/crm/cases/:id/escalate`
Escalate case.

---

### Task Management

#### `GET /api/crm/tasks`
List tasks.

#### `POST /api/crm/tasks`
Create task.

**Request:**
```json
{
  "subject": "Follow up with John Doe",
  "description": "Discuss Q2 contract renewal",
  "dueDate": "2024-02-01T14:00:00Z",
  "priority": "high",
  "relatedTo": {
    "type": "contact",
    "id": "contact-uuid"
  },
  "assigneeId": "user-uuid"
}
```

#### `PUT /api/crm/tasks/:id/complete`
Mark task complete.

---

### Reporting

#### `GET /api/crm/reports/sales-pipeline`
Get sales pipeline report.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 1500000,
    "weightedValue": 750000,
    "byStage": [
      {
        "stage": "qualification",
        "count": 15,
        "value": 450000,
        "probability": 40
      },
      {
        "stage": "proposal",
        "count": 8,
        "value": 600000,
        "probability": 65
      }
    ]
  }
}
```

#### `GET /api/crm/reports/lead-conversion`
Lead conversion analytics.

#### `GET /api/crm/reports/sales-forecast`
Revenue forecast report.

#### `POST /api/crm/reports/custom`
Generate custom report.

---

### Data Import/Export

#### `POST /api/crm/import/contacts`
Import contacts from CSV.

**Request:**
```
Content-Type: multipart/form-data
file: contacts.csv
mapping: { "First Name": "firstName", "Last Name": "lastName" }
```

#### `GET /api/crm/export/contacts`
Export contacts to CSV.

**Query Parameters:**
- `format` - csv, xlsx, vcard
- `filters` - JSON filter criteria

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=3016
SERVICE_NAME=exprsn-forge

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_forge
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CRM Configuration
CRM_DEFAULT_PIPELINE=standard_sales
CRM_LEAD_SCORE_THRESHOLD=70
CRM_AUTO_ASSIGN_LEADS=true
CRM_DUPLICATE_CHECK_ENABLED=true

# Groupware (Partial)
EMAIL_ENABLED=false
CALENDAR_ENABLED=false

# ERP (Minimal)
INVENTORY_ENABLED=false

# Features
CUSTOM_FIELDS_ENABLED=true
BULK_OPERATIONS_ENABLED=true
ADVANCED_REPORTING_ENABLED=true

# Limits
MAX_CONTACTS_PER_ACCOUNT=1000
MAX_OPPORTUNITIES_PER_CONTACT=50
MAX_TASKS_PER_USER=500

# Service Integration
CA_URL=http://localhost:3000
AUTH_URL=http://localhost:3001
FILEVAULT_URL=http://localhost:3007
HERALD_URL=http://localhost:3014

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### Create Complete Sales Workflow

```javascript
const axios = require('axios');

async function completeSalesWorkflow(token) {
  // 1. Create lead
  const lead = await axios.post('http://localhost:3016/api/crm/leads', {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@techcorp.com',
    company: 'Tech Corp',
    source: 'Website',
    status: 'new'
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 2. Score and qualify lead
  await axios.put(
    `http://localhost:3016/api/crm/leads/${lead.data.data.id}`,
    { score: 85, status: 'qualified' },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  // 3. Convert lead to opportunity
  const conversion = await axios.post(
    `http://localhost:3016/api/crm/leads/${lead.data.data.id}/convert`,
    {
      createContact: true,
      createAccount: true,
      opportunityName: 'Tech Corp - Enterprise Deal',
      expectedRevenue: 75000
    },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  // 4. Create follow-up task
  await axios.post('http://localhost:3016/api/crm/tasks', {
    subject: 'Send proposal to Tech Corp',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    relatedTo: {
      type: 'opportunity',
      id: conversion.data.data.opportunityId
    }
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return conversion.data.data;
}
```

---

## Development Roadmap

### Groupware Module (60% Remaining)
- [ ] Complete email client
- [ ] Full calendar functionality
- [ ] Document collaboration
- [ ] Team wikis
- [ ] Video conferencing integration

### ERP Module (85% Remaining)
- [ ] Full inventory management
- [ ] Purchase orders
- [ ] Invoicing system
- [ ] Accounting integration
- [ ] Supply chain tracking
- [ ] Manufacturing module
- [ ] HR management

---

## Development

```bash
cd src/exprsn-forge
npm install
npm run migrate
npm run seed
npm run dev
```

---

## Dependencies

- **express** (^4.18.2)
- **sequelize** (^6.35.2)
- **bull** (^4.12.0)
- **socket.io** (^4.7.2)
- **exceljs** (^4.4.0)
- **pdfkit** (^0.14.0)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
