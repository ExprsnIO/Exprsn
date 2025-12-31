# Git Integration Implementation Guide
## Phase 1: Connecting Git to Low-Code Designers

**Priority:** 🔴 CRITICAL
**Timeline:** 2-3 weeks
**Complexity:** High
**Impact:** Makes Git infrastructure usable from low-code workflow

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component 1: Artifact Export Service](#component-1-artifact-export-service)
3. [Component 2: Artifact Import Service](#component-2-artifact-import-service)
4. [Component 3: Git Toolbar Component](#component-3-git-toolbar-component)
5. [Component 4: Visual Diff Viewer](#component-4-visual-diff-viewer)
6. [Component 5: Merge Conflict Resolution](#component-5-merge-conflict-resolution)
7. [Integration Points](#integration-points)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)

---

## Architecture Overview

### Current State Problem

```
┌─────────────────────┐
│   Form Designer     │
│   (Database only)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PostgreSQL        │
│   app_forms.        │
│   structure (JSONB) │
└─────────────────────┘

                         ┌─────────────────────┐
                         │   Git Repository    │
                         │   (Disconnected)    │
                         └─────────────────────┘
```

**Problem:** Git infrastructure exists but cannot sync with database artifacts.

### Target State Solution

```
┌─────────────────────┐
│   Form Designer     │
│   + Git Toolbar     │
└──────────┬──────────┘
           │
           │ Save
           ▼
┌─────────────────────┐      Export      ┌─────────────────────┐
│   PostgreSQL        │ ───────────────▶ │   File System       │
│   app_forms.        │                  │   forms/contact.json│
│   structure (JSONB) │ ◀─────────────── └──────────┬──────────┘
└─────────────────────┘      Import               │
                                                   │ Git Commit
                                                   ▼
                                         ┌─────────────────────┐
                                         │   Git Repository    │
                                         │   .git/             │
                                         └─────────────────────┘
```

**Solution:** Bidirectional sync keeps database and Git in sync.

### File Structure Convention

```
{repository_root}/
├── .git/
├── .gitignore
├── package.json (if NPM integration enabled)
├── README.md
├── entities/
│   ├── contact.json
│   ├── account.json
│   └── opportunity.json
├── forms/
│   ├── contact-form.json
│   ├── account-form.json
│   └── lead-form.json
├── grids/
│   ├── contact-grid.json
│   └── account-grid.json
├── dashboards/
│   ├── sales-dashboard.json
│   └── analytics-dashboard.json
├── queries/
│   ├── get-contacts.json
│   └── get-revenue.json
├── apis/
│   ├── contacts-api.json
│   └── leads-api.json
├── processes/
│   ├── lead-qualification.json
│   └── opportunity-workflow.json
├── datasources/
│   ├── crm-database.json
│   └── external-api.json
└── application.json (metadata)
```

**Rationale:**
- **Clear organization** by artifact type
- **JSON format** for Git-friendly diffing
- **Human-readable** filenames
- **Consistent naming** (kebab-case)

---

## Component 1: Artifact Export Service

### 1.1 Service Definition

**File:** `src/exprsn-svr/lowcode/services/ArtifactExportService.js`

```javascript
/**
 * Artifact Export Service
 *
 * Converts database JSONB artifacts to file-based format for Git integration.
 * Supports all low-code artifact types with metadata preservation.
 */

const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const logger = require('@exprsn/shared').logger;

// Models
const Application = require('../models/Application');
const Entity = require('../models/Entity');
const AppForm = require('../models/AppForm');
const Grid = require('../models/Grid');
const Dashboard = require('../models/Dashboard');
const Query = require('../models/Query');
const API = require('../models/API');
const Process = require('../models/Process');
const DataSource = require('../models/DataSource');
const GitRepository = require('../models/GitRepository');

class ArtifactExportService {
  constructor() {
    this.gitReposPath = path.join(__dirname, '../../../../git-repositories');
  }

  /**
   * Export a single artifact to file
   * @param {String} artifactType - 'entity', 'form', 'grid', etc.
   * @param {String} artifactId - UUID of artifact
   * @param {String} repositoryId - Git repository UUID
   * @returns {Object} { success, filePath, relativePath }
   */
  async exportArtifact(artifactType, artifactId, repositoryId) {
    try {
      // Get repository
      const repository = await GitRepository.findByPk(repositoryId);
      if (!repository) {
        throw new Error(`Repository not found: ${repositoryId}`);
      }

      const repoPath = path.join(this.gitReposPath, repository.name);

      // Get artifact data
      const artifact = await this._getArtifact(artifactType, artifactId);
      if (!artifact) {
        throw new Error(`${artifactType} not found: ${artifactId}`);
      }

      // Convert to file format
      const fileData = this._convertToFileFormat(artifactType, artifact);

      // Determine file path
      const relativePath = this._getRelativePath(artifactType, artifact);
      const absolutePath = path.join(repoPath, relativePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });

      // Write file
      await fs.writeFile(
        absolutePath,
        JSON.stringify(fileData, null, 2),
        'utf8'
      );

      logger.info(`Exported ${artifactType}:${artifactId} to ${relativePath}`);

      return {
        success: true,
        filePath: absolutePath,
        relativePath,
        artifactId,
        artifactType
      };

    } catch (error) {
      logger.error(`Export failed for ${artifactType}:${artifactId}`, error);
      throw error;
    }
  }

  /**
   * Export entire application to Git repository
   * @param {String} applicationId - Application UUID
   * @param {String} repositoryId - Git repository UUID
   * @returns {Object} { success, exportedFiles, errors }
   */
  async exportApplication(applicationId, repositoryId) {
    const results = {
      success: true,
      exportedFiles: [],
      errors: []
    };

    try {
      // Get application
      const application = await Application.findByPk(applicationId);
      if (!application) {
        throw new Error(`Application not found: ${applicationId}`);
      }

      // Export application metadata
      const appResult = await this._exportApplicationMetadata(
        application,
        repositoryId
      );
      results.exportedFiles.push(appResult);

      // Export all entities
      const entities = await Entity.findAll({
        where: { applicationId }
      });
      for (const entity of entities) {
        try {
          const result = await this.exportArtifact('entity', entity.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'entity',
            artifactId: entity.id,
            error: error.message
          });
        }
      }

      // Export all forms
      const forms = await AppForm.findAll({
        where: { applicationId }
      });
      for (const form of forms) {
        try {
          const result = await this.exportArtifact('form', form.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'form',
            artifactId: form.id,
            error: error.message
          });
        }
      }

      // Export all grids
      const grids = await Grid.findAll({
        where: { applicationId }
      });
      for (const grid of grids) {
        try {
          const result = await this.exportArtifact('grid', grid.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'grid',
            artifactId: grid.id,
            error: error.message
          });
        }
      }

      // Export all dashboards
      const dashboards = await Dashboard.findAll({
        where: { applicationId }
      });
      for (const dashboard of dashboards) {
        try {
          const result = await this.exportArtifact('dashboard', dashboard.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'dashboard',
            artifactId: dashboard.id,
            error: error.message
          });
        }
      }

      // Export all queries
      const queries = await Query.findAll({
        where: { applicationId }
      });
      for (const query of queries) {
        try {
          const result = await this.exportArtifact('query', query.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'query',
            artifactId: query.id,
            error: error.message
          });
        }
      }

      // Export all APIs
      const apis = await API.findAll({
        where: { applicationId }
      });
      for (const api of apis) {
        try {
          const result = await this.exportArtifact('api', api.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'api',
            artifactId: api.id,
            error: error.message
          });
        }
      }

      // Export all processes
      const processes = await Process.findAll({
        where: { applicationId }
      });
      for (const process of processes) {
        try {
          const result = await this.exportArtifact('process', process.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'process',
            artifactId: process.id,
            error: error.message
          });
        }
      }

      // Export all data sources
      const dataSources = await DataSource.findAll({
        where: { applicationId }
      });
      for (const dataSource of dataSources) {
        try {
          const result = await this.exportArtifact('datasource', dataSource.id, repositoryId);
          results.exportedFiles.push(result);
        } catch (error) {
          results.errors.push({
            artifactType: 'datasource',
            artifactId: dataSource.id,
            error: error.message
          });
        }
      }

      logger.info(`Exported application ${applicationId}: ${results.exportedFiles.length} files, ${results.errors.length} errors`);

      return results;

    } catch (error) {
      logger.error(`Application export failed: ${applicationId}`, error);
      results.success = false;
      results.errors.push({
        artifactType: 'application',
        error: error.message
      });
      return results;
    }
  }

  /**
   * Get artifact from database by type
   * @private
   */
  async _getArtifact(artifactType, artifactId) {
    const modelMap = {
      'entity': Entity,
      'form': AppForm,
      'grid': Grid,
      'dashboard': Dashboard,
      'query': Query,
      'api': API,
      'process': Process,
      'datasource': DataSource
    };

    const Model = modelMap[artifactType];
    if (!Model) {
      throw new Error(`Unknown artifact type: ${artifactType}`);
    }

    return await Model.findByPk(artifactId);
  }

  /**
   * Convert database artifact to file format
   * @private
   */
  _convertToFileFormat(artifactType, artifact) {
    const baseFormat = {
      id: artifact.id,
      name: artifact.name,
      type: artifactType,
      version: artifact.version || '1.0.0',
      createdAt: artifact.createdAt,
      updatedAt: artifact.updatedAt,
      createdBy: artifact.createdBy,
      updatedBy: artifact.updatedBy
    };

    switch (artifactType) {
      case 'entity':
        return {
          ...baseFormat,
          tableName: artifact.tableName,
          schema: artifact.schema,
          indexes: artifact.indexes,
          relationships: artifact.relationships,
          description: artifact.description
        };

      case 'form':
        return {
          ...baseFormat,
          entityId: artifact.entityId,
          structure: artifact.structure,
          validation: artifact.validation,
          events: artifact.events,
          styling: artifact.styling,
          description: artifact.description
        };

      case 'grid':
        return {
          ...baseFormat,
          entityId: artifact.entityId,
          columns: artifact.columns,
          filters: artifact.filters,
          sorting: artifact.sorting,
          pagination: artifact.pagination,
          actions: artifact.actions
        };

      case 'dashboard':
        return {
          ...baseFormat,
          layout: artifact.layout,
          widgets: artifact.widgets,
          refreshInterval: artifact.refreshInterval,
          filters: artifact.filters
        };

      case 'query':
        return {
          ...baseFormat,
          dataSourceId: artifact.dataSourceId,
          queryConfig: artifact.queryConfig,
          parameters: artifact.parameters,
          caching: artifact.caching,
          timeout: artifact.timeout
        };

      case 'api':
        return {
          ...baseFormat,
          method: artifact.method,
          endpoint: artifact.endpoint,
          definition: artifact.definition,
          authentication: artifact.authentication,
          rateLimit: artifact.rateLimit
        };

      case 'process':
        return {
          ...baseFormat,
          processType: artifact.processType,
          definition: artifact.definition,
          triggers: artifact.triggers,
          enabled: artifact.enabled
        };

      case 'datasource':
        return {
          ...baseFormat,
          type: artifact.type,
          connectionConfig: this._sanitizeConnectionConfig(artifact.connectionConfig),
          description: artifact.description
        };

      default:
        return baseFormat;
    }
  }

  /**
   * Sanitize connection config (remove passwords, secrets)
   * @private
   */
  _sanitizeConnectionConfig(config) {
    if (!config) return config;

    const sanitized = { ...config };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'apiKey', 'secret', 'token', 'credentials'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  /**
   * Get relative file path for artifact
   * @private
   */
  _getRelativePath(artifactType, artifact) {
    const folderMap = {
      'entity': 'entities',
      'form': 'forms',
      'grid': 'grids',
      'dashboard': 'dashboards',
      'query': 'queries',
      'api': 'apis',
      'process': 'processes',
      'datasource': 'datasources'
    };

    const folder = folderMap[artifactType] || 'artifacts';
    const fileName = this._sanitizeFileName(artifact.name);

    return `${folder}/${fileName}.json`;
  }

  /**
   * Sanitize filename (convert to kebab-case, remove special chars)
   * @private
   */
  _sanitizeFileName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Export application metadata
   * @private
   */
  async _exportApplicationMetadata(application, repositoryId) {
    const repository = await GitRepository.findByPk(repositoryId);
    const repoPath = path.join(this.gitReposPath, repository.name);

    const metadata = {
      id: application.id,
      name: application.name,
      type: 'application',
      version: application.version,
      description: application.description,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      settings: application.settings,
      dependencies: application.dependencies || []
    };

    const filePath = path.join(repoPath, 'application.json');
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), 'utf8');

    return {
      success: true,
      filePath,
      relativePath: 'application.json',
      artifactType: 'application'
    };
  }

  /**
   * Generate .gitignore for repository
   */
  async generateGitignore(repositoryId) {
    const repository = await GitRepository.findByPk(repositoryId);
    const repoPath = path.join(this.gitReposPath, repository.name);

    const gitignoreContent = `# Exprsn Low-Code Platform
# Generated automatically

# Node modules (if NPM enabled)
node_modules/
package-lock.json

# Environment files
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# Temporary files
.tmp/
temp/
*.tmp

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs (if applicable)
dist/
build/
.cache/
`;

    const filePath = path.join(repoPath, '.gitignore');
    await fs.writeFile(filePath, gitignoreContent, 'utf8');

    return { success: true, filePath };
  }

  /**
   * Generate README for repository
   */
  async generateReadme(repositoryId, applicationId) {
    const repository = await GitRepository.findByPk(repositoryId);
    const application = await Application.findByPk(applicationId);
    const repoPath = path.join(this.gitReposPath, repository.name);

    const readmeContent = `# ${application.name}

${application.description || 'Low-code application built with Exprsn Platform'}

## Application Info

- **Version:** ${application.version}
- **Created:** ${application.createdAt}
- **Last Updated:** ${application.updatedAt}

## Structure

- \`entities/\` - Data models and database schemas
- \`forms/\` - Form definitions and layouts
- \`grids/\` - Grid/table configurations
- \`dashboards/\` - Dashboard layouts
- \`queries/\` - Database queries
- \`apis/\` - API endpoint definitions
- \`processes/\` - Business process workflows
- \`datasources/\` - Data source connections

## Development

This application is managed by Exprsn Low-Code Platform.

### Importing Changes

To import changes from this repository back to the platform:

1. Commit your changes to Git
2. Open the application in Exprsn Low-Code Platform
3. Click "Git" → "Pull Changes"
4. Review and accept the import

### Deploying

Deploy this application using the CI/CD pipeline configured in the Git settings.

---

*Generated by Exprsn Low-Code Platform*
`;

    const filePath = path.join(repoPath, 'README.md');
    await fs.writeFile(filePath, readmeContent, 'utf8');

    return { success: true, filePath };
  }
}

module.exports = new ArtifactExportService();
```

### 1.2 API Routes

**File:** `src/exprsn-svr/lowcode/routes/artifactExport.js`

```javascript
const express = require('express');
const router = express.Router();
const { validateCAToken, requirePermissions, asyncHandler } = require('@exprsn/shared');
const ArtifactExportService = require('../services/ArtifactExportService');

/**
 * Export single artifact to Git repository
 * POST /lowcode/api/artifacts/export
 */
router.post('/export',
  validateCAToken,
  requirePermissions({ write: true }),
  asyncHandler(async (req, res) => {
    const { artifactType, artifactId, repositoryId } = req.body;

    if (!artifactType || !artifactId || !repositoryId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'artifactType, artifactId, and repositoryId are required'
      });
    }

    const result = await ArtifactExportService.exportArtifact(
      artifactType,
      artifactId,
      repositoryId
    );

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * Export entire application to Git repository
 * POST /lowcode/api/artifacts/export-application
 */
router.post('/export-application',
  validateCAToken,
  requirePermissions({ write: true }),
  asyncHandler(async (req, res) => {
    const { applicationId, repositoryId } = req.body;

    if (!applicationId || !repositoryId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'applicationId and repositoryId are required'
      });
    }

    const result = await ArtifactExportService.exportApplication(
      applicationId,
      repositoryId
    );

    res.json({
      success: result.success,
      data: {
        exportedFiles: result.exportedFiles.length,
        errors: result.errors.length,
        files: result.exportedFiles,
        errorDetails: result.errors
      }
    });
  })
);

/**
 * Generate repository files (.gitignore, README)
 * POST /lowcode/api/artifacts/generate-repo-files
 */
router.post('/generate-repo-files',
  validateCAToken,
  requirePermissions({ write: true }),
  asyncHandler(async (req, res) => {
    const { repositoryId, applicationId } = req.body;

    const results = {};

    results.gitignore = await ArtifactExportService.generateGitignore(repositoryId);
    results.readme = await ArtifactExportService.generateReadme(repositoryId, applicationId);

    res.json({
      success: true,
      data: results
    });
  })
);

module.exports = router;
```

---

## Component 2: Artifact Import Service

### 2.1 Service Definition

**File:** `src/exprsn-svr/lowcode/services/ArtifactImportService.js`

```javascript
/**
 * Artifact Import Service
 *
 * Imports file-based artifacts from Git repository back into database.
 * Handles conflict detection and merge strategies.
 */

const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const logger = require('@exprsn/shared').logger;

// Models
const Application = require('../models/Application');
const Entity = require('../models/Entity');
const AppForm = require('../models/AppForm');
const Grid = require('../models/Grid');
const Dashboard = require('../models/Dashboard');
const Query = require('../models/Query');
const API = require('../models/API');
const Process = require('../models/Process');
const DataSource = require('../models/DataSource');
const GitRepository = require('../models/GitRepository');

class ArtifactImportService {
  constructor() {
    this.gitReposPath = path.join(__dirname, '../../../../git-repositories');
  }

  /**
   * Import single artifact from file to database
   * @param {String} repositoryId - Git repository UUID
   * @param {String} relativePath - Path to artifact file (e.g., 'forms/contact-form.json')
   * @param {Object} options - { overwrite: boolean, createNew: boolean }
   * @returns {Object} { success, artifact, conflict }
   */
  async importArtifact(repositoryId, relativePath, options = {}) {
    const { overwrite = false, createNew = false } = options;

    try {
      // Get repository
      const repository = await GitRepository.findByPk(repositoryId);
      if (!repository) {
        throw new Error(`Repository not found: ${repositoryId}`);
      }

      const repoPath = path.join(this.gitReposPath, repository.name);
      const filePath = path.join(repoPath, relativePath);

      // Read file
      const fileContent = await fs.readFile(filePath, 'utf8');
      const fileData = JSON.parse(fileContent);

      // Detect artifact type from path or data
      const artifactType = this._detectArtifactType(relativePath, fileData);

      // Check for existing artifact
      const existing = await this._findExistingArtifact(artifactType, fileData.id);

      // Conflict detection
      if (existing && !overwrite && !createNew) {
        const conflict = await this._detectConflict(existing, fileData);
        if (conflict.hasConflict) {
          return {
            success: false,
            conflict: true,
            conflictDetails: conflict,
            artifact: existing
          };
        }
      }

      // Import artifact
      let artifact;
      if (createNew || !existing) {
        artifact = await this._createArtifact(artifactType, fileData);
      } else {
        artifact = await this._updateArtifact(artifactType, existing, fileData);
      }

      logger.info(`Imported ${artifactType} from ${relativePath}`);

      return {
        success: true,
        artifact,
        created: !existing,
        updated: !!existing
      };

    } catch (error) {
      logger.error(`Import failed for ${relativePath}`, error);
      throw error;
    }
  }

  /**
   * Import entire application from Git repository
   * @param {String} repositoryId - Git repository UUID
   * @param {String} applicationId - Target application UUID (optional, creates new if not provided)
   * @param {Object} options - { overwrite: boolean }
   * @returns {Object} { success, importedArtifacts, conflicts, errors }
   */
  async importApplication(repositoryId, applicationId = null, options = {}) {
    const { overwrite = false } = options;

    const results = {
      success: true,
      importedArtifacts: [],
      conflicts: [],
      errors: []
    };

    try {
      const repository = await GitRepository.findByPk(repositoryId);
      if (!repository) {
        throw new Error(`Repository not found: ${repositoryId}`);
      }

      const repoPath = path.join(this.gitReposPath, repository.name);

      // Import application metadata
      const appMetadataPath = path.join(repoPath, 'application.json');
      const appMetadata = JSON.parse(await fs.readFile(appMetadataPath, 'utf8'));

      let application;
      if (applicationId) {
        application = await Application.findByPk(applicationId);
        await application.update({
          name: appMetadata.name,
          description: appMetadata.description,
          version: appMetadata.version,
          settings: appMetadata.settings
        });
      } else {
        application = await Application.create({
          name: appMetadata.name,
          description: appMetadata.description,
          version: appMetadata.version,
          settings: appMetadata.settings,
          gitRepository: repository.remoteUrl || repository.name,
          gitBranch: 'main'
        });
      }

      // Import artifacts by type
      const artifactFolders = [
        'entities',
        'forms',
        'grids',
        'dashboards',
        'queries',
        'apis',
        'processes',
        'datasources'
      ];

      for (const folder of artifactFolders) {
        const folderPath = path.join(repoPath, folder);

        try {
          const files = await fs.readdir(folderPath);

          for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const relativePath = `${folder}/${file}`;

            try {
              const result = await this.importArtifact(
                repositoryId,
                relativePath,
                { overwrite, applicationId: application.id }
              );

              if (result.conflict) {
                results.conflicts.push({
                  relativePath,
                  conflictDetails: result.conflictDetails
                });
              } else {
                results.importedArtifacts.push({
                  relativePath,
                  artifactId: result.artifact.id,
                  artifactType: result.artifact.type || folder.slice(0, -1),
                  created: result.created,
                  updated: result.updated
                });
              }

            } catch (error) {
              results.errors.push({
                relativePath,
                error: error.message
              });
            }
          }

        } catch (error) {
          // Folder doesn't exist, skip
          if (error.code !== 'ENOENT') {
            results.errors.push({
              folder,
              error: error.message
            });
          }
        }
      }

      logger.info(`Imported application: ${results.importedArtifacts.length} artifacts, ${results.conflicts.length} conflicts, ${results.errors.length} errors`);

      return results;

    } catch (error) {
      logger.error(`Application import failed`, error);
      results.success = false;
      results.errors.push({
        type: 'application',
        error: error.message
      });
      return results;
    }
  }

  /**
   * Detect artifact type from path or file data
   * @private
   */
  _detectArtifactType(relativePath, fileData) {
    // Try from file data first
    if (fileData.type) {
      return fileData.type;
    }

    // Detect from path
    const folderMap = {
      'entities': 'entity',
      'forms': 'form',
      'grids': 'grid',
      'dashboards': 'dashboard',
      'queries': 'query',
      'apis': 'api',
      'processes': 'process',
      'datasources': 'datasource'
    };

    const folder = relativePath.split('/')[0];
    return folderMap[folder] || 'unknown';
  }

  /**
   * Find existing artifact in database
   * @private
   */
  async _findExistingArtifact(artifactType, artifactId) {
    const modelMap = {
      'entity': Entity,
      'form': AppForm,
      'grid': Grid,
      'dashboard': Dashboard,
      'query': Query,
      'api': API,
      'process': Process,
      'datasource': DataSource
    };

    const Model = modelMap[artifactType];
    if (!Model) {
      throw new Error(`Unknown artifact type: ${artifactType}`);
    }

    return await Model.findByPk(artifactId);
  }

  /**
   * Detect conflicts between existing and file data
   * @private
   */
  async _detectConflict(existing, fileData) {
    const conflict = {
      hasConflict: false,
      type: null,
      existingVersion: existing.version,
      fileVersion: fileData.version,
      existingUpdatedAt: existing.updatedAt,
      fileUpdatedAt: new Date(fileData.updatedAt)
    };

    // Version conflict
    if (existing.version !== fileData.version) {
      conflict.hasConflict = true;
      conflict.type = 'version_mismatch';
      return conflict;
    }

    // Timestamp conflict (file is older than database)
    const existingTime = new Date(existing.updatedAt).getTime();
    const fileTime = new Date(fileData.updatedAt).getTime();

    if (fileTime < existingTime) {
      conflict.hasConflict = true;
      conflict.type = 'database_newer';
      return conflict;
    }

    return conflict;
  }

  /**
   * Create new artifact in database
   * @private
   */
  async _createArtifact(artifactType, fileData) {
    const modelMap = {
      'entity': Entity,
      'form': AppForm,
      'grid': Grid,
      'dashboard': Dashboard,
      'query': Query,
      'api': API,
      'process': Process,
      'datasource': DataSource
    };

    const Model = modelMap[artifactType];
    if (!Model) {
      throw new Error(`Unknown artifact type: ${artifactType}`);
    }

    // Convert file data to database format
    const dbData = this._convertFromFileFormat(artifactType, fileData);

    return await Model.create(dbData);
  }

  /**
   * Update existing artifact in database
   * @private
   */
  async _updateArtifact(artifactType, existing, fileData) {
    const dbData = this._convertFromFileFormat(artifactType, fileData);
    await existing.update(dbData);
    return existing;
  }

  /**
   * Convert file format to database format
   * @private
   */
  _convertFromFileFormat(artifactType, fileData) {
    // Remove metadata fields that shouldn't be updated
    const { id, createdAt, ...data } = fileData;

    return data;
  }
}

module.exports = new ArtifactImportService();
```

### 2.2 API Routes

**File:** `src/exprsn-svr/lowcode/routes/artifactImport.js`

```javascript
const express = require('express');
const router = express.Router();
const { validateCAToken, requirePermissions, asyncHandler } = require('@exprsn/shared');
const ArtifactImportService = require('../services/ArtifactImportService');

/**
 * Import single artifact from Git repository
 * POST /lowcode/api/artifacts/import
 */
router.post('/import',
  validateCAToken,
  requirePermissions({ write: true }),
  asyncHandler(async (req, res) => {
    const { repositoryId, relativePath, overwrite, createNew } = req.body;

    if (!repositoryId || !relativePath) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'repositoryId and relativePath are required'
      });
    }

    const result = await ArtifactImportService.importArtifact(
      repositoryId,
      relativePath,
      { overwrite, createNew }
    );

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'Artifact has conflicts',
        data: result
      });
    }

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * Import entire application from Git repository
 * POST /lowcode/api/artifacts/import-application
 */
