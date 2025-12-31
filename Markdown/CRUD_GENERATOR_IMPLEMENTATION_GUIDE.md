# CRUD Generator with Auto-Migration - Implementation Guide

**Status:** Partially Complete - Needs Final Implementation
**Priority:** High - This is the final major feature tying everything together
**Estimated Completion:** 4-6 hours

---

## Overview

The CRUD Generator automatically generates and executes database migrations, then creates working REST API endpoints when a user clicks "Publish" on an entity. This feature transforms the Entity Designer Pro from a schema design tool into a complete backend code generator.

## Current Status

✅ **Completed:**
- Publish button exists in header (entity-designer-pro.ejs:1359-1362)
- Migration Generator implemented (MigrationService.js)
- Migration UI and modals implemented
- Entity locking and versioning system
- Schema diff detection capabilities

⚠️ **Needs Implementation:**
- Publish confirmation modal (3 modals total)
- Publish workflow orchestration
- CRUDGenerator.js service
- Auto-migration execution
- API route generation and registration
- Success/error handling UI

---

## Architecture

```
User Clicks "Publish"
        ↓
Publish Confirmation Modal
  • Shows entity summary (fields, indexes, relationships)
  • Displays 4-step workflow preview
  • Warns about destructive changes
  • Options: validate schema, backup data, generate seeds
        ↓
[User Confirms] → Publish Progress Modal
        ↓
Step 1: Generate Migration
  • Detect schema changes (MigrationService.detectSchemaChanges)
  • Generate SQL (MigrationService.generateMigration)
  • Auto-increment version (1.0.0 → 1.0.1)
        ↓
Step 2: Execute Migration
  • POST /lowcode/api/entities/:id/migrations/execute
  • Run SQL against PostgreSQL database
  • Update migration status to 'applied'
  • Handle errors with rollback option
        ↓
Step 3: Generate CRUD Routes
  • POST /lowcode/api/entities/:id/crud/generate
  • CRUDGenerator.generateCRUDRoutes(entity)
  • Create 5 REST endpoints (GET all, POST, GET :id, PUT :id, DELETE :id)
  • Write route file to /routes/entities/{entityName}.js
  • Register routes in API runtime
        ↓
Step 4: Finalize Publication
  • Mark entity as 'published'
  • Update entity.publishedAt timestamp
  • Update entity.metadata.version
  • Save entity to database
        ↓
Publish Success Modal
  • Shows published entity details
  • Lists 5 generated API endpoints
  • Provides sample curl command
  • Copy-to-clipboard for endpoints
```

---

## Files to Modify/Create

### 1. entity-designer-pro.ejs
**Location:** `/Users/rickholland/Downloads/Exprsn/src/exprsn-svr/lowcode/views/entity-designer-pro.ejs`

**Add 3 Modals:**

