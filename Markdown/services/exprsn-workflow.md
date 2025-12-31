# Exprsn Workflow (exprsn-workflow)

**Version:** 1.0.0
**Port:** 3017
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Workflow** is a visual workflow automation engine that enables users to create, execute, and monitor complex business process automations. It provides a drag-and-drop workflow builder with 15+ step types, including JavaScript code execution, API calls, data transformations, and integrations with all Exprsn services.

---

## Key Features

### Workflow Designer
- **Visual Builder** - Drag-and-drop interface
- **15+ Step Types** - Comprehensive automation capabilities
- **Branching Logic** - Conditional execution paths
- **Loops & Iterations** - Process arrays and repeating tasks
- **Error Handling** - Try-catch blocks and fallback logic
- **Version Control** - Workflow versioning and rollback

### Execution Engine
- **Async Processing** - Non-blocking execution
- **Parallel Execution** - Run steps concurrently
- **State Management** - Workflow variable tracking
- **Retry Logic** - Automatic retry with backoff
- **Timeout Control** - Step and workflow timeouts
- **Execution History** - Complete audit trail

### Step Types
1. **HTTP Request** - Call external APIs
2. **JavaScript Code** - Execute custom JS (VM2 sandbox)
3. **JSONLex Expression** - Data transformation
4. **Database Query** - SQL operations
5. **Delay/Wait** - Time-based pauses
6. **Send Email** - Email notifications
7. **Send Notification** - Herald integration
8. **Webhook** - Trigger external systems
9. **Conditional** - If/else branching
10. **Loop** - Array iteration
11. **Data Transform** - Map/filter/reduce
12. **File Operations** - FileVault integration
13. **Timeline Post** - Create social posts
14. **Forge CRM** - CRM operations
15. **Custom Action** - User-defined actions

### Triggers
- **Manual** - User-initiated execution
- **Scheduled** - Cron-based scheduling
- **Webhook** - External HTTP triggers
- **Event-Based** - Platform event subscribers
- **Form Submission** - Low-Code form integration
- **Database Change** - Change data capture

### Real-Time Monitoring
- **Socket.IO Updates** - Live execution status
- **Step Progress** - Real-time step tracking
- **Variable Inspector** - Inspect workflow state
- **Execution Logs** - Detailed logging
- **Performance Metrics** - Execution time tracking

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (`exprsn_workflow`)
- **Queues:** Bull (Redis-backed)
- **Sandbox:** VM2 (JavaScript execution)
- **Scheduler:** node-cron
- **Real-Time:** Socket.IO
- **JSONLex:** Expression evaluation

### Database Schema

**Tables:**
- `workflows` - Workflow definitions
- `workflow_versions` - Version history
- `workflow_executions` - Execution records
- `execution_steps` - Step execution details
- `workflow_variables` - Variable definitions
- `workflow_triggers` - Trigger configurations
- `workflow_schedules` - Scheduled executions
- `execution_logs` - Detailed logs

---

## API Endpoints

### Workflow Management

