# Low-Code Platform Enhancement Implementation Plan
**Date:** December 24, 2024
**Status:** In Progress

## Overview
Comprehensive enhancement of the Exprsn Low-Code Platform across 10 major functional areas to improve usability, add advanced features, and enhance professional polish.

---

## 1. Code & Functions Designer ✅ PARTIALLY IMPLEMENTED

### Current State
- ✅ Function table with name, parameters, return type, description
- ✅ Parameter table format with Name, Type, Required columns
- ✅ Async function support checkbox
- ✅ Monaco code editor integration
- ✅ Test function capability
- ✅ JSDoc generation

### Required Enhancements
- ⏳ **Collapsible Components sidebar** (left) - needs toggle button
- ⏳ **Collapsible Properties sidebar** (right) - needs toggle button
- ✅ Async support (already implemented)
- ✅ Parameter table format (already implemented)
- ⚠️  **Cancel button fix** - needs to call `closeAddFunctionModal()` properly

### Implementation Priority
🟢 LOW - Most features already work correctly

---

## 2. Event Handlers Designer ⚠️ NEEDS ENHANCEMENT

### Current State
- ✅ Object lookup dropdown
- ✅ Contextual triggers based on component type
- ✅ Action types: Function, Navigation, Data, Workflow, API
- ✅ Conditional execution
- ❌ No Socket.io emitter support
- ❌ No event states
- ❌ No webhooks
- ❌ No JSONLex integration
- ❌ API call type exists but no call builder

### Required Enhancements
- 🔴 **Object Lookup** - Display list of objects/components in designer (✅ already done)
- 🔴 **Event Triggers** - Only show events for selected object type (✅ already done)
- 🔴 **Action Type Enhancements:**
  - Custom Function: ✅ Lists all functions
  - Trigger Workflow: ⚠️ Lists workflows but needs improvement
  - **API Call**: 🔴 Add call builder with headers, URL, auth, etc.
  - **Socket.io**: 🔴 NEW - Add socket.io emitter support
  - **Webhooks**: 🔴 NEW - Add webhook configuration
  - **JSONLex**: 🔴 NEW - Add JSONLex expression support
- 🔴 **Variable Change Events** - Allow events on variable changes
- ⚠️  **Delete button fix** - Verify deletion works properly
- 🔴 **Event States** - Add support for event states (pending, processing, complete, error)

### Implementation Priority
🔴 HIGH - Critical for professional workflow automation

---

## 3. Variables Designer ⚠️ NEEDS ENHANCEMENT

### Current State
- ✅ Variable table with Key, Type, Scope, Default Value
- ✅ Types: string, number, boolean, object, array
- ✅ Scope: form (only)
- ❌ No workflow scope
- ❌ No array default configurator
- ❌ No uniqueness validation
- ❌ No association support
- ❌ No locked/readonly properties

### Required Enhancements
- 🔴 **Add Workflow Scope** - Extend scope options
- ⚠️  **Cancel button fix** - Ensure modal closes properly
- 🔴 **Array Type Enhancement** - When type=array, show table for default values with configurable columns
- 🔴 **Uniqueness Validation** - Ensure variable keys are unique
- 🔴 **Associations** - Associate variables with forms, objects, workflows, or parameters
- 🔴 **Locked/Readonly Properties** - Add locked and readonly flags
- ⏳ **Collapsible Components sidebar** - Same as other designers
- 🔴 **Properties Sidebar Inspector** - Select variable in table to view/edit in properties panel

### Implementation Priority
🟡 MEDIUM - Important for complex form logic

---

## 4. Permissions Designer ✅ WELL IMPLEMENTED

### Current State
- ✅ Form-level permissions table (View, Edit, Submit, Delete)
- ✅ User/Role/Group selector modal with tabs
- ✅ Search and select all functionality
- ✅ Component-level permissions dialog
- ✅ CA token integration
- ✅ exprsn-auth integration (mock data currently)