#### A. Publish Confirmation Modal (Lines ~2730+)
```html
<!-- Publish Entity Confirmation Modal -->
<div class="modal-overlay" id="publishEntityModal">
  <div class="modal" style="max-width: 800px;">
    <div class="modal-header">
      <h2 class="modal-title">Publish Entity</h2>
      <button class="modal-close" id="publishEntityModalClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <!-- Publication Summary -->
      <div class="publish-summary" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
        <div class="publish-summary-item" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="fas fa-table" style="font-size: 1.5rem; color: #3b82f6;"></i>
          <div>
            <strong style="display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase;">Database Table</strong>
            <code id="publishTableName" style="font-size: 0.875rem; color: #1f2937;">users</code>
          </div>
        </div>
        <div class="publish-summary-item" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="fas fa-columns" style="font-size: 1.5rem; color: #10b981;"></i>
          <div>
            <strong style="display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase;">Fields</strong>
            <span id="publishFieldCount" style="font-size: 0.875rem; font-weight: 600;">12</span> fields
          </div>
        </div>
        <div class="publish-summary-item" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="fas fa-key" style="font-size: 1.5rem; color: #f59e0b;"></i>
          <div>
            <strong style="display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase;">Indexes</strong>
            <span id="publishIndexCount" style="font-size: 0.875rem; font-weight: 600;">3</span> indexes
          </div>
        </div>
        <div class="publish-summary-item" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="fas fa-link" style="font-size: 1.5rem; color: #8b5cf6;"></i>
          <div>
            <strong style="display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase;">Relationships</strong>
            <span id="publishRelationshipCount" style="font-size: 0.875rem; font-weight: 600;">2</span> relationships
          </div>
        </div>
      </div>

      <!-- Publication Steps Preview -->
      <div class="publish-steps" style="margin-bottom: 2rem;">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">
          <i class="fas fa-tasks"></i> What will happen:
        </h3>
        <div class="publish-step" style="display: flex; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px; margin-bottom: 1rem;">
          <div class="step-number" style="display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 50%; background: #3b82f6; color: white; font-weight: 700; flex-shrink: 0;">1</div>
          <div class="step-content">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Generate Migration</strong>
            <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Create SQL migration for schema changes (v<span id="publishMigrationVersion">1.0.0</span>)</p>
          </div>
        </div>
        <div class="publish-step" style="display: flex; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px; margin-bottom: 1rem;">
          <div class="step-number" style="display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 50%; background: #10b981; color: white; font-weight: 700; flex-shrink: 0;">2</div>
          <div class="step-content">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Execute Migration</strong>
            <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Apply migration to database (creates/alters table)</p>
          </div>
        </div>
        <div class="publish-step" style="display: flex; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px; margin-bottom: 1rem;">
          <div class="step-number" style="display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 50%; background: #f59e0b; color: white; font-weight: 700; flex-shrink: 0;">3</div>
          <div class="step-content">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Generate API Routes</strong>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">Create 5 CRUD endpoints automatically:</p>
            <ul style="margin: 0; padding-left: 1.5rem; font-size: 0.8125rem; color: #6b7280;">
              <li><code style="background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 3px;">GET /api/entities/<span id="publishGetAll">users</span></code> - List all</li>
              <li><code style="background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 3px;">POST /api/entities/<span id="publishCreate">users</span></code> - Create new</li>
              <li><code style="background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 3px;">GET /api/entities/<span id="publishGetOne">users</span>/:id</code> - Get one</li>
              <li><code style="background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 3px;">PUT /api/entities/<span id="publishUpdate">users</span>/:id</code> - Update</li>
              <li><code style="background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 3px;">DELETE /api/entities/<span id="publishDelete">users</span>/:id</code> - Delete</li>
            </ul>
          </div>
        </div>
        <div class="publish-step" style="display: flex; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
          <div class="step-number" style="display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 50%; background: #8b5cf6; color: white; font-weight: 700; flex-shrink: 0;">4</div>
          <div class="step-content">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Update Entity Status</strong>
            <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Mark entity as published and track version</p>
          </div>
        </div>
      </div>

      <!-- Publication Options -->
      <div class="publish-options" style="padding: 1rem; background: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: #1f2937;">
          <i class="fas fa-cog"></i> Options:
        </h3>
        <div class="form-checkbox" style="margin-bottom: 0.5rem;">
          <input type="checkbox" id="publishGenerateSeedData">
          <label for="publishGenerateSeedData" style="font-size: 0.875rem;">
            Generate sample seed data (10 records)
          </label>
        </div>
        <div class="form-checkbox" style="margin-bottom: 0.5rem;">
          <input type="checkbox" id="publishValidateSchema" checked>
          <label for="publishValidateSchema" style="font-size: 0.875rem;">
            Validate schema before applying migration
          </label>
        </div>
        <div class="form-checkbox">
          <input type="checkbox" id="publishBackupBeforeMigration">
          <label for="publishBackupBeforeMigration" style="font-size: 0.875rem;">
            Backup existing table before migration (if exists)
          </label>
        </div>
      </div>

      <!-- Warning for Destructive Changes -->
      <div id="publishWarning" class="publish-warning" style="display: none; margin-top: 1rem; padding: 1rem; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <div style="display: flex; gap: 0.75rem;">
          <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 1.25rem;"></i>
          <div style="flex: 1;">
            <strong style="display: block; color: #991b1b; margin-bottom: 0.5rem;">Warning: Destructive Changes Detected</strong>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #7f1d1d;">
              This migration includes operations that may result in data loss:
            </p>
            <ul id="publishWarningList" style="margin: 0; padding-left: 1.5rem; font-size: 0.875rem; color: #7f1d1d;">
              <!-- Populated dynamically via JavaScript -->
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="publishEntityCancel">Cancel</button>
      <button class="btn btn-success" id="publishEntityConfirm">
        <i class="fas fa-rocket"></i> Publish Entity
      </button>
    </div>
  </div>
</div>
```