#### `GET /api/workflows`
List user's workflows.

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "uuid",
        "name": "Lead Notification Workflow",
        "description": "Notify sales team when new lead created",
        "version": 3,
        "status": "active",
        "trigger": {
          "type": "webhook",
          "config": {}
        },
        "executionCount": 1247,
        "lastExecuted": "2024-01-01T00:00:00Z",
        "createdAt": "2023-06-01T00:00:00Z"
      }
    ]
  }
}
```

#### `POST /api/workflows`
Create new workflow.

**Request:**
```json
{
  "name": "New Lead Notification",
  "description": "Send notification when lead is created",
  "trigger": {
    "type": "webhook",
    "config": {
      "method": "POST",
      "path": "/webhooks/new-lead"
    }
  },
  "steps": [
    {
      "id": "step1",
      "type": "http_request",
      "name": "Get Lead Details",
      "config": {
        "url": "http://localhost:3016/api/crm/leads/{{trigger.leadId}}",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer {{env.CRM_TOKEN}}"
        }
      }
    },
    {
      "id": "step2",
      "type": "send_notification",
      "name": "Notify Sales Team",
      "config": {
        "userIds": ["sales-manager-uuid"],
        "title": "New Lead: {{step1.response.firstName}} {{step1.response.lastName}}",
        "message": "Company: {{step1.response.company}}\nSource: {{step1.response.source}}",
        "priority": "high"
      }
    }
  ]
}
```

#### `GET /api/workflows/:id`
Get workflow details.

#### `PUT /api/workflows/:id`
Update workflow (creates new version).

#### `DELETE /api/workflows/:id`
Delete workflow.

#### `POST /api/workflows/:id/publish`
Publish workflow version.

---

### Execution Management

#### `POST /api/workflows/:id/execute`
Execute workflow manually.

**Request:**
```json
{
  "input": {
    "leadId": "uuid",
    "source": "manual"
  },
  "variables": {
    "customVar": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "running",
    "startedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `GET /api/executions/:id`
Get execution details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflowId": "uuid",
    "status": "completed",
    "startedAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:00:15Z",
    "duration": 15000,
    "steps": [
      {
        "id": "step1",
        "name": "Get Lead Details",
        "status": "completed",
        "startedAt": "2024-01-01T00:00:00Z",
        "completedAt": "2024-01-01T00:00:02Z",
        "output": {
          "response": {
            "firstName": "John",
            "lastName": "Doe",
            "company": "Acme Corp"
          }
        }
      },
      {
        "id": "step2",
        "name": "Notify Sales Team",
        "status": "completed",
        "startedAt": "2024-01-01T00:00:02Z",
        "completedAt": "2024-01-01T00:00:15Z",
        "output": {
          "notificationId": "uuid"
        }
      }
    ]
  }
}
```

#### `GET /api/workflows/:id/executions`
List workflow executions.

#### `POST /api/executions/:id/cancel`
Cancel running execution.

#### `GET /api/executions/:id/logs`
Get execution logs.

---

### Webhook Triggers

#### `POST /webhooks/:workflowId/:path`
Trigger workflow via webhook.

**Request:**
```json
{
  "leadId": "uuid",
  "source": "website"
}
```

---

### Real-Time Socket Events

#### `execution_started`
```javascript
socket.on('execution_started', (data) => {
  console.log('Execution started:', data.executionId);
});
```

#### `step_completed`
```javascript
socket.on('step_completed', (data) => {
  console.log('Step completed:', data.stepId);
});
```

#### `execution_completed`
```javascript
socket.on('execution_completed', (data) => {
  console.log('Execution completed:', data.executionId);
});
```

#### `execution_failed`
```javascript
socket.on('execution_failed', (data) => {
  console.log('Execution failed:', data.error);
});
```

---

## Workflow Step Reference

### HTTP Request Step

```json
{
  "type": "http_request",
  "name": "Call External API",
  "config": {
    "url": "https://api.example.com/data",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{env.API_KEY}}"
    },
    "body": {
      "field": "{{input.value}}"
    },
    "timeout": 30000
  }
}
```

### JavaScript Code Step

```json
{
  "type": "javascript",
  "name": "Transform Data",
  "config": {
    "code": "const result = input.items.map(item => ({ id: item.id, name: item.name.toUpperCase() })); return { transformed: result };"
  }
}
```

### Conditional Step

```json
{
  "type": "conditional",
  "name": "Check Lead Score",
  "config": {
    "condition": "{{step1.response.score}} > 70",
    "trueBranch": ["step_high_priority"],
    "falseBranch": ["step_low_priority"]
  }
}
```

### Loop Step

```json
{
  "type": "loop",
  "name": "Process Each Item",
  "config": {
    "array": "{{step1.response.items}}",
    "iteratorVar": "item",
    "steps": [
      {
        "type": "http_request",
        "name": "Update Item",
        "config": {
          "url": "https://api.example.com/items/{{item.id}}",
          "method": "PUT",
          "body": {
            "status": "processed"
          }
        }
      }
    ]
  }
}
```

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=3017
SERVICE_NAME=exprsn-workflow

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_workflow
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Execution Configuration
MAX_PARALLEL_EXECUTIONS=100
EXECUTION_TIMEOUT_MS=300000
STEP_TIMEOUT_MS=60000
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_MS=5000

# JavaScript Sandbox (VM2)
SANDBOX_ENABLED=true
SANDBOX_TIMEOUT_MS=30000
SANDBOX_MEMORY_LIMIT_MB=128

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_MAX_CONCURRENT=50

# Service Integration
CA_URL=http://localhost:3000
HERALD_URL=http://localhost:3014
FORGE_URL=http://localhost:3016
TIMELINE_URL=http://localhost:3004
FILEVAULT_URL=http://localhost:3007

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
LOG_EXECUTION_DETAILS=true
```

---

## Usage Examples

### Create Workflow with API

```javascript
const axios = require('axios');

async function createNotificationWorkflow(token) {
  const workflow = {
    name: 'High-Value Lead Alert',
    description: 'Notify team when high-value lead is created',
    trigger: {
      type: 'webhook',
      config: {
        method: 'POST',
        path: '/new-lead'
      }
    },
    steps: [
      {
        id: 'step1',
        type: 'conditional',
        name: 'Check Lead Value',
        config: {
          condition: '{{trigger.expectedRevenue}} > 50000',
          trueBranch: ['step2'],
          falseBranch: []
        }
      },
      {
        id: 'step2',
        type: 'send_notification',
        name: 'Notify Sales Director',
        config: {
          userIds: ['sales-director-uuid'],
          title: 'High-Value Lead Alert',
          message: 'New lead with expected revenue: ${{trigger.expectedRevenue}}',
          priority: 'urgent'
        }
      }
    ]
  };

  const response = await axios.post(
    'http://localhost:3017/api/workflows',
    workflow,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  return response.data.data;
}
```

### Monitor Execution via Socket.IO

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3017', {
  auth: { token: 'your-ca-token' }
});

// Subscribe to workflow executions
socket.emit('subscribe_workflow', {
  workflowId: 'workflow-uuid'
});

// Listen for execution events
socket.on('execution_started', (data) => {
  console.log(`Execution ${data.executionId} started`);
});

socket.on('step_completed', (data) => {
  console.log(`Step ${data.stepName} completed`);
  console.log('Output:', data.output);
});

socket.on('execution_completed', (data) => {
  console.log(`Execution completed in ${data.duration}ms`);
});

socket.on('execution_failed', (data) => {
  console.error('Execution failed:', data.error);
});
```

---

## Development

```bash
cd src/exprsn-workflow
npm install
npm run migrate
npm run seed
npm run dev
```

---

## Dependencies

- **express** (^4.18.2)
- **bull** (^4.12.0)
- **vm2** (^3.9.19) - JavaScript sandbox
- **node-cron** (^3.0.3)
- **socket.io** (^4.7.2)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
