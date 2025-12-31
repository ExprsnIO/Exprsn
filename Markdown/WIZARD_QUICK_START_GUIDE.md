# Application Creation Wizard - Quick Start Guide

**Version:** 1.0
**Date:** December 29, 2025
**Status:** ✅ Production Ready

---

## 🚀 Getting Started

The Application Creation Wizard provides a streamlined 7-step process for creating low-code applications. All backend APIs are fully implemented and tested.

### Prerequisites

1. **Database migration completed:**
   ```bash
   cd src/exprsn-svr/lowcode
   npx sequelize-cli db:migrate
   ```

2. **Server running:**
   ```bash
   npm run dev:svr
   # OR
   npm start
   ```

3. **Base URL:**
   ```
   http://localhost:5001/lowcode/api
   ```

---

## 📋 API Quick Reference

### 1. Create New Application

**Endpoint:** `POST /lowcode/api/applications`

```javascript
const response = await fetch('/lowcode/api/applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'my_crm_app',
    displayName: 'My CRM Application',
    description: 'Customer relationship management system',
    version: '1.0.0',
    status: 'draft',
    icon: 'fas fa-users',
    color: '#667eea',
    gitRepository: 'https://github.com/myorg/my-crm.git',
    gitBranch: 'main',
    settings: {
      theme: 'exprsn-modern',
      security: { visibility: 'private' }
    },
    metadata: {
      selectedRoles: ['admin', 'editor', 'viewer'],
      selectedGroups: ['sales', 'support']
    }
  })
});

const { data } = await response.json();
console.log('Created app:', data.id);
```

---

### 2. Clone Existing Application

**Endpoint:** `POST /lowcode/api/applications/:id/clone`

```javascript
const response = await fetch(`/lowcode/api/applications/${sourceAppId}/clone`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'my_crm_app_v2',
    displayName: 'My CRM V2',
    version: '2.0.0',
    cloneOptions: {
      entities: true,      // Clone data schemas
      forms: true,         // Clone form definitions
      grids: true,         // Clone grid configurations
      dataSources: false,  // Reference existing data sources
      queries: false,      // Don't clone queries
      data: false,         // Don't clone actual data
      workflows: false,    // Don't clone workflows
      permissions: false   // Don't clone permissions
    },
    overrides: {
      color: '#ff6b6b',
      icon: 'fas fa-rocket',
      gitRepository: 'https://github.com/myorg/my-crm-v2.git',
      gitBranch: 'develop'
    }
  })
});

const { data } = await response.json();
console.log('Cloned app:', data.id);
console.log('Clone source:', data.settings.clonedFrom);
```

---

### 3. List Available Data Sources

**Endpoint:** `GET /lowcode/api/datasources?applicationId={uuid}`

```javascript
const response = await fetch(
  `/lowcode/api/datasources?applicationId=${appId}`
);

const { data } = await response.json();

data.dataSources.forEach(ds => {
  console.log(`${ds.displayName} (${ds.sourceType})`);
});
```

**Supported Source Types:**
- `postgresql`, `forge`, `rest`, `soap`, `webhook`
- `json`, `xml`, `csv`, `tsv`, `redis`
- `plugin`, `schema`, `webservice`

---

### 4. List Available Queries

**Endpoint:** `GET /lowcode/api/queries?applicationId={uuid}`

```javascript
const response = await fetch(
  `/lowcode/api/queries?applicationId=${appId}&status=active`
);

const { data } = await response.json();

console.log(`Found ${data.count} queries`);
data.queries.forEach(q => {
  console.log(`- ${q.displayName} (${q.queryType})`);
});
```

---

### 5. Create New Query

**Endpoint:** `POST /lowcode/api/queries`

```javascript
const response = await fetch('/lowcode/api/queries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: appId,
    dataSourceId: dataSourceId,
    name: 'get_customers',
    displayName: 'Get All Customers',
    description: 'Retrieves all active customers',
    queryType: 'visual',
    queryDefinition: {
      tables: [
        {
          name: 'customers',
          alias: 'c',
          columns: ['id', 'name', 'email', 'status']
        }
      ],
      filters: [
        { field: 'c.status', operator: '=', value: 'active' }
      ],
      orderBy: [
        { field: 'c.created_at', direction: 'DESC' }
      ],
      limit: 100
    },
    parameters: [
      {
        name: 'status',
        type: 'string',
        defaultValue: 'active'
      }
    ],
    cacheEnabled: true,
    cacheTtl: 300,
    status: 'active'
  })
});

const { data } = await response.json();
console.log('Query created:', data.id);
```