#### B. Publish Progress Modal (Lines ~2850+)
```html
<!-- Publish Progress Modal -->
<div class="modal-overlay" id="publishProgressModal">
  <div class="modal" style="max-width: 600px;">
    <div class="modal-header">
      <h2 class="modal-title">
        <i class="fas fa-spinner fa-spin"></i> Publishing Entity...
      </h2>
    </div>
    <div class="modal-body">
      <div class="progress-steps">
        <!-- Step 1 -->
        <div class="progress-step" id="progressStep1" style="display: flex; gap: 1rem; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: #f9fafb;">
          <div class="progress-step-icon" style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e5e7eb;">
            <i class="fas fa-spinner fa-spin" style="color: #3b82f6;"></i>
          </div>
          <div class="progress-step-content" style="flex: 1;">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Generating Migration</strong>
            <p id="progressStep1Text" style="margin: 0; font-size: 0.875rem; color: #6b7280;">Creating SQL migration...</p>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="progress-step" id="progressStep2" style="display: flex; gap: 1rem; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: #f9fafb; opacity: 0.5;">
          <div class="progress-step-icon" style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e5e7eb;">
            <i class="fas fa-clock" style="color: #9ca3af;"></i>
          </div>
          <div class="progress-step-content" style="flex: 1;">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Executing Migration</strong>
            <p id="progressStep2Text" style="margin: 0; font-size: 0.875rem; color: #6b7280;">Waiting...</p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="progress-step" id="progressStep3" style="display: flex; gap: 1rem; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: #f9fafb; opacity: 0.5;">
          <div class="progress-step-icon" style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e5e7eb;">
            <i class="fas fa-clock" style="color: #9ca3af;"></i>
          </div>
          <div class="progress-step-content" style="flex: 1;">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Generating API Routes</strong>
            <p id="progressStep3Text" style="margin: 0; font-size: 0.875rem; color: #6b7280;">Waiting...</p>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="progress-step" id="progressStep4" style="display: flex; gap: 1rem; padding: 1rem; border-radius: 8px; background: #f9fafb; opacity: 0.5;">
          <div class="progress-step-icon" style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e5e7eb;">
            <i class="fas fa-clock" style="color: #9ca3af;"></i>
          </div>
          <div class="progress-step-content" style="flex: 1;">
            <strong style="display: block; margin-bottom: 0.25rem; color: #1f2937;">Finalizing</strong>
            <p id="progressStep4Text" style="margin: 0; font-size: 0.875rem; color: #6b7280;">Waiting...</p>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div id="publishErrorDisplay" class="publish-error" style="display: none; margin-top: 1rem; padding: 1rem; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <div style="display: flex; gap: 0.75rem;">
          <i class="fas fa-exclamation-circle" style="color: #ef4444; font-size: 1.25rem;"></i>
          <div style="flex: 1;">
            <strong style="display: block; color: #991b1b; margin-bottom: 0.5rem;">Publication Failed</strong>
            <p id="publishErrorMessage" style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #7f1d1d;"></p>
            <pre id="publishErrorDetails" style="background: #1f2937; color: #e5e7eb; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;"></pre>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="publishProgressClose" disabled>Close</button>
      <button class="btn btn-danger" id="publishAbortBtn" style="display: none;">
        <i class="fas fa-stop"></i> Abort
      </button>
    </div>
  </div>
</div>
```