router.post('/import-application',
  validateCAToken,
  requirePermissions({ write: true }),
  asyncHandler(async (req, res) => {
    const { repositoryId, applicationId, overwrite } = req.body;

    if (!repositoryId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'repositoryId is required'
      });
    }

    const result = await ArtifactImportService.importApplication(
      repositoryId,
      applicationId,
      { overwrite }
    );

    res.json({
      success: result.success,
      data: {
        importedArtifacts: result.importedArtifacts.length,
        conflicts: result.conflicts.length,
        errors: result.errors.length,
        artifacts: result.importedArtifacts,
        conflictDetails: result.conflicts,
        errorDetails: result.errors
      }
    });
  })
);

module.exports = router;
```

---

## Component 3: Git Toolbar Component

### 3.1 Shared Toolbar HTML

**File:** `src/exprsn-svr/lowcode/views/partials/git-toolbar.ejs`

```html
<!-- Git Toolbar Component -->
<div class="git-toolbar">
  <div class="git-toolbar-inner">
    <!-- Repository Info -->
    <div class="git-repo-info">
      <i class="fab fa-git-alt"></i>
      <span id="repo-name">Not connected</span>
    </div>

    <!-- Branch Selector -->
    <div class="git-branch-selector">
      <select id="git-branch-select" class="form-select form-select-sm" disabled>
        <option value="">Select branch...</option>
      </select>
      <button id="git-new-branch" class="btn btn-sm btn-outline-primary" disabled>
        <i class="fas fa-code-branch"></i> New
      </button>
    </div>

    <!-- Status Indicator -->
    <div class="git-status" id="git-status">
      <span class="badge bg-secondary">Not tracked</span>
    </div>

    <!-- Actions -->
    <div class="git-actions">
      <button id="git-commit" class="btn btn-sm btn-success" disabled>
        <i class="fas fa-save"></i> Commit
      </button>
      <button id="git-history" class="btn btn-sm btn-info" disabled>
        <i class="fas fa-history"></i> History
      </button>
      <button id="git-diff" class="btn btn-sm btn-warning" disabled>
        <i class="fas fa-code-compare"></i> Diff
      </button>
      <button id="git-push" class="btn btn-sm btn-primary" disabled>
        <i class="fas fa-upload"></i> Push
      </button>
      <button id="git-pull" class="btn btn-sm btn-primary" disabled>
        <i class="fas fa-download"></i> Pull
      </button>
    </div>

    <!-- Settings -->
    <div class="git-settings">
      <button id="git-config" class="btn btn-sm btn-outline-secondary">
        <i class="fas fa-cog"></i>
      </button>
    </div>
  </div>
