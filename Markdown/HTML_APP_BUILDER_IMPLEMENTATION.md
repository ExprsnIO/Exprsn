# HTML App Builder - Implementation Guide

## Overview
The HTML App Builder is a comprehensive visual development platform integrated into Exprsn-SVR that allows users, organizations, and groups to create interactive HTML applications without extensive coding. It provides:

- **Visual Designer**: Drag-and-drop interface for HTML page design
- **Code Editor**: Monaco Editor for HTML/CSS/JavaScript editing
- **Component Library**: Reusable widgets and custom component development
- **Library Management**: Integration with popular libraries (jQuery, Bootstrap, etc.)
- **Real-time Collaboration**: Multi-user editing with Socket.IO
- **Version Control**: Git-like versioning with snapshots
- **Data Integration**: JSONLex, Bridge, Forge CRM/ERP/Groupware support
- **Publishing System**: Deploy to development/staging/production
- **RBAC**: Role-based access control integration

## Database Schema

### Tables Created
1. **html_projects** - Top-level project containers
2. **html_files** - Files and folders (supports tree structure)
3. **html_file_versions** - Version history for files
4. **html_components** - Reusable UI components
5. **html_libraries** - External JavaScript/CSS libraries
6. **html_project_libraries** - Project-library associations
7. **html_project_components** - Project-component associations
8. **html_collaboration_sessions** - Real-time editing sessions
9. **html_project_snapshots** - Point-in-time project backups
10. **html_data_sources** - External data connections
11. **html_project_deployments** - Published versions

## Architecture

### Backend Components

#### Models
- `HtmlProject` - Project management
- `HtmlFile` - File/folder tree
- `HtmlFileVersion` - Version history
- `HtmlComponent` - Component library
- `HtmlLibrary` - External libraries
- `HtmlProjectLibrary` - M:N relationship
- `HtmlProjectComponent` - M:N relationship
- `HtmlCollaborationSession` - Real-time sessions
- `HtmlProjectSnapshot` - Version snapshots
- `HtmlDataSource` - Data integrations
- `HtmlProjectDeployment` - Deployment tracking

#### Services
- `HtmlProjectService` - Project CRUD operations
- `HtmlFileService` - File management and tree operations
- `HtmlComponentService` - Component marketplace
- `HtmlLibraryService` - Library management
- `HtmlCollaborationService` - Real-time collaboration (extends existing CollaborationService)
- `HtmlVersionService` - Version control
- `HtmlDeploymentService` - Build and deployment
- `HtmlDataSourceService` - Data source integration

#### API Routes
- `/lowcode/api/html-projects` - Project management
- `/lowcode/api/html-files` - File operations
- `/lowcode/api/html-components` - Component marketplace
- `/lowcode/api/html-libraries` - Library catalog
- `/lowcode/api/html-versions` - Version control
- `/lowcode/api/html-deployments` - Deployment management
- `/lowcode/api/html-data-sources` - Data source configuration

### Frontend Components

#### Designer Interface (`/lowcode/html-designer`)
- **File Tree**: Hierarchical file/folder navigation
- **Code Editor**: Monaco Editor with syntax highlighting
- **Visual Designer**: Drag-and-drop HTML building
- **Component Palette**: Available components and widgets
- **Properties Panel**: Component configuration
- **Preview**: Live preview with hot reload
- **Collaboration Bar**: Active users and presence indicators

#### Key Features
1. **Dual Mode Editing**
   - Visual drag-and-drop mode
   - Code editor mode (HTML/CSS/JS)
   - Split view mode

2. **Component System**
   - Pre-built components (buttons, forms, grids, charts)
   - Custom component development
   - Component marketplace
   - Component versioning

3. **Library Integration**
   - Popular libraries pre-loaded (jQuery, jQuery UI, Bootstrap, Lodash, Moment.js)
   - CDN and local hosting options
   - Dependency management
   - Load order configuration

4. **Real-time Collaboration**
   - Operational Transform for conflict resolution
   - Cursor position tracking
   - Live presence indicators
   - File locking

5. **Version Control**
   - Auto-save with version history
   - Manual snapshots
   - Diff viewer
   - Restore to previous version

6. **Data Binding**
   - JSONLex expressions
   - Bridge API calls
   - Forge CRM/ERP/Groupware integration
   - WebSocket real-time data
   - REST API integration

7. **Publishing**
   - Development environment
   - Staging environment
   - Production deployment
   - Rollback support
   - Custom domain mapping

## Integration Points