#### C. Publish Success Modal (Lines ~2950+)
```html
<!-- Publish Success Modal -->
<div class="modal-overlay" id="publishSuccessModal">
  <div class="modal" style="max-width: 700px;">
    <div class="modal-header">
      <h2 class="modal-title">
        <i class="fas fa-check-circle" style="color: #10b981;"></i>
        Entity Published Successfully!
      </h2>
      <button class="modal-close" id="publishSuccessModalClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <!-- Success Summary -->
      <div class="success-summary" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: #f0fdf4; border-radius: 8px;">
        <div class="success-item" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="fas fa-database" style="font-size: 1.5rem; color: #10b981;"></i>
          <div>
            <strong style="display: block; font-size: 0.75rem; color: #065f46; text-transform: uppercase;">Table Created</strong>
            <code id="successTableName" style="font-size: 0.875rem; color: #1f2937;">users</code>
          </div>
        </div>
        <div class="success-item" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="fas fa-code-branch" style="font-size: 1.5rem; color: #3b82f6;"></i>
          <div>
            <strong style="display: block; font-size: 0.75rem; color: #1e40af; text-transform: uppercase;">Version</strong>
            <code id="successVersion" style="font-size: 0.875rem; color: #1f2937;">1.0.0</code>
          </div>
        </div>
        <div class="success-item" style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="fas fa-clock" style="font-size: 1.5rem; color: #6b7280;"></i>
          <div>
            <strong style="display: block; font-size: 0.75rem; color: #4b5563; text-transform: uppercase;">Published</strong>
            <span id="successTimestamp" style="font-size: 0.875rem; color: #1f2937;">Just now</span>
          </div>
        </div>
      </div>

      <!-- API Endpoints -->
      <div class="api-endpoints-section" style="margin-bottom: 2rem;">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">
          <i class="fas fa-plug"></i> API Endpoints Generated:
        </h3>
        <div class="api-endpoint-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <!-- GET All -->
          <div class="api-endpoint" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
            <span class="http-method get" style="padding: 0.25rem 0.5rem; background: #10b981; color: white; border-radius: 4px; font-weight: 600; font-size: 0.75rem; min-width: 3.5rem; text-align: center;">GET</span>
            <code id="successEndpoint1" style="flex: 1; font-size: 0.875rem; color: #1f2937;">/api/entities/users</code>
            <button class="btn btn-sm btn-outline-primary copy-endpoint-btn" data-endpoint="/api/entities/users" title="Copy endpoint">
              <i class="fas fa-copy"></i>
            </button>
          </div>

          <!-- POST Create -->
          <div class="api-endpoint" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
            <span class="http-method post" style="padding: 0.25rem 0.5rem; background: #3b82f6; color: white; border-radius: 4px; font-weight: 600; font-size: 0.75rem; min-width: 3.5rem; text-align: center;">POST</span>
            <code id="successEndpoint2" style="flex: 1; font-size: 0.875rem; color: #1f2937;">/api/entities/users</code>
            <button class="btn btn-sm btn-outline-primary copy-endpoint-btn" data-endpoint="/api/entities/users" title="Copy endpoint">
              <i class="fas fa-copy"></i>
            </button>
          </div>

          <!-- GET One -->
          <div class="api-endpoint" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
            <span class="http-method get" style="padding: 0.25rem 0.5rem; background: #10b981; color: white; border-radius: 4px; font-weight: 600; font-size: 0.75rem; min-width: 3.5rem; text-align: center;">GET</span>
            <code id="successEndpoint3" style="flex: 1; font-size: 0.875rem; color: #1f2937;">/api/entities/users/:id</code>
            <button class="btn btn-sm btn-outline-primary copy-endpoint-btn" data-endpoint="/api/entities/users/:id" title="Copy endpoint">
              <i class="fas fa-copy"></i>
            </button>
          </div>

          <!-- PUT Update -->
          <div class="api-endpoint" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
            <span class="http-method put" style="padding: 0.25rem 0.5rem; background: #f59e0b; color: white; border-radius: 4px; font-weight: 600; font-size: 0.75rem; min-width: 3.5rem; text-align: center;">PUT</span>
            <code id="successEndpoint4" style="flex: 1; font-size: 0.875rem; color: #1f2937;">/api/entities/users/:id</code>
            <button class="btn btn-sm btn-outline-primary copy-endpoint-btn" data-endpoint="/api/entities/users/:id" title="Copy endpoint">
              <i class="fas fa-copy"></i>
            </button>
          </div>

          <!-- DELETE -->
          <div class="api-endpoint" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
            <span class="http-method delete" style="padding: 0.25rem 0.5rem; background: #ef4444; color: white; border-radius: 4px; font-weight: 600; font-size: 0.75rem; min-width: 3.5rem; text-align: center;">DELETE</span>
            <code id="successEndpoint5" style="flex: 1; font-size: 0.875rem; color: #1f2937;">/api/entities/users/:id</code>
            <button class="btn btn-sm btn-outline-primary copy-endpoint-btn" data-endpoint="/api/entities/users/:id" title="Copy endpoint">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Sample API Call -->
      <div class="sample-api-call">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">
          <i class="fas fa-terminal"></i> Sample API Call:
        </h3>
        <pre style="background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 4px; overflow-x: auto; margin-bottom: 0.5rem;"><code id="successSampleCall">curl -X GET http://localhost:5000/api/entities/users \
  -H "Content-Type: application/json"</code></pre>
        <button class="btn btn-sm btn-outline-primary" id="copySampleCallBtn">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline-secondary" id="publishSuccessViewMigrations">
        <i class="fas fa-database"></i> View Migrations
      </button>
      <button class="btn btn-primary" id="publishSuccessClose">
        <i class="fas fa-check"></i> Done
      </button>
    </div>
  </div>
</div>
```