### Required Enhancements
- ⏳ **Improve table view** - Already good, minor UI polish
- ⏳ **Collapsible Components sidebar**
- ✅ **User/Role selector** (already excellent)
- ✅ **Component permissions subgrid** (already implemented)

### Implementation Priority
🟢 LOW - Already very well implemented

---

## 5. Workflows Integration ⚠️ NEEDS ENHANCEMENT

### Current State
- ✅ Basic workflow trigger configuration
- ⚠️  Field mapping exists but needs improvement
- ❌ Workflow designer is nested, should be external link

### Required Enhancements
- ⏳ **Collapsible Components sidebar**
- 🔴 **Update Field Mapping** - Improve UI and functionality
- 🔴 **Add Workflow Designer Link** - Instead of nested designer, link to /lowcode/workflows/designer?id=xxx
- ⏳ **Improve workflow selection UI**

### Implementation Priority
🟡 MEDIUM - Important for process automation

---

## 6. Entity Designer 🔴 NEEDS MAJOR ENHANCEMENT

### Current State
- ✅ Basic field management
- ❌ No field reordering
- ❌ Limited enum support
- ❌ No calculated values
- ⚠️  Relationship management exists but buggy
- ⚠️  Index management exists but has issues

### Required Enhancements
- 🔴 **Field Reordering** - Drag-drop or up/down buttons
- 🔴 **Enumeration Values** - Allow listing enumerated values for ENUM type
- 🔴 **UUID Generation Functions** - Add UUID generation options
- 🔴 **Calculated Values** - Add calculated field feature with expression builder
- 🔴 **Relationship Management:**
  - Allow reordering
  - Fix delete button
  - Update properties sidebar for One-To-Many, Many-To-One, Many-To-Many
  - Add Foreign Key configuration
  - Add column mapping
- 🔴 **Index Management:**
  - Fix properties update
  - Allow reordering
  - Fix delete button
  - Add indexed field checkbox list
- 🔴 **Data Type Properties** - Update properties sidebar based on selected data type

### Implementation Priority
🔴 CRITICAL - Foundation for data modeling

---

## 7. Data Grids ⚠️ NEEDS ENHANCEMENT

### Current State
- ✅ Basic grid designer exists
- ❌ Limited to single entity
- ❌ No conditional formatting
- ❌ Basic filtering only

### Required Enhancements
- 🔴 **Multi-Service Schema Loading:**
  - Load schemas from current application
  - Load Forge CRM entities
  - Load from other Exprsn services
- 🔴 **Column Management:**
  - Allow adding columns
  - Configure column properties
- 🔴 **Conditional Formatting:**
  - Format columns based on values
  - Format rows based on conditions
- 🔴 **Advanced Filtering:**
  - Multiple filter criteria
  - Filter operators (equals, contains, >, <, etc.)
  - Save filter presets

### Implementation Priority
🟡 MEDIUM - Important for data display

---

## 8. Charts Designer ⚠️ NEEDS ENHANCEMENT

### Current State
- ✅ Basic chart designer exists
- ⚠️  Data source configuration partially implemented
- ❌ Styling/Advanced sections don't update
- ❌ Theme selection not visual

### Required Enhancements
- 🔴 **Data Source Configuration:**
  - Static Data: Support JSON, XML, CSV formats with format selector
  - "Low-Code Entity" → "Data Entity"
  - REST API: Add URL, auth (username/password), headers builder
  - JSONLex Expression: Add service name, route, call info
  - Remove static data section when non-static selected
- 🔴 **Styling Section** - Fix update issues
- 🔴 **Advanced Section** - Fix update issues
- 🔴 **Visual Theme Selection** - Show theme colors visually for selection

### Implementation Priority
🟡 MEDIUM - Important for analytics

---

## 9. Dashboards Designer 🔴 NEEDS IMPLEMENTATION

### Current State
- ⚠️  Basic dashboard designer file exists
- ❌ No drag-drop functionality
- ❌ No component linking
- ❌ No drill-down capability