---

### 6. Get Available Roles

**Endpoint:** `GET /lowcode/api/security/roles?applicationId={uuid}`

```javascript
const response = await fetch(
  `/lowcode/api/security/roles?applicationId=${appId}`
);

const { data } = await response.json();

data.roles.forEach(role => {
  console.log(`${role.displayName}: ${role.permissions.join(', ')}`);
});
```

---

### 7. Get Available Groups

**Endpoint:** `GET /lowcode/api/security/groups?applicationId={uuid}`

```javascript
const response = await fetch(
  `/lowcode/api/security/groups?applicationId=${appId}`
);

const { data } = await response.json();

data.groups.forEach(group => {
  console.log(`${group.displayName} (${group.memberCount} members)`);
});
```

---

## 🎨 Complete Wizard Integration Example

```javascript
class ApplicationWizard {
  constructor(baseUrl = 'http://localhost:5001/lowcode/api') {
    this.baseUrl = baseUrl;
    this.wizardData = {
      template: 'blank',
      app: {},
      git: {},
      access: {},
      theme: 'exprsn-default',
      dataSources: [],
      queries: []
    };
  }

  // Step 1: Template Selection
  setTemplate(template, sourceAppId = null) {
    this.wizardData.template = template;
    this.wizardData.sourceAppId = sourceAppId;
  }

  // Step 2: Basic Settings
  setBasicInfo(info) {
    this.wizardData.app = {
      name: info.name,
      displayName: info.displayName,
      description: info.description,
      version: info.version || '1.0.0',
      icon: info.icon || 'fas fa-cube',
      color: info.color || '#667eea'
    };
  }

  // Step 3: Git Integration
  setGitSettings(git) {
    this.wizardData.git = {
      repository: git.repository,
      branch: git.branch || 'main',
      autoCommit: git.autoCommit || false,
      cicd: git.cicd || false
    };
  }

  // Step 4: Access Control
  setAccessControl(access) {
    this.wizardData.access = {
      visibility: access.visibility || 'private',
      roles: access.roles || ['admin', 'editor', 'viewer'],
      groups: access.groups || []
    };
  }

  // Step 5: Theme
  setTheme(theme) {
    this.wizardData.theme = theme;
  }

  // Step 6: Data Sources & Queries
  setDataIntegration(dataIntegration) {
    this.wizardData.dataSources = dataIntegration.dataSources || [];
    this.wizardData.queries = dataIntegration.queries || [];
  }

  // Step 7: Create Application
  async createApplication() {
    const { template, sourceAppId, app, git, access, theme } = this.wizardData;

    if (template === 'clone' && sourceAppId) {
      // Clone existing application
      return await this.cloneApplication(sourceAppId);
    } else {
      // Create new application
      return await this.createNewApplication();
    }
  }

  async createNewApplication() {
    const response = await fetch(`${this.baseUrl}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...this.wizardData.app,
        gitRepository: this.wizardData.git.repository,
        gitBranch: this.wizardData.git.branch,
        settings: {
          theme: this.wizardData.theme,
          security: {
            visibility: this.wizardData.access.visibility
          },
          git: {
            autoCommit: this.wizardData.git.autoCommit,
            cicd: this.wizardData.git.cicd
          }
        },
        metadata: {
          selectedRoles: this.wizardData.access.roles,
          selectedGroups: this.wizardData.access.groups,
          selectedDataSources: this.wizardData.dataSources,
          selectedQueries: this.wizardData.queries
        }
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  async cloneApplication(sourceAppId) {
    const response = await fetch(
      `${this.baseUrl}/applications/${sourceAppId}/clone`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.wizardData.app,
          cloneOptions: {
            entities: true,
            forms: true,
            grids: true,
            dataSources: false,
            queries: false
          },
          overrides: {
            gitRepository: this.wizardData.git.repository,
            gitBranch: this.wizardData.git.branch,
            settings: {
              theme: this.wizardData.theme,
              security: {
                visibility: this.wizardData.access.visibility
              }
            }
          }
        })
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  // Helper: Load data sources for Step 6
  async loadDataSources(applicationId = null) {
    const url = applicationId
      ? `${this.baseUrl}/datasources?applicationId=${applicationId}`
      : `${this.baseUrl}/datasources`;

    const response = await fetch(url);
    const { data } = await response.json();
    return data.dataSources;
  }

  // Helper: Load queries for Step 6
  async loadQueries(applicationId) {
    const response = await fetch(
      `${this.baseUrl}/queries?applicationId=${applicationId}`
    );
    const { data } = await response.json();
    return data.queries;
  }

  // Helper: Load roles for Step 4
  async loadRoles(applicationId = null) {
    const url = applicationId
      ? `${this.baseUrl}/security/roles?applicationId=${applicationId}`
      : `${this.baseUrl}/security/roles`;

    const response = await fetch(url);
    const { data } = await response.json();
    return data.roles;
  }

  // Helper: Load groups for Step 4
  async loadGroups(applicationId = null) {
    const url = applicationId
      ? `${this.baseUrl}/security/groups?applicationId=${applicationId}`
      : `${this.baseUrl}/security/groups`;

    const response = await fetch(url);
    const { data } = await response.json();
    return data.groups;
  }
}