---

### 2. CRUDGenerator.js Service
**Location:** `/Users/rickholland/Downloads/Exprsn/src/exprsn-svr/lowcode/services/CRUDGenerator.js` (NEW FILE)

See the detailed implementation in the task agent's prompt. This service should:
- Generate 5 REST API routes (GET all, POST, GET :id, PUT :id, DELETE :id)
- Support pagination, filtering, sorting for GET all
- Validate required fields for POST/PUT
- Handle unique constraint violations
- Support soft deletes if entity has `deleted_at` field
- Auto-update `updated_at` timestamp
- Generate proper error responses
- Write route files to `/routes/entities/{entityName}.js`

**Key Functions:**
- `generateCRUDRoutes(entity)` - Main entry point
- `generateListAllRoute(entity)` - GET with pagination/filtering
- `generateCreateRoute(entity)` - POST with validation
- `generateGetOneRoute(entity)` - GET :id
- `generateUpdateRoute(entity)` - PUT :id
- `generateDeleteRoute(entity)` - DELETE :id (soft or hard)
- `assembleRouteCode(entity, routes)` - Combine into Express router
- `writeRouteFile(entity, routeCode)` - Write to disk

---

### 3. entity-designer-pro.js Functions
**Location:** `/Users/rickholland/Downloads/Exprsn/src/exprsn-svr/lowcode/public/js/entity-designer-pro.js`

**Add These Functions:**

```javascript
/**
 * Open publish entity confirmation modal
 */
async function openPublishEntityModal() {
  const modal = document.getElementById('publishEntityModal');
  if (!modal) return;

  // Populate summary
  document.getElementById('publishTableName').textContent = state.currentEntity.tableName;
  document.getElementById('publishFieldCount').textContent = fields.length;
  document.getElementById('publishIndexCount').textContent = indexes.length;
  document.getElementById('publishRelationshipCount').textContent = relationships.length;

  // Set version
  const currentVersion = state.currentEntity.metadata?.version || '1.0.0';
  const nextVersion = incrementVersion(currentVersion, 'patch');
  document.getElementById('publishMigrationVersion').textContent = nextVersion;

  // Populate endpoint examples
  const entityName = state.currentEntity.name;
  ['publishGetAll', 'publishCreate', 'publishGetOne', 'publishUpdate', 'publishDelete'].forEach(id => {
    document.getElementById(id).textContent = entityName;
  });

  // Check for destructive changes
  await detectDestructiveChanges();

  modal.classList.add('active');
}

/**
 * Detect destructive schema changes
 */
async function detectDestructiveChanges() {
  if (!state.originalSchema) {
    // No previous schema, so no destructive changes
    document.getElementById('publishWarning').style.display = 'none';
    return;
  }

  const warnings = [];
  const current = {
    name: state.currentEntity.name,
    tableName: state.currentEntity.tableName,
    fields,
    indexes,
    relationships
  };

  // Import MigrationService detection
  const response = await fetch('/lowcode/api/migrations/detect-changes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current,
      previous: state.originalSchema
    })
  });

  const { changes } = await response.json();

  // Check for removed fields
  if (changes.removedFields?.length > 0) {
    warnings.push(`${changes.removedFields.length} field(s) will be removed: ${changes.removedFields.map(f => f.name).join(', ')}`);
  }

  // Check for type changes
  if (changes.modifiedFields?.length > 0) {
    const typeChanges = changes.modifiedFields.filter(m => m.changes.type);
    if (typeChanges.length > 0) {
      warnings.push(`${typeChanges.length} field(s) will change type (may lose data)`);
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    const warningList = document.getElementById('publishWarningList');
    warningList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
    document.getElementById('publishWarning').style.display = 'block';
  } else {
    document.getElementById('publishWarning').style.display = 'none';
  }
}

/**
 * Publish entity - Execute full workflow
 */
async function publishEntity() {
  const options = {
    generateSeedData: document.getElementById('publishGenerateSeedData').checked,
    validateSchema: document.getElementById('publishValidateSchema').checked,
    backupBeforeMigration: document.getElementById('publishBackupBeforeMigration').checked
  };

  // Close confirmation, open progress
  document.getElementById('publishEntityModal').classList.remove('active');
  document.getElementById('publishProgressModal').classList.add('active');

  try {
    // Step 1: Generate migration
    updateProgressStep(1, 'in-progress', 'Generating migration SQL...');
    const migration = await generateMigrationForPublish();
    updateProgressStep(1, 'completed', `Migration v${migration.version} generated`);

    // Step 2: Execute migration
    updateProgressStep(2, 'in-progress', 'Applying migration to database...');
    await executeMigration(migration, options);
    updateProgressStep(2, 'completed', 'Migration applied successfully');

    // Step 3: Generate CRUD routes
    updateProgressStep(3, 'in-progress', 'Generating API routes...');
    const crudResult = await generateCRUDRoutes();
    updateProgressStep(3, 'completed', `${crudResult.endpoints.length} endpoints created`);

    // Step 4: Finalize
    updateProgressStep(4, 'in-progress', 'Updating entity status...');
    await finalizePublication(migration, crudResult);
    updateProgressStep(4, 'completed', 'Entity published');

    // Show success
    setTimeout(() => {
      document.getElementById('publishProgressModal').classList.remove('active');
      showPublishSuccessModal(crudResult);
    }, 1000);

  } catch (error) {
    console.error('Publication failed:', error);
    showPublishError(error);
  }
}

/**
 * Generate migration for publish
 */
async function generateMigrationForPublish() {
  const currentSchema = {
    name: state.currentEntity.name,
    tableName: state.currentEntity.tableName,
    fields,
    indexes,
    relationships
  };

  const response = await fetch(`/lowcode/api/entities/${state.currentEntity.id}/migrations/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentSchema,
      previousSchema: state.originalSchema || null,
      options: {
        type: 'auto',
        safeMode: true,
        generateRollback: true
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate migration');
  }

  return await response.json();
}

