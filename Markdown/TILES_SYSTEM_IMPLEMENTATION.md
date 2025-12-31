# Business Hub Tiles System Implementation

**Status:** ✅ Complete
**Date:** December 26, 2024
**Service:** exprsn-svr (Business Hub)

---

## Overview

Successfully implemented a comprehensive database-backed tile management system for the Exprsn Business Operations Hub. This system moves tiles from hardcoded UI elements to dynamic, configurable database records that support per-application customization and role-based access control.

## Architecture

### Database Schema

#### Tables Created
1. **`tiles`** - Master tile definitions
2. **`application_tiles`** - Per-application tile customization

#### Key Features
- ✅ 20 pre-configured tiles representing all Business Hub designers and tools
- ✅ Category-based organization (7 categories)
- ✅ Permission-based access control
- ✅ Per-application tile customization (enable/disable, custom names, icons, ordering)
- ✅ Badge system (NEW, ENHANCED, custom badges)
- ✅ Icon gradient support
- ✅ Route templates with {appId} placeholder support

---

## Complete Tile Inventory

### 📊 Total: 20 Tiles

### By Category:

#### 📁 Data (2 tiles)
1. **Data Entities** ⭐ ENHANCED
   - Key: `entities`
   - Route: `/lowcode/entity-designer-pro?appId={appId}`
   - Badge: "13 Features"
   - Permissions: `entities.view`, `entities.create`

2. **Visual Queries** 🆕 NEW
   - Key: `queries`
   - Route: `/lowcode/queries?appId={appId}`
   - Badge: "10 Datasources"
   - Permissions: `queries.view`, `queries.create`

#### 🎨 Design (5 tiles)
3. **Forms**
   - Key: `forms`
   - Route: `/lowcode/forms?appId={appId}`
   - 27 components available

4. **Data Grids**
   - Key: `grids`
   - Route: `/lowcode/grids?appId={appId}`

5. **Application Flows** 🆕 NEW
   - Key: `flows`
   - Route: `/lowcode/app-flow-designer?appId={appId}`

6. **Reusable Cards**
   - Key: `cards`
   - Route: `/lowcode/cards?appId={appId}`

7. **Polls & Surveys**
   - Key: `polls`
   - Route: `/lowcode/polls?appId={appId}`

#### ⚙️ Automation (4 tiles)
8. **BPMN Processes**
   - Key: `processes`
   - Route: `/lowcode/process-designer?appId={appId}`

9. **Visual Workflows**
   - Key: `workflows`
   - Route: `/lowcode/workflow-designer?appId={appId}`
   - Exprsn-Kicks integration

10. **Decision Tables**
    - Key: `decisions`
    - Route: `/lowcode/decision-designer?appId={appId}`
    - 16 operators, 5 hit policies

11. **Automation Rules**
    - Key: `automation`
    - Route: `/lowcode/automation?appId={appId}`

#### 🔌 Integration (3 tiles)
12. **Plugins & Extensions**
    - Key: `plugins`
    - Route: `/lowcode/plugins?appId={appId}`

13. **Data Sources**
    - Key: `datasources`
    - Route: `/lowcode/datasources?appId={appId}`

14. **APIs & Integrations**
    - Key: `apis`
    - Route: `/lowcode/api-designer?appId={appId}`

#### 🔒 Security (1 tile)
15. **Security & Permissions**
    - Key: `security`
    - Route: `/lowcode/security?appId={appId}`
    - Permissions: `security.view`, `security.manage`

#### 📈 Analytics (3 tiles)
16. **Charts & Analytics**
    - Key: `charts`
    - Route: `/lowcode/chart-designer?appId={appId}`
    - 6 chart types: bar, line, pie, area, scatter, doughnut

17. **Reports** 🆕 NEW
    - Key: `reports`
    - Route: `/lowcode/reports?applicationId={appId}`

18. **Dashboards**
    - Key: `dashboards`
    - Route: `/lowcode/dashboards?appId={appId}`

#### 🔧 System (2 tiles)
19. **Settings & Variables**
    - Key: `settings`
    - Route: `/lowcode/settings?appId={appId}`

20. **Preview & Run**
    - Key: `preview`
    - Route: `/lowcode/preview?appId={appId}`

---

## Files Created

### Models
- `src/exprsn-svr/lowcode/models/Tile.js`
- `src/exprsn-svr/lowcode/models/ApplicationTile.js`

### Migrations
- `src/exprsn-svr/lowcode/migrations/20251226170000-create-tiles-system.js`

### Routes
- `src/exprsn-svr/lowcode/routes/tiles.js`

### Seeders
- `src/exprsn-svr/lowcode/seeders/seed-tiles.js`

### Scripts
- `src/exprsn-svr/lowcode/scripts/run-tiles-migration.js`
- `src/exprsn-svr/lowcode/scripts/test-tiles-api.js`