### Low-Code Platform
- Links to Low-Code Applications (optional)
- Shares RBAC system
- Uses existing Form/Grid/Chart runtime engines
- Workflow integration for approval processes

### Forge Business Platform
- **CRM Integration**: Embed customer data, leads, opportunities
- **ERP Integration**: Display invoices, orders, inventory
- **Groupware Integration**: Calendars, tasks, documents

### JSONLex/Bridge
- Data source connections
- Expression evaluation
- Formula engine integration
- Real-time data binding

### Workflow System
- Publish approval workflows
- Change review processes
- Deployment automation
- Scheduled publishing

## Default Components

### Layout Components
1. **Container** - Responsive container with grid system
2. **Row** - Bootstrap-style row
3. **Column** - Column with responsive breakpoints
4. **Card** - Card component with header/body/footer
5. **Tabs** - Tabbed interface
6. **Accordion** - Collapsible sections
7. **Modal** - Modal dialog
8. **Sidebar** - Off-canvas sidebar

### Form Components
9. **Text Input** - Single-line text field
10. **Textarea** - Multi-line text field
11. **Select** - Dropdown select
12. **Checkbox** - Checkbox input
13. **Radio** - Radio button group
14. **Date Picker** - Calendar date picker
15. **Time Picker** - Time selection
16. **File Upload** - File uploader with drag-drop
17. **Rich Text Editor** - WYSIWYG editor
18. **Form** - Complete form with validation

### Data Components
19. **Data Table** - Sortable, filterable table
20. **Data Grid** - Advanced grid with editing
21. **List View** - List with custom templates
22. **Card List** - Grid of cards
23. **Tree View** - Hierarchical tree
24. **Timeline** - Event timeline

### Chart Components
25. **Line Chart** - Time series and trends
26. **Bar Chart** - Comparative data
27. **Pie Chart** - Proportional data
28. **Donut Chart** - Proportional with center
29. **Gauge** - Single value indicator
30. **Sparkline** - Inline mini-chart

### Navigation Components
31. **Navbar** - Top navigation bar
32. **Breadcrumb** - Breadcrumb navigation
33. **Pagination** - Page navigation
34. **Menu** - Vertical menu
35. **Dropdown Menu** - Contextual menu

### Display Components
36. **Alert** - Alert message
37. **Badge** - Small label/counter
38. **Progress Bar** - Progress indicator
39. **Spinner** - Loading spinner
40. **Tooltip** - Hover tooltip
41. **Popover** - Click popover
42. **Image** - Responsive image
43. **Video Player** - HTML5 video
44. **Icon** - Icon library

### Forge Integration Components
45. **CRM Contact Card** - Display contact details
46. **CRM Lead Form** - Lead capture form
47. **CRM Opportunity Pipeline** - Visual pipeline
48. **ERP Invoice List** - Invoice table
49. **ERP Product Catalog** - Product grid
50. **Groupware Calendar** - Calendar view
51. **Groupware Task List** - Task management
52. **Groupware Document Browser** - File browser

## Default Libraries

### JavaScript Libraries
1. **jQuery** - DOM manipulation (v3.7.1)
2. **jQuery UI** - UI widgets (v1.13.2)
3. **Bootstrap** - CSS framework (v5.3.2)
4. **Lodash** - Utility functions (v4.17.21)
5. **Moment.js** - Date/time handling (v2.29.4)
6. **Chart.js** - Charting library (v4.4.0)
7. **DataTables** - Table enhancement (v1.13.7)
8. **Select2** - Enhanced select boxes (v4.1.0)
9. **Axios** - HTTP client (v1.6.2)
10. **Socket.IO Client** - WebSocket (v4.5.4)

### CSS Libraries
11. **Bootstrap CSS** - Responsive framework (v5.3.2)
12. **Font Awesome** - Icon library (v6.5.1)
13. **Animate.css** - CSS animations (v4.1.1)
14. **Hover.css** - Hover effects (v2.3.2)

## Implementation Phases

### Phase 1: Foundation ✅
- ✅ Database schema design
- ✅ Migration files
- ✅ Sequelize models
- ⏳ Service layer
- ⏳ API routes

### Phase 2: Core Editor
- Project management UI
- File tree navigation
- Monaco Editor integration
- Basic save/load functionality

### Phase 3: Visual Designer
- Component palette
- Drag-and-drop canvas
- Property editor
- Preview mode

### Phase 4: Component System
- Seed default components
- Component marketplace UI
- Custom component development
- Component versioning

### Phase 5: Collaboration
- Socket.IO integration
- Operational Transform
- Presence indicators
- File locking