/**
 * Execute migration
 */
async function executeMigration(migration, options) {
  const response = await fetch(`/lowcode/api/entities/${state.currentEntity.id}/migrations/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ migration, options })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Migration execution failed');
  }

  return await response.json();
}

/**
 * Generate CRUD routes
 */
async function generateCRUDRoutes() {
  const entity = {
    name: state.currentEntity.name,
    tableName: state.currentEntity.tableName,
    fields,
    relationships
  };

  const response = await fetch(`/lowcode/api/entities/${state.currentEntity.id}/crud/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'CRUD generation failed');
  }

  return await response.json();
}

/**
 * Finalize publication
 */
async function finalizePublication(migration, crudResult) {
  const updatedEntity = {
    ...state.currentEntity,
    metadata: {
      ...state.currentEntity.metadata,
      version: migration.version,
      published: true,
      publishedAt: new Date().toISOString(),
      lastMigrationId: migration.id
    },
    crudEndpoints: crudResult.endpoints
  };

  const response = await fetch(`/lowcode/api/entities/${state.currentEntity.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedEntity)
  });

  if (!response.ok) {
    throw new Error('Failed to update entity status');
  }

  state.currentEntity = updatedEntity;
  state.originalSchema = { name: updatedEntity.name, tableName: updatedEntity.tableName, fields, indexes, relationships };
}

/**
 * Update progress step UI
 */
function updateProgressStep(stepNum, status, message) {
  const step = document.getElementById(`progressStep${stepNum}`);
  const icon = step.querySelector('.progress-step-icon i');
  const text = document.getElementById(`progressStep${stepNum}Text`);

  // Update icon
  icon.className = status === 'in-progress' ? 'fas fa-spinner fa-spin' :
                   status === 'completed' ? 'fas fa-check-circle' :
                   status === 'failed' ? 'fas fa-exclamation-circle' :
                   'fas fa-clock';

  // Update color
  step.style.opacity = status === 'in-progress' || status === 'completed' ? '1' : '0.5';

  if (status === 'completed') {
    step.style.background = '#f0fdf4';
    icon.style.color = '#10b981';
  } else if (status === 'failed') {
    step.style.background = '#fef2f2';
    icon.style.color = '#ef4444';
  } else if (status === 'in-progress') {
    step.style.background = '#eff6ff';
    icon.style.color = '#3b82f6';
  }

  // Update text
  text.textContent = message;
}

/**
 * Show publish error
 */
function showPublishError(error) {
  document.getElementById('publishErrorDisplay').style.display = 'block';
  document.getElementById('publishErrorMessage').textContent = error.message;
  document.getElementById('publishErrorDetails').textContent = error.stack || 'No additional details';
  document.getElementById('publishProgressClose').disabled = false;
}

/**
 * Show publish success modal
 */
function showPublishSuccessModal(crudResult) {
  const modal = document.getElementById('publishSuccessModal');

  // Populate data
  document.getElementById('successTableName').textContent = state.currentEntity.tableName;
  document.getElementById('successVersion').textContent = state.currentEntity.metadata.version;
  document.getElementById('successTimestamp').textContent = 'Just now';

  // Populate endpoints
  crudResult.endpoints.forEach((endpoint, i) => {
    const el = document.getElementById(`successEndpoint${i + 1}`);
    if (el) el.textContent = endpoint.path;
  });

  // Sample curl command
  const sampleCall = `curl -X GET http://localhost:5000/api/entities/${state.currentEntity.name} \\
  -H "Content-Type: application/json"`;
  document.getElementById('successSampleCall').textContent = sampleCall;

  modal.classList.add('active');
}

/**
 * Increment version number
 */
function incrementVersion(version, level = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);

  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
```

**Add Event Listeners:**
```javascript
// At bottom of file, add:
document.getElementById('publishEntityBtn')?.addEventListener('click', openPublishEntityModal);
document.getElementById('publishEntityCancel')?.addEventListener('click', () => {
  document.getElementById('publishEntityModal').classList.remove('active');
});
document.getElementById('publishEntityConfirm')?.addEventListener('click', publishEntity);
document.getElementById('publishSuccessModalClose')?.addEventListener('click', () => {
  document.getElementById('publishSuccessModal').classList.remove('active');
});
document.getElementById('publishSuccessClose')?.addEventListener('click', () => {
  document.getElementById('publishSuccessModal').classList.remove('active');
});

// Copy endpoint buttons
document.querySelectorAll('.copy-endpoint-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const endpoint = e.target.closest('button').dataset.endpoint;
    navigator.clipboard.writeText(endpoint);
    showToast('Endpoint copied to clipboard', 'success');
  });
});

// Copy sample call
document.getElementById('copySampleCallBtn')?.addEventListener('click', () => {
  const code = document.getElementById('successSampleCall').textContent;
  navigator.clipboard.writeText(code);
  showToast('Sample call copied to clipboard', 'success');
});
```

---

### 4. API Routes
**Location:** `/Users/rickholland/Downloads/Exprsn/src/exprsn-svr/lowcode/routes/index.js`

**Add These Endpoints:**

```javascript
const MigrationService = require('../services/MigrationService');
const CRUDGenerator = require('../services/CRUDGenerator');
const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exprsn_svr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

/**
 * Detect schema changes
 */
router.post('/migrations/detect-changes', async (req, res) => {
  try {
    const { current, previous } = req.body;
    const changes = MigrationService.detectSchemaChanges(current, previous);
    res.json({ success: true, changes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Generate migration
 */
router.post('/entities/:id/migrations/generate', async (req, res) => {
  try {
    const { currentSchema, previousSchema, options } = req.body;

    const migration = await MigrationService.generateMigration(
      currentSchema,
      previousSchema,
      options
    );

    // Add metadata
    const currentVersion = previousSchema?.metadata?.version || '1.0.0';
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const nextVersion = `${major}.${minor}.${patch + 1}`;

    const migrationWithMeta = {
      id: `mig_${Date.now()}_${currentSchema.name}`,
      version: nextVersion,
      description: `Auto-generated migration for ${currentSchema.name}`,
      createdAt: new Date().toISOString(),
      ...migration
    };

    res.json({ success: true, ...migrationWithMeta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Execute migration
 */
router.post('/entities/:id/migrations/execute', async (req, res) => {
  try {
    const { migration, options } = req.body;

    // Validate schema if requested
    if (options.validateSchema) {
      // Add validation logic here
    }

    // Backup table if requested
    if (options.backupBeforeMigration) {
      // Add backup logic here
    }

    // Execute migration SQL
    await pool.query(migration.sql);

    res.json({
      success: true,
      message: 'Migration executed successfully',
      migrationId: migration.id
    });
  } catch (error) {
    console.error('Migration execution failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      sqlState: error.code,
      detail: error.detail
    });
  }
});

/**
 * Generate CRUD routes
 */
router.post('/entities/:id/crud/generate', async (req, res) => {
  try {
    const { entity } = req.body;

    const result = await CRUDGenerator.generateCRUDRoutes(entity);
    await CRUDGenerator.writeRouteFile(entity, result.routeCode);

    // Register routes in Express app (requires app restart or dynamic loading)
    // For now, just return the generated code

    res.json({
      success: true,
      ...result,
      message: 'CRUD routes generated successfully. Restart server to activate.'
    });
  } catch (error) {
    console.error('CRUD generation failed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## Testing Scenarios

### Scenario 1: Create New Entity
1. Open Entity Designer Pro
2. Create new entity "Product" with fields: id, name, price, description
3. Add 2 indexes
4. Click "Publish"
5. Verify confirmation modal shows 4 fields, 2 indexes
6. Confirm publication
7. Watch progress modal (4 steps)
8. Verify success modal shows 5 API endpoints
9. Copy sample curl command
10. Test API endpoint: `curl http://localhost:5000/api/entities/product`

### Scenario 2: Modify Existing Entity
1. Open existing entity
2. Add new field "stock_quantity"
3. Click "Publish"
4. Verify warning about schema changes
5. Confirm publication
6. Verify ALTER TABLE migration executes
7. Test updated API endpoint returns new field

### Scenario 3: Destructive Change
1. Open existing entity with data
2. Remove field "old_field"
3. Click "Publish"
4. Verify **red warning** about data loss
5. Enable "Backup before migration"
6. Confirm publication
7. Verify backup created
8. Verify field removed from API responses

---

## Next Steps for Implementation

1. **Add the 3 modals to entity-designer-pro.ejs** (~300 lines)
2. **Create CRUDGenerator.js service** (~500 lines)
3. **Add JS functions to entity-designer-pro.js** (~400 lines)
4. **Add API routes to lowcode/routes/index.js** (~150 lines)
5. **Test complete publish workflow** (2-3 hours)
6. **Document generated route code** (1 hour)

**Total Estimated:** ~1,350 lines of code, 4-6 hours implementation time

---

## Success Criteria

✅ User can click "Publish" and see confirmation modal
✅ Confirmation shows entity summary and 4-step preview
✅ Warning shown for destructive changes
✅ Progress modal displays real-time status
✅ Migration executes against database successfully
✅ CRUD routes generated and written to disk
✅ Success modal shows all 5 endpoints
✅ Sample curl command works immediately
✅ Entity marked as published with version
✅ Error handling for failed migrations

---

## Generated Route Code Example

For entity "Product" with fields (id, name, price, description), the generated file `/routes/entities/product.js` would be:

```javascript
/**
 * Auto-generated CRUD routes for product
 * Generated: 2024-12-25T10:30:00.000Z
 * Entity Version: 1.0.0
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'exprsn_svr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

/**
 * GET /api/entities/product
 * List all product records with pagination
 */
router.get('/product', async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'DESC' } = req.query;

    const sql = `
      SELECT * FROM products
      ORDER BY ${sort} ${order}
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(sql, [
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit)
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/entities/product
 * Create new product record
 */
router.post('/product', async (req, res) => {
  try {
    const { name, price, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name is required'
      });
    }

    const sql = `
      INSERT INTO products (name, price, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const { rows: [newRecord] } = await pool.query(sql, [name, price, description]);

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/entities/product/:id
 * Get single product by ID
 */
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `SELECT * FROM products WHERE id = $1`;
    const { rows } = await pool.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found'
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/entities/product/:id
 * Update product record
 */
router.put('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      params.push(price);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_UPDATES',
        message: 'No fields to update'
      });
    }

    params.push(id);
    const sql = `
      UPDATE products
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await pool.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found'
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/entities/product/:id
 * Delete product record
 */
router.delete('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `DELETE FROM products WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: rows[0],
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

---

## Conclusion

This implementation guide provides everything needed to complete the **CRUD Generator with Auto-Migration** feature. Once implemented, users will be able to:

1. Design entities visually in the Entity Designer Pro
2. Click "Publish" to automatically:
   - Generate and execute database migrations
   - Create working REST API endpoints
   - Update entity version and status
3. Immediately test API endpoints with generated curl commands
4. Build complete backend applications without writing code

This is the **final major feature** that transforms the Low-Code Platform from a design tool into a complete application generator.