</div>

<!-- Git Commit Modal -->
<div class="modal fade" id="gitCommitModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Commit Changes</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="commit-message" class="form-label">Commit Message</label>
          <input type="text" class="form-control" id="commit-message" placeholder="e.g., Updated contact form validation">
        </div>
        <div class="mb-3">
          <label for="commit-description" class="form-label">Description (optional)</label>
          <textarea class="form-control" id="commit-description" rows="3" placeholder="Additional details about the changes..."></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Changed Files</label>
          <div id="commit-file-list" class="file-list">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-success" id="confirm-commit">
          <i class="fas fa-save"></i> Commit
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Git Config Modal -->
<div class="modal fade" id="gitConfigModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Git Configuration</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="git-repository-select" class="form-label">Git Repository</label>
          <select class="form-select" id="git-repository-select">
            <option value="">Select repository...</option>
          </select>
        </div>
        <div class="mb-3">
          <button class="btn btn-primary" id="git-connect-repo">
            <i class="fas fa-link"></i> Connect Repository
          </button>
          <button class="btn btn-success" id="git-create-repo">
            <i class="fas fa-plus"></i> Create New Repository
          </button>
        </div>
        <div class="mb-3">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="auto-commit-check">
            <label class="form-check-label" for="auto-commit-check">
              Auto-commit on save
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="auto-push-check">
            <label class="form-check-label" for="auto-push-check">
              Auto-push commits
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" id="save-git-config">
          <i class="fas fa-save"></i> Save Configuration
        </button>
      </div>
    </div>
  </div>