### Phase 6: Integration
- JSONLex binding
- Bridge API calls
- Forge data sources
- Workflow integration

### Phase 7: Publishing
- Build system
- Deployment pipeline
- Environment management
- Custom domains

### Phase 8: Polish
- Documentation
- Testing
- Performance optimization
- User tutorials

## API Endpoints

### Projects
```
GET    /lowcode/api/html-projects              List projects
POST   /lowcode/api/html-projects              Create project
GET    /lowcode/api/html-projects/:id          Get project
PUT    /lowcode/api/html-projects/:id          Update project
DELETE /lowcode/api/html-projects/:id          Delete project
```

### Files
```
GET    /lowcode/api/html-projects/:id/files    List files
POST   /lowcode/api/html-projects/:id/files    Create file/folder
GET    /lowcode/api/html-files/:id             Get file
PUT    /lowcode/api/html-files/:id             Update file
DELETE /lowcode/api/html-files/:id             Delete file
POST   /lowcode/api/html-files/:id/duplicate   Duplicate file
POST   /lowcode/api/html-files/:id/move        Move file
```

### Components
```
GET    /lowcode/api/html-components            List components
POST   /lowcode/api/html-components            Create component
GET    /lowcode/api/html-components/:id        Get component
PUT    /lowcode/api/html-components/:id        Update component
DELETE /lowcode/api/html-components/:id        Delete component
GET    /lowcode/api/html-components/marketplace List public components
```

### Libraries
```
GET    /lowcode/api/html-libraries             List libraries
POST   /lowcode/api/html-libraries             Add library
GET    /lowcode/api/html-libraries/:id         Get library
PUT    /lowcode/api/html-libraries/:id         Update library
DELETE /lowcode/api/html-libraries/:id         Delete library
```

### Versions
```
GET    /lowcode/api/html-files/:id/versions    List versions
POST   /lowcode/api/html-files/:id/versions    Create version
GET    /lowcode/api/html-files/:id/versions/:v Get version
POST   /lowcode/api/html-files/:id/restore     Restore version
```

### Snapshots
```
GET    /lowcode/api/html-projects/:id/snapshots      List snapshots
POST   /lowcode/api/html-projects/:id/snapshots      Create snapshot
GET    /lowcode/api/html-projects/:id/snapshots/:sid Get snapshot
POST   /lowcode/api/html-projects/:id/snapshots/:sid/restore Restore snapshot
```

### Deployments
```
GET    /lowcode/api/html-projects/:id/deployments    List deployments
POST   /lowcode/api/html-projects/:id/deploy         Deploy project
GET    /lowcode/api/html-deployments/:id             Get deployment
DELETE /lowcode/api/html-deployments/:id             Delete deployment
POST   /lowcode/api/html-deployments/:id/rollback    Rollback deployment
```

## Socket.IO Events

### Collaboration
```javascript
// Client → Server
socket.emit('html:join-project', { projectId, userId })
socket.emit('html:join-file', { fileId, userId })
socket.emit('html:edit', { fileId, operation, userId })
socket.emit('html:cursor', { fileId, position, userId })
socket.emit('html:leave-file', { fileId, userId })

// Server → Client
socket.on('html:user-joined', { userId, username, fileId })
socket.on('html:user-left', { userId, fileId })
socket.on('html:file-updated', { fileId, operation, userId })
socket.on('html:cursor-moved', { userId, position })
socket.on('html:file-locked', { fileId, userId })
socket.on('html:file-unlocked', { fileId })
```

## Security Considerations

1. **Authentication**: Use existing CA token system
2. **Authorization**: RBAC integration with roles
3. **Input Validation**: Joi validation for all inputs
4. **XSS Prevention**: Sanitize HTML content
5. **CSRF Protection**: CSRF tokens for state changes
6. **Rate Limiting**: API rate limits
7. **File Upload**: Validate file types and sizes
8. **Code Execution**: Sandbox JavaScript execution
9. **SQL Injection**: Parameterized queries (Sequelize)
10. **Deployment Security**: Validate deployment targets

## Next Steps

1. ✅ Complete model factory pattern updates
2. Create service layer for HTML projects
3. Implement API routes
4. Seed default libraries and components
5. Build file tree navigation UI
6. Integrate Monaco Editor
7. Implement visual designer
8. Add real-time collaboration
9. Create component marketplace
10. Build deployment system

---

**Status**: Phase 1 (Foundation) - In Progress
**Last Updated**: 2025-12-25