// Usage Example
const wizard = new ApplicationWizard();

// Step 1
wizard.setTemplate('blank');

// Step 2
wizard.setBasicInfo({
  name: 'my_project_app',
  displayName: 'My Project Management App',
  description: 'Track projects and tasks',
  version: '1.0.0',
  icon: 'fas fa-tasks',
  color: '#8b5cf6'
});

// Step 3
wizard.setGitSettings({
  repository: 'https://github.com/myorg/project-app.git',
  branch: 'main',
  autoCommit: true,
  cicd: true
});

// Step 4
wizard.setAccessControl({
  visibility: 'private',
  roles: ['admin', 'manager', 'member'],
  groups: ['engineering', 'product']
});

// Step 5
wizard.setTheme('exprsn-modern');

// Step 6
wizard.setDataIntegration({
  dataSources: ['datasource-uuid-1'],
  queries: ['query-uuid-1', 'query-uuid-2']
});

// Step 7
const newApp = await wizard.createApplication();
console.log('Application created:', newApp);
```

---

## 🧪 Testing Your Integration

Run the provided test script to verify all APIs work:

```bash
cd src/exprsn-svr/lowcode
node scripts/test-wizard-core-apis.js
```

**Expected output:**
```
✅ ALL CORE WIZARD API TESTS PASSED!

📊 Test Results Summary:
   1. ✅ Application creation with custom version/status
   2. ✅ Data source creation
   3. ✅ Query creation (Visual type) - NEW
   4. ✅ Query creation (SQL type) - NEW
   5. ✅ Query associations (Application, DataSource) - NEW
   6. ✅ Query listing and filtering - NEW
   7. ✅ Query execution tracking - NEW
   8. ✅ Application cloning with overrides - NEW
   9. ✅ Query filtering by status/type/cache - NEW

🎉 Application Wizard Core APIs Ready for Production!
```

---

## 📚 Additional Resources

- **Full API Documentation:** `Markdown/APPLICATION_WIZARD_API_IMPLEMENTATION_SUMMARY.md`
- **Wizard UI Guide:** `Markdown/APP_CREATION_WIZARD_GUIDE.md`
- **Test Scripts:** `src/exprsn-svr/lowcode/scripts/test-wizard-*.js`

---

## 🐛 Troubleshooting

### Query model not loading

```bash
# Verify migration ran
cd src/exprsn-svr/lowcode
npx sequelize-cli db:migrate:status

# Should show:
# up 20251229120000-create-queries-table.js
```

### Application clone fails

```javascript
// Check authorization - must own source app or it must be public
const app = await Application.findByPk(sourceId);
if (app.ownerId !== userId && app.settings?.security?.visibility !== 'public') {
  throw new Error('Cannot clone this application');
}
```

### Query associations missing

```javascript
// Ensure models are loaded with associations
const query = await db.Query.findByPk(id, {
  include: [
    { model: db.Application, as: 'application' },
    { model: db.DataSource, as: 'dataSource' }
  ]
});
```

---

## 🎯 Next Steps

1. **Frontend Integration:** Connect your wizard UI to these APIs
2. **Add Templates:** Create pre-configured application templates
3. **Enhance Cloning:** Add data migration options
4. **Query Execution:** Implement QueryService for executing queries
5. **Theme Designer:** Build visual theme customization

---

**Ready to build amazing low-code applications!** 🚀

For questions or issues, check the full documentation or test scripts.