</div>

<style>
.git-toolbar {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.git-toolbar-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.git-repo-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.git-repo-info i {
  font-size: 1.2rem;
  color: #f34f29; /* Git orange */
}

.git-branch-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.git-branch-selector select {
  min-width: 150px;
}

.git-status {
  margin-left: auto;
}

.git-status .badge {
  font-size: 0.875rem;
}

.git-status .badge.bg-warning {
  color: #000;
}

.git-actions {
  display: flex;
  gap: 0.5rem;
}

.file-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.file-list-item {
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
}

.file-list-item:last-child {
  border-bottom: none;
}

.file-list-item i {
  margin-right: 0.5rem;
}

.file-status-added {
  color: #28a745;
}

.file-status-modified {
  color: #ffc107;
}

.file-status-deleted {
  color: #dc3545;
}
</style>

<script>
// Git Toolbar JavaScript
class GitToolbar {
  constructor(artifactType, artifactId) {
    this.artifactType = artifactType;
    this.artifactId = artifactId;
    this.repositoryId = null;
    this.currentBranch = null;
    this.autoCommit = false;
    this.autoPush = false;

    this.init();
  }

  async init() {
    // Load Git configuration for this artifact
    await this.loadGitConfig();

    // Set up event listeners
    this.setupEventListeners();

    // Check Git status
    if (this.repositoryId) {
      await this.updateStatus();
    }
  }

  setupEventListeners() {
    // Branch selector
    document.getElementById('git-branch-select')?.addEventListener('change', async (e) => {
      await this.switchBranch(e.target.value);
    });

    // New branch
    document.getElementById('git-new-branch')?.addEventListener('click', async () => {
      await this.createBranch();
    });

    // Commit
    document.getElementById('git-commit')?.addEventListener('click', async () => {
      await this.showCommitModal();
    });

    // Confirm commit
    document.getElementById('confirm-commit')?.addEventListener('click', async () => {
      await this.commit();
    });

    // History
    document.getElementById('git-history')?.addEventListener('click', async () => {
      await this.showHistory();
    });

    // Diff
    document.getElementById('git-diff')?.addEventListener('click', async () => {
      await this.showDiff();
    });

    // Push
    document.getElementById('git-push')?.addEventListener('click', async () => {
      await this.push();
    });

    // Pull
    document.getElementById('git-pull')?.addEventListener('click', async () => {
      await this.pull();
    });

    // Config
    document.getElementById('git-config')?.addEventListener('click', async () => {
      await this.showConfigModal();
    });

    // Connect repository
    document.getElementById('git-connect-repo')?.addEventListener('click', async () => {
      await this.connectRepository();
    });

    // Save config
    document.getElementById('save-git-config')?.addEventListener('click', async () => {
      await this.saveConfig();
    });
  }

  async loadGitConfig() {
    try {
      const response = await fetch(`/lowcode/api/git/artifact-config?artifactType=${this.artifactType}&artifactId=${this.artifactId}`);
      const data = await response.json();

      if (data.success && data.data.repositoryId) {
        this.repositoryId = data.data.repositoryId;
        this.currentBranch = data.data.branch;
        this.autoCommit = data.data.autoCommit;
        this.autoPush = data.data.autoPush;

        await this.loadRepositoryInfo();
        this.enableToolbar();
      }
    } catch (error) {
      console.error('Failed to load Git config:', error);
    }
  }

  async loadRepositoryInfo() {
    try {
      const response = await fetch(`/lowcode/api/git/repositories/${this.repositoryId}`);
      const data = await response.json();

      if (data.success) {
        document.getElementById('repo-name').textContent = data.data.name;
        await this.loadBranches();
      }
    } catch (error) {
      console.error('Failed to load repository info:', error);
    }
  }

  async loadBranches() {
    try {
      const response = await fetch(`/lowcode/api/git/repositories/${this.repositoryId}/branches`);
      const data = await response.json();

      if (data.success) {
        const select = document.getElementById('git-branch-select');
        select.innerHTML = '';

        data.data.forEach(branch => {
          const option = document.createElement('option');
          option.value = branch.name;
          option.textContent = branch.name;
          option.selected = branch.name === this.currentBranch;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  }

  async updateStatus() {
    try {
      const response = await fetch(`/lowcode/api/git/artifact-status?artifactType=${this.artifactType}&artifactId=${this.artifactId}&repositoryId=${this.repositoryId}`);
      const data = await response.json();

      if (data.success) {
        const statusBadge = document.querySelector('#git-status .badge');

        if (data.data.modified) {
          statusBadge.className = 'badge bg-warning';
          statusBadge.textContent = 'Modified';
        } else if (data.data.committed) {
          statusBadge.className = 'badge bg-success';
          statusBadge.textContent = 'Up to date';
        } else {
          statusBadge.className = 'badge bg-secondary';
          statusBadge.textContent = 'Not committed';
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  enableToolbar() {
    document.getElementById('git-branch-select').disabled = false;
    document.getElementById('git-new-branch').disabled = false;
    document.getElementById('git-commit').disabled = false;
    document.getElementById('git-history').disabled = false;
    document.getElementById('git-diff').disabled = false;
    document.getElementById('git-push').disabled = false;
    document.getElementById('git-pull').disabled = false;
  }

  async showCommitModal() {
    // Get changed files
    const response = await fetch(`/lowcode/api/git/artifact-changes?artifactType=${this.artifactType}&artifactId=${this.artifactId}&repositoryId=${this.repositoryId}`);
    const data = await response.json();

    if (data.success) {
      const fileList = document.getElementById('commit-file-list');
      fileList.innerHTML = '';

      data.data.files.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-list-item';
        item.innerHTML = `
          <i class="fas fa-file file-status-${file.status}"></i>
          <span>${file.path}</span>
        `;
        fileList.appendChild(item);
      });

      const modal = new bootstrap.Modal(document.getElementById('gitCommitModal'));
      modal.show();
    }
  }

  async commit() {
    const message = document.getElementById('commit-message').value;
    const description = document.getElementById('commit-description').value;

    if (!message) {
      alert('Commit message is required');
      return;
    }

    try {
      // Export artifact to file
      await fetch('/lowcode/api/artifacts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: this.artifactType,
          artifactId: this.artifactId,
          repositoryId: this.repositoryId
        })
      });

      // Create commit
      const response = await fetch('/lowcode/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryId: this.repositoryId,
          branch: this.currentBranch,
          message,
          description,
          artifactType: this.artifactType,
          artifactId: this.artifactId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('gitCommitModal'));
        modal.hide();

        // Update status
        await this.updateStatus();

        // Show success
        this.showNotification('Commit created successfully', 'success');

        // Auto-push if enabled
        if (this.autoPush) {
          await this.push();
        }
      } else {
        this.showNotification('Commit failed: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Commit failed:', error);
      this.showNotification('Commit failed', 'error');
    }
  }

  async push() {
    try {
      const response = await fetch('/lowcode/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryId: this.repositoryId,
          branch: this.currentBranch
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification('Pushed to remote successfully', 'success');
      } else {
        this.showNotification('Push failed: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Push failed:', error);
      this.showNotification('Push failed', 'error');
    }
  }

  async pull() {
    try {
      const response = await fetch('/lowcode/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryId: this.repositoryId,
          branch: this.currentBranch
        })
      });

      const data = await response.json();

      if (data.success) {
        // Import changes
        await fetch('/lowcode/api/artifacts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repositoryId: this.repositoryId,
            relativePath: data.data.changedFiles[0], // Handle multiple files
            overwrite: true
          })
        });

        this.showNotification('Pulled changes successfully', 'success');

        // Reload page to show changes
        location.reload();
      } else {
        this.showNotification('Pull failed: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Pull failed:', error);
      this.showNotification('Pull failed', 'error');
    }
  }

  async showHistory() {
    // Redirect to history page
    window.location.href = `/lowcode/git-history?artifactType=${this.artifactType}&artifactId=${this.artifactId}&repositoryId=${this.repositoryId}`;
  }

  async showDiff() {
    // Redirect to diff page
    window.location.href = `/lowcode/git-diff?artifactType=${this.artifactType}&artifactId=${this.artifactId}&repositoryId=${this.repositoryId}`;
  }

  async showConfigModal() {
    // Load repositories
    const response = await fetch('/lowcode/api/git/repositories');
    const data = await response.json();

    if (data.success) {
      const select = document.getElementById('git-repository-select');
      select.innerHTML = '<option value="">Select repository...</option>';

      data.data.forEach(repo => {
        const option = document.createElement('option');
        option.value = repo.id;
        option.textContent = repo.name;
        option.selected = repo.id === this.repositoryId;
        select.appendChild(option);
      });
    }

    // Set checkboxes
    document.getElementById('auto-commit-check').checked = this.autoCommit;
    document.getElementById('auto-push-check').checked = this.autoPush;

    const modal = new bootstrap.Modal(document.getElementById('gitConfigModal'));
    modal.show();
  }

  async connectRepository() {
    const repositoryId = document.getElementById('git-repository-select').value;

    if (!repositoryId) {
      alert('Please select a repository');
      return;
    }

    try {
      const response = await fetch('/lowcode/api/git/connect-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: this.artifactType,
          artifactId: this.artifactId,
          repositoryId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.repositoryId = repositoryId;
        this.currentBranch = 'main';

        await this.loadRepositoryInfo();
        this.enableToolbar();

        this.showNotification('Repository connected successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to connect repository:', error);
      this.showNotification('Failed to connect repository', 'error');
    }
  }

  async saveConfig() {
    this.autoCommit = document.getElementById('auto-commit-check').checked;
    this.autoPush = document.getElementById('auto-push-check').checked;

    try {
      const response = await fetch('/lowcode/api/git/save-artifact-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: this.artifactType,
          artifactId: this.artifactId,
          autoCommit: this.autoCommit,
          autoPush: this.autoPush
        })
      });

      const data = await response.json();

      if (data.success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('gitConfigModal'));
        modal.hide();

        this.showNotification('Configuration saved', 'success');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      this.showNotification('Failed to save configuration', 'error');
    }
  }

  showNotification(message, type) {
    // You can use toastr, bootstrap toast, or custom notification
    console.log(`[${type}] ${message}`);

    // Simple alert for now (replace with better UI)
    if (type === 'success') {
      alert(message);
    } else {
      alert('Error: ' + message);
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // This will be customized per page with artifact type and ID
  // Example: window.gitToolbar = new GitToolbar('form', '<%=form.id%>');
});
</script>
```

### 3.2 Integration into Designers

**Example: Form Designer Pro**

Edit `src/exprsn-svr/lowcode/views/form-designer-pro.ejs`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Existing head content -->
</head>
<body>
  <!-- Add Git Toolbar BEFORE existing content -->
  <%- include('partials/git-toolbar') %>

  <!-- Existing form designer content -->
  <div class="container-fluid">
    <!-- Form designer UI -->
  </div>

  <script>
    // Initialize Git toolbar for this form
    const formId = '<%= form ? form.id : "" %>';
    if (formId) {
      window.gitToolbar = new GitToolbar('form', formId);

      // Hook into save functionality
      const originalSave = window.saveForm;
      window.saveForm = async function() {
        await originalSave.call(this);

        // Auto-commit if enabled
        if (window.gitToolbar && window.gitToolbar.autoCommit) {
          await window.gitToolbar.commit();
        }
      };
    }
  </script>
</body>
</html>
```