### Updated Files
- `src/exprsn-svr/lowcode/models/Application.js` - Added tile associations
- `src/exprsn-svr/lowcode/routes/index.js` - Added tiles router

---

## API Endpoints

All endpoints are available at `/lowcode/api/tiles` and require CA token authentication.

### Tile Management
```
GET    /lowcode/api/tiles                           - List all tiles
GET    /lowcode/api/tiles/categories                - Get tiles grouped by category
GET    /lowcode/api/tiles/:id                       - Get tile by ID
GET    /lowcode/api/tiles/key/:key                  - Get tile by key
```

### Application-Specific Tiles
```
GET    /lowcode/api/tiles/application/:applicationId           - Get enabled tiles for application
POST   /lowcode/api/tiles/application/:applicationId/:tileId/enable   - Enable tile
POST   /lowcode/api/tiles/application/:applicationId/:tileId/disable  - Disable tile
PUT    /lowcode/api/tiles/application/:applicationId/:tileId          - Update tile config
POST   /lowcode/api/tiles/application/:applicationId/reset            - Reset to defaults
```

---

## Usage Examples

### Seeding Tiles
```bash
cd src/exprsn-svr
node lowcode/seeders/seed-tiles.js
```

### Testing Tiles
```bash
cd src/exprsn-svr
node lowcode/scripts/test-tiles-api.js
```

### Programmatic Usage

#### Get All Active Tiles
```javascript
const { Tile } = require('./models');

const tiles = await Tile.findAll({
  where: { isActive: true },
  order: [['sortOrder', 'ASC']]
});
```

#### Get Tiles by Category
```javascript
const dataTiles = await Tile.getActiveByCategory('data');
```

#### Check Permissions
```javascript
const tile = await Tile.findOne({ where: { key: 'security' } });
const hasAccess = tile.isAccessibleBy(['security.view', 'security.manage']);
```

#### Enable Tile for Application
```javascript
const { ApplicationTile } = require('./models');

await ApplicationTile.enableForApplication(
  applicationId,
  tileId,
  {
    customName: 'My Custom Entities',
    sortOrder: 1
  }
);
```

#### Get Application's Tiles
```javascript
const appTiles = await ApplicationTile.getEnabledTiles(applicationId);
```

---

## Features Summary

### ✅ Badge System
- **NEW Badge**: 3 tiles (Queries, Reports, Application Flows)
- **ENHANCED Badge**: 1 tile (Data Entities)
- **Custom Badges**: All tiles support custom badge text and colors

### ✅ Icon System
- Font Awesome icons for all tiles
- Beautiful gradient backgrounds (20 unique gradients)
- Customizable per application

### ✅ Permission System
- RBAC integration ready
- Each tile can define required permissions
- `isAccessibleBy()` method for permission checking

### ✅ Customization
- Per-application tile enabling/disabling
- Custom names, descriptions, and icons
- Custom sort order
- Application-specific settings (JSONB)

---

## Database Verification

All tests passed ✅

```
Total Tiles: 20
Active Tiles: 20
NEW Tiles: 3
ENHANCED Tiles: 1

Categories:
- data: 2 tiles
- design: 5 tiles
- automation: 4 tiles
- integration: 3 tiles
- security: 1 tile
- analytics: 3 tiles
- system: 2 tiles
```

---

## Next Steps (Optional Enhancements)

1. **Frontend Integration**
   - Update `app-designer-enhanced.ejs` to fetch tiles from database
   - Implement dynamic tile rendering based on permissions
   - Add tile management UI for admins

2. **Tile Analytics**
   - Track tile usage per application
   - Most/least used tiles
   - Usage trends over time

3. **Tile Marketplace**
   - Community-contributed tiles
   - Tile templates and bundles
   - Import/export tile configurations

4. **Advanced Permissions**
   - Role-based tile visibility
   - Organization-level tile management
   - Conditional tile display rules

---

## Technical Insights

### Why Database-Backed Tiles?

1. **Dynamic Configuration**: Update tile metadata without code deployments
2. **Multi-tenancy**: Different applications can have different tile sets
3. **Permission Control**: Fine-grained access control per tile
4. **Analytics Ready**: Track which tiles are used most
5. **Extensibility**: Easy to add new tiles or tile types
6. **A/B Testing**: Test different tile configurations

### Design Patterns Used

1. **Join Table Pattern**: `application_tiles` enables many-to-many with attributes
2. **Effective Value Pattern**: `getEffectiveName()` - custom value or fallback to default
3. **Repository Pattern**: Static methods like `getActiveByCategory()`
4. **Permission Guard**: `isAccessibleBy()` instance method
5. **Seeder Pattern**: Idempotent seeding with `findOrCreate`

---

## Conclusion

The tiles system is now fully implemented, tested, and ready for use. All 20 Business Hub tiles are stored in the database with complete metadata, permissions, and customization options. The system supports both default configurations and per-application customization, making it flexible for different use cases and deployment scenarios.

**Status**: ✅ Production Ready