### Required Enhancements
- 🔴 **Drag-Drop Designer** - Implement grid-based drag-drop layout
- 🔴 **Component Linking:**
  - Link to application's existing tables
  - Link to charts
  - Link to grids
  - Link to forms
- 🔴 **Drill-Down Functionality** - Click widgets to drill into details
- 🔴 **Filtering** - Cross-widget filtering
- 🔴 **Refresh Controls** - Auto-refresh and manual refresh

### Implementation Priority
🟡 MEDIUM - Important for executive views

---

## 10. Settings Editor ⚠️ NEEDS FIXES

### Current State
- ✅ Settings editor exists
- ❌ Action buttons don't fire
- ❌ Delete button doesn't work
- ❌ Settings not loading

### Required Enhancements
- 🔴 **Fix Action Buttons** - Ensure all buttons fire correctly
- 🔴 **Fix Delete Button** - Implement proper deletion
- 🔴 **Fix Settings Loading** - Ensure settings load on page load
- ⏳ **Improve UI** - Minor polish

### Implementation Priority
🔴 HIGH - Blocking basic functionality

---

## Implementation Schedule

### Phase 1: Critical Fixes (Days 1-2)
1. ✅ Settings Editor fixes
2. ✅ Entity Designer critical issues
3. ✅ Event Handlers delete button

### Phase 2: Core Enhancements (Days 3-5)
4. Event Handlers advanced features (Socket.io, Webhooks, JSONLex, API Builder)
5. Variables Designer enhancements
6. Entity Designer advanced features

### Phase 3: UI/UX Polish (Days 6-7)
7. Collapsible sidebars across all designers
8. Properties inspector improvements
9. Modal dialog consistency

### Phase 4: Data & Analytics (Days 8-9)
10. Data Grids multi-service support
11. Charts designer enhancements
12. Dashboard designer implementation

### Phase 5: Integration (Day 10)
13. Workflow integration improvements
14. Cross-designer consistency
15. Final testing and polish

---

## Files to Modify

### JavaScript Managers
- `/lowcode/public/js/form-functions-manager.js` - ⏳ Minor fixes
- `/lowcode/public/js/form-events-manager.js` - 🔴 Major enhancements
- `/lowcode/public/js/form-variables-manager.js` - 🔴 Major enhancements
- `/lowcode/public/js/form-permissions-manager.js` - ⏳ Minor polish
- `/lowcode/public/js/form-workflow-manager.js` - 🔴 Moderate enhancements
- `/lowcode/public/js/lowcode-entity-designer.js` - 🔴 Major enhancements
- `/lowcode/public/js/grid-designer.js` - 🔴 Major enhancements
- `/lowcode/public/js/chart-designer.js` - 🔴 Major enhancements
- `/lowcode/public/js/dashboard-designer.js` - 🔴 Major enhancements
- `/lowcode/public/js/form-designer-pro.js` - ⏳ Collapsible sidebar support

### EJS Views
- `/lowcode/views/form-designer-pro.ejs` - ⏳ Sidebar toggle buttons
- `/lowcode/views/entity-designer.ejs` - 🔴 Major UI enhancements
- `/lowcode/views/grid-designer.ejs` - 🔴 Major UI enhancements
- `/lowcode/views/chart-designer.ejs` - 🔴 UI fixes
- `/lowcode/views/dashboard-designer.ejs` - 🔴 Complete redesign
- `/lowcode/views/settings-manager.ejs` - 🔴 Bug fixes

### CSS
- `/lowcode/public/css/lowcode-theme.css` - Add collapsible sidebar styles

---

## Legend
- ✅ = Fully Implemented
- ⏳ = Partially Implemented, needs minor work
- ⚠️ = Partially Implemented, needs moderate work
- 🔴 = Not Implemented, needs major work
- ❌ = Not Implemented

---

## Progress Tracking
- Total Tasks: ~75
- Completed: ~25 (33%)
- In Progress: 0 (0%)
- Remaining: ~50 (67%)