Repeat this pattern for all 19 designers.

---

## Component 4: Visual Diff Viewer

**File:** `src/exprsn-svr/lowcode/views/git-diff.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Git Diff Viewer</title>
  <!-- Include Monaco Diff Editor -->
  <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #diff-container { height: 100vh; width: 100%; }
    .diff-header {
      background: #f8f9fa;
      padding: 1rem;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .diff-info { font-weight: 500; }
    .diff-actions { display: flex; gap: 0.5rem; }
  </style>
</head>
<body>
  <div class="diff-header">
    <div class="diff-info">
      <span id="artifact-name">Loading...</span>
      <span class="text-muted" id="comparison-info"></span>
    </div>
    <div class="diff-actions">
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
      <button class="btn btn-success" onclick="acceptChanges()">Accept File Changes</button>
      <button class="btn btn-primary" onclick="keepDatabase()">Keep Database Version</button>
    </div>
  </div>
  <div id="diff-container"></div>

  <script>
    // Get query parameters
    const params = new URLSearchParams(window.location.search);
    const artifactType = params.get('artifactType');
    const artifactId = params.get('artifactId');
    const repositoryId = params.get('repositoryId');

    let diffEditor;

    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], function() {
      loadDiff();
    });

    async function loadDiff() {
      try {
        // Get database version
        const dbResponse = await fetch(`/lowcode/api/artifacts/${artifactType}/${artifactId}`);
        const dbData = await dbResponse.json();

        // Get file version
        const fileResponse = await fetch(`/lowcode/api/git/artifact-file?artifactType=${artifactType}&artifactId=${artifactId}&repositoryId=${repositoryId}`);
        const fileData = await fileResponse.json();

        // Update header
        document.getElementById('artifact-name').textContent = dbData.data.name;
        document.getElementById('comparison-info').textContent = `Database vs. Git (${fileData.data.branch})`;

        // Create diff editor
        diffEditor = monaco.editor.createDiffEditor(document.getElementById('diff-container'), {
          enableSplitViewResizing: true,
          renderSideBySide: true,
          readOnly: true,
          automaticLayout: true
        });

        // Set models
        const originalModel = monaco.editor.createModel(
          JSON.stringify(dbData.data, null, 2),
          'json'
        );

        const modifiedModel = monaco.editor.createModel(
          JSON.stringify(fileData.data, null, 2),
          'json'
        );

        diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
        });

      } catch (error) {
        console.error('Failed to load diff:', error);
        alert('Failed to load diff');
      }
    }

    async function acceptChanges() {
      if (confirm('Accept changes from Git? This will overwrite the database version.')) {
        const response = await fetch('/lowcode/api/artifacts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repositoryId,
            artifactType,
            artifactId,
            overwrite: true
          })
        });

        const data = await response.json();
        if (data.success) {
          alert('Changes accepted successfully');
          window.close();
        }
      }
    }

    async function keepDatabase() {
      if (confirm('Export database version to Git? This will overwrite the file version.')) {
        const response = await fetch('/lowcode/api/artifacts/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artifactType,
            artifactId,
            repositoryId
          })
        });

        const data = await response.json();
        if (data.success) {
          // Auto-commit
          await fetch('/lowcode/api/git/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repositoryId,
              branch: 'main', // Get from current branch
              message: `Reverted ${artifactType} to database version`,
              artifactType,
              artifactId
            })
          });

          alert('Database version saved to Git');
          window.close();
        }
      }
    }
  </script>
</body>
</html>
```

