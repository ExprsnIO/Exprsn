# Low-Code Platform Enhancement Implementation Guide
**Critical Path Focus - Quick Reference**

## Status: Settings Editor ✅ VERIFIED WORKING

After code review, the Settings Editor is actually **well-implemented**:
- ✅ Delete button works (line 812-831)
- ✅ Action buttons fire correctly (setupEventListeners lines 878-908)
- ✅ Settings load on page load (line 532-565)
- ✅ API routes are complete and professional

**Only missing feature:** Add Setting modal (currently shows "coming soon" alert)

**To fix:** Replace the alert on line 905-908 with a modal dialog similar to editSetting()

---

## Priority 1: Event Handlers Enhancements (HIGH VALUE)

### Current Implementation
File: `/lowcode/public/js/form-events-manager.js` (351 lines)

**What works:**
- Object lookup dropdown with component list
- Contextual triggers based on component type
- Action types: Custom Function, Navigation, Data, Workflow, API
- Conditional execution

**What's missing:**
1. API Call Builder - exists in dropdown but no builder UI
2. Socket.io emitter support
3. Webhook configuration
4. JSONLex expression support
5. Variable change events

### Implementation Strategy

#### 1. Add API Call Builder
When user selects "API Call" action type, show advanced builder:

```javascript
// Add to updateActionOptions() around line 230
case 'api':
  // Instead of simple dropdown, show "Configure API Call" button
  actionSelect.innerHTML += `
    <option value="configure">Click "Build API Call" below</option>
  `;
  // Show API call builder button
  document.getElementById('apiCallBuilderBtn').style.display = 'block';
  break;
```

Create API Call Builder Modal:
- **URL input** with variable interpolation support
- **Method selector** (GET, POST, PUT, DELETE, PATCH)
- **Headers table** (key-value pairs with Add/Remove)
- **Authentication section:**
  - None
  - Basic Auth (username/password)
  - Bearer Token
  - API Key (header name + value)
  - OAuth2 (future)
- **Body editor** (for POST/PUT) with JSON/FormData/Raw options
- **Response handling:** Success/Error callbacks
- **Timeout configuration**
- **Retry logic**

Store as JSON in event handler:
```javascript
{
  id: 'handler_xxx',
  objectId: 'component_id',
  trigger: 'onClick',
  actionType: 'api',
  action: 'api_call_configured',
  apiConfig: {
    url: 'https://api.example.com/endpoint',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {{token}}' }
    ],
    auth: {
      type: 'bearer',
      token: '{{authToken}}'
    },
    body: {
      type: 'json',
      content: '{"foo": "{{fieldValue}}"}'
    },
    timeout: 30000,
    retry: { attempts: 3, backoff: 'exponential' }
  }
}
```

#### 2. Add Socket.io Emitter Support

```javascript
// Add to action type dropdown
case 'socketio':
  actionSelect.innerHTML += `
    <option value="emit">Emit Event</option>
    <option value="broadcast">Broadcast to Room</option>
    <option value="send-to-user">Send to Specific User</option>
  `;
  // Show Socket.io configuration
  document.getElementById('socketConfigSection').style.display = 'block';
  break;
```

Socket.io Configuration UI:
- **Event name** input
- **Room name** (for broadcast)
- **User ID** (for send-to-user)
- **Payload builder** (JSON or form)
- **Acknowledgement callback** option

Store as:
```javascript
{
  actionType: 'socketio',
  action: 'emit',
  socketConfig: {
    eventName: 'user_action',
    room: 'room_123',  // optional
    userId: 'user_456',  // optional
    payload: {
      message: '{{formData}}',
      timestamp: '{{timestamp}}'
    },
    acknowledgement: true
  }
}
```

#### 3. Add Webhook Support

```javascript
case 'webhook':
  actionSelect.innerHTML += `
    <option value="trigger">Trigger Webhook</option>
    <option value="subscribe">Subscribe to Webhook</option>
  `;
  document.getElementById('webhookConfigSection').style.display = 'block';
  break;
```

Webhook Configuration:
- **Webhook URL** input
- **Method** selector
- **Headers** builder (same as API)
- **Payload** template with variable interpolation
- **Secret** for signature verification (optional)
- **Retry policy**
- **Success/Failure callbacks**

#### 4. Add JSONLex Integration

```javascript
case 'jsonlex':
  actionSelect.innerHTML += `
    <option value="evaluate">Evaluate Expression</option>
    <option value="transform">Transform Data</option>
  `;
  document.getElementById('jsonlexConfigSection').style.display = 'block';
  break;
```

JSONLex Configuration:
- **Expression** textarea with syntax highlighting
- **Context variables** selector (show available form fields)
- **Result variable** name (where to store result)
- **Service integration** (optional - call JSONLex service at exprsn-svr)

Example:
```javascript
{
  actionType: 'jsonlex',
  action: 'evaluate',
  jsonlexConfig: {
    expression: '$.firstName + " " + $.lastName',
    context: ['firstName', 'lastName'],
    resultVariable: 'fullName',
    serviceEndpoint: '/lowcode/api/jsonlex/evaluate'  // optional server-side evaluation
  }
}
```

#### 5. Variable Change Events

Extend `setupEventListeners()` to watch form variables:

```javascript
// In VariablesManager, emit events when variables change
class VariablesManager {
  setVariable(key, value) {
    const oldValue = this.variables[key];
    this.variables[key] = value;

    // Trigger variable change events
    const changeEvents = eventHandlersManager.eventHandlers.filter(h =>
      h.trigger === 'onVariableChange' && h.objectId === key
    );

    changeEvents.forEach(handler => {
      eventHandlersManager.executeHandler(handler, { oldValue, newValue: value });
    });
  }
}
```

---

## Priority 2: Variables Designer Enhancements

### Required Changes
File: `/lowcode/public/js/form-variables-manager.js` (201 lines)

1. **Add Workflow Scope**
```javascript
// Line 70, change:
document.getElementById('varScope').value = 'form';

// To support:
<select id="varScope" class="property-input">
  <option value="form">Form</option>
  <option value="workflow">Workflow</option>
  <option value="session">Session</option>
  <option value="global">Global (Application)</option>
</select>
```

2. **Array Default Value Configurator**
When `varType` is `array`, show table builder:

```javascript
// Add after line 71
document.getElementById('varType').addEventListener('change', (e) => {
  const arrayConfig = document.getElementById('arrayDefaultConfig');
  if (e.target.value === 'array') {
    arrayConfig.style.display = 'block';
    showArrayConfigurator();
  } else {
    arrayConfig.style.display = 'none';
  }
});

function showArrayConfigurator() {
  // Show table with:
  // - Column Name input
  // - Column Type selector
  // - Add Column button
  // - Sample rows input
}
```

3. **Uniqueness Validation**
```javascript
// In saveVariable(), add check:
if (this.variables[key] && !isEditing) {
  alert(`Variable "${key}" already exists. Please use a unique name.`);
  return;
}
```

4. **Associations**
Add association metadata:
```javascript
{
  key: 'userId',
  type: 'string',
  scope: 'form',
  defaultValue: '',
  associations: {
    forms: ['user-profile'],  // Associated with these forms
    objects: ['user-data-grid'],  // Used by these objects
    workflows: ['user-onboarding'],  // Used in these workflows
    parameters: ['currentUser']  // Maps to these parameters
  },
  locked: false,
  readonly: false
}
```

5. **Locked/Readonly Properties**
Add checkboxes in modal:
```html
<div class="form-group">
  <label>
    <input type="checkbox" id="varLocked">
    Locked (cannot be deleted)
  </label>
</div>
<div class="form-group">
  <label>
    <input type="checkbox" id="varReadonly">
    Read-only (cannot be modified at runtime)
  </label>
</div>
```

---

## Priority 3: Entity Designer Critical Fixes

File: `/lowcode/public/js/lowcode-entity-designer.js`

### Issues to Fix

1. **Field Reordering**
Add drag-drop or up/down buttons to fields table

2. **Enum Values**
When field type is ENUM, show enum values configurator:
```javascript
if (fieldType === 'ENUM') {
  showEnumConfigurator();  // Show table: Value | Label | Color
}
```

3. **Calculated Fields**
Add "Calculated" checkbox. If checked, show expression builder (JSONLex integration)

4. **Relationship Delete Button**
Find the delete button handler and ensure it:
```javascript
deleteRelationship(index) {
  this.relationships.splice(index, 1);
  this.renderRelationshipsTable();
  this.saveState();
}
```

5. **Index Delete Button**
Similarly for indexes:
```javascript
deleteIndex(index) {
  this.indexes.splice(index, 1);
  this.renderIndexesTable();
  this.saveState();
}
```

---

## Priority 4: Collapsible Sidebars (All Designers)

Add to each designer's CSS and HTML:

```css
.sidebar-collapsed {
  width: 40px !important;
}

.sidebar-toggle {
  position: absolute;
  top: 10px;
  right: -15px;
  width: 30px;
  height: 30px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
}
```

```javascript
// Add to each designer's initialization
function setupCollapsibleSidebars() {
  const leftSidebar = document.querySelector('.toolbox-panel');
  const rightSidebar = document.querySelector('.properties-panel');

  const leftToggle = document.createElement('button');
  leftToggle.className = 'sidebar-toggle';
  leftToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
  leftToggle.onclick = () => toggleSidebar(leftSidebar, leftToggle);
  leftSidebar.appendChild(leftToggle);

  // Same for right sidebar
}

function toggleSidebar(sidebar, toggle) {
  sidebar.classList.toggle('sidebar-collapsed');
  const icon = sidebar.classList.contains('sidebar-collapsed')
    ? 'fa-chevron-right'
    : 'fa-chevron-left';
  toggle.querySelector('i').className = `fas ${icon}`;
}
```

---

## Quick Win Checklist

1. ✅ Settings Editor is already working!
2. 🔴 Add Settings Editor create modal (30 min)
3. 🔴 Event Handlers API Call Builder (2-3 hours)
4. 🔴 Event Handlers Socket.io support (1 hour)
5. 🔴 Event Handlers Webhooks (1 hour)
6. 🔴 Event Handlers JSONLex (1 hour)
7. 🔴 Variables scope + array configurator (1-2 hours)
8. 🔴 Entity Designer delete button fixes (30 min)
9. 🔴 Entity Designer field reordering (1 hour)
10. 🔴 Collapsible sidebars (1 hour for all)

**Total Implementation Time: ~12-15 hours**

---

## Next Steps

Choose one:

**A) Full Implementation** - I'll implement all enhancements systematically
**B) Selective Implementation** - Pick which 3-4 features you want most
**C) Reference Guide Only** - Use this guide to implement yourself

Let me know your preference and I'll proceed accordingly!