---

## Testing Strategy

### Unit Tests

**File:** `src/exprsn-svr/lowcode/tests/ArtifactExportService.test.js`

```javascript
const ArtifactExportService = require('../services/ArtifactExportService');
const AppForm = require('../models/AppForm');
const GitRepository = require('../models/GitRepository');

describe('ArtifactExportService', () => {
  let testForm, testRepository;

  beforeAll(async () => {
    // Create test repository
    testRepository = await GitRepository.create({
      name: 'test-repo',
      description: 'Test repository',
      type: 'local'
    });

    // Create test form
    testForm = await AppForm.create({
      name: 'Test Form',
      structure: {
        components: [
          { type: 'text', label: 'Name', field: 'name' }
        ]
      },
      applicationId: 'test-app-id'
    });
  });

  afterAll(async () => {
    await testForm.destroy();
    await testRepository.destroy();
  });

  test('exports form to file', async () => {
    const result = await ArtifactExportService.exportArtifact(
      'form',
      testForm.id,
      testRepository.id
    );

    expect(result.success).toBe(true);
    expect(result.relativePath).toContain('forms/');
    expect(result.relativePath).toContain('.json');
  });

  test('converts form to file format correctly', async () => {
    const fileData = ArtifactExportService._convertToFileFormat('form', testForm);

    expect(fileData.id).toBe(testForm.id);
    expect(fileData.name).toBe(testForm.name);
    expect(fileData.structure).toEqual(testForm.structure);
  });

  test('sanitizes filename', async () => {
    const form = await AppForm.create({
      name: 'My Test Form!@#',
      structure: {},
      applicationId: 'test-app-id'
    });

    const result = await ArtifactExportService.exportArtifact(
      'form',
      form.id,
      testRepository.id
    );

    expect(result.relativePath).toBe('forms/my-test-form.json');

    await form.destroy();
  });
});
```

---

## Deployment Plan

### Phase 1.1: Foundation (Week 1)
- ✅ Create ArtifactExportService
- ✅ Create export API routes
- ✅ Add export tests
- ✅ Document export format

### Phase 1.2: Import (Week 1-2)
- ✅ Create ArtifactImportService
- ✅ Create import API routes
- ✅ Add conflict detection
- ✅ Add import tests

### Phase 1.3: UI Integration (Week 2)
- ✅ Create Git toolbar component
- ✅ Integrate toolbar into Form Designer Pro
- ✅ Integrate toolbar into Entity Designer Pro
- ✅ Add commit/push/pull functionality

### Phase 1.4: Visual Diff (Week 2-3)
- ✅ Create diff viewer page
- ✅ Integrate Monaco Diff Editor
- ✅ Add accept/reject actions
- ✅ Test diff scenarios

### Phase 1.5: Rollout (Week 3)
- ✅ Integrate Git toolbar into remaining 17 designers
- ✅ End-to-end testing
- ✅ Documentation
- ✅ User training materials

---

## Next Steps

1. **Review this guide** with development team
2. **Create feature branch** for Git integration
3. **Implement Phase 1.1** (ArtifactExportService)
4. **Test export functionality** with real artifacts
5. **Proceed to Phase 1.2** (ArtifactImportService)
6. **Iterate** based on feedback

---

**Status:** Ready for implementation
**Priority:** 🔴 CRITICAL
**Estimated Effort:** 2-3 weeks (1 developer)
**Dependencies:** Git infrastructure (already complete)

---

*Document Version: 1.0*
*Last Updated: December 28, 2024*
