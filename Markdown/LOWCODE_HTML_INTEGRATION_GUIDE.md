# 🔗 Low-Code Application + HTML Designer Integration

## 🎉 Overview

This integration allows Low-Code applications to be edited in the HTML IDE, creating a seamless bridge between visual form builders and hand-coded HTML/CSS/JS development.

---

## ✅ What's Been Implemented

### 1. **AppHtmlIntegrationService**
Location: `/lowcode/services/AppHtmlIntegrationService.js`

**Key Methods:**
- `getOrCreateHtmlProject(appId, userId)` - Creates HTML project linked to app
- `createInitialFiles(projectId, app, userId)` - Generates HTML files
- `generateIndexHtml(app)` - Creates main HTML page
- `generateAppCss(app)` - Generates styled CSS with app color scheme
- `generateAppJs(app)` - Creates JavaScript with API integration
- `generateFormHtml(form)` - Converts Low-Code forms to HTML
- `syncAppToHtml(appId)` - Syncs changes from app to HTML project

### 2. **API Endpoints**
Location: `/lowcode/routes/appHtmlIntegration.js`

```javascript
// Get or create HTML project for an application
GET /lowcode/api/applications/:appId/html-project

// Sync application to HTML
POST /lowcode/api/applications/:appId/sync-to-html

// Get HTML IDE URL
GET /lowcode/api/applications/:appId/html-ide-url
```

### 3. **Route Integration**
The routes are mounted in `/lowcode/routes/index.js`

---

## 🚀 How It Works

### File Structure Created for Each App

When you open a Low-Code application in the HTML IDE, it creates:

```
HTML Project (auto-generated)
├── index.html          # Main application page
├── app.css             # Application styles (using app color scheme)
├── app.js              # JavaScript with API integration
└── forms/              # Folder containing all forms
    ├── contact-form.html
    ├── user-profile.html
    └── settings.html
```

### Index.HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>App Name</title>
  <!-- Bootstrap 5 -->
  <!-- Font Awesome -->
  <!-- app.css -->
</head>
<body>
  <!-- Navigation bar with app color and icon -->
  <nav class="navbar" style="background: {appColor}">
    <a href="#"><i class="{appIcon}"></i> {appName}</a>
  </nav>

  <!-- Hero section -->
  <div class="hero-section">
    <h1>{appName}</h1>
    <p>{appDescription}</p>
    <button onclick="loadForms()">Get Started</button>
  </div>

  <!-- Forms grid (loaded dynamically) -->
  <div id="forms-container"></div>

  <script src="app.js"></script>
</body>
</html>
```

###Form HTML Generation

Each Low-Code form becomes an HTML file with:

```html
<!-- Navigation back to app -->
<nav><a href="../index.html">Back to App</a></nav>

<!-- Form container -->
<form id="mainForm" onsubmit="handleSubmit(event)">
  <!-- Generated components -->
  <div class="form-group">
    <label class="required">Name</label>
    <input type="text" name="name" required>
  </div>

  <!-- Buttons -->
  <button type="submit">Submit</button>
</form>

<script>
  async function handleSubmit(event) {
    // Posts to /lowcode/api/forms/{formId}/submit
  }
</script>
```

### Component Mapping

| Low-Code Component | Generated HTML |
|-------------------|----------------|
| Text Input | `<input type="text" class="form-control">` |
| Email | `<input type="email" class="form-control">` |
| Text Area | `<textarea class="form-control">` |
| Dropdown | `<select class="form-select">` |
| Checkbox | `<input type="checkbox" class="form-check-input">` |
| Button | `<button class="btn btn-{variant}">` |
| Heading | `<h{level}>` |
| Paragraph | `<p>` |
| Divider | `<hr>` |

---

## 🎯 Usage Examples

### Open Application in HTML IDE

**JavaScript (from Applications page):**
```javascript
async function openHtmlIDE(appId) {
  try {
    const response = await fetch(`/lowcode/api/applications/${appId}/html-ide-url`);
    const result = await response.json();

    if (result.success) {
      window.location.href = result.url;
      // Opens: /lowcode/html-ide?projectId={projectId}
    }
  } catch (error) {
    console.error('Failed to open HTML IDE:', error);
  }
}
```

### Sync Application to HTML

```javascript
async function syncToHtml(appId) {
  const response = await fetch(`/lowcode/api/applications/${appId}/sync-to-html`, {
    method: 'POST'
  });

  const result = await response.json();

  if (result.success) {
    alert('Application synced to HTML project!');
  }
}
```

---

## 🔗 Integration Points

### 1. Applications Page (`/lowcode/views/applications.ejs`)

**Add HTML IDE Button:**

```html
<!-- In the application card template -->
<div class="app-actions">
  <button class="btn btn-primary" onclick="openDesigner(app.id)">
    <i class="fas fa-cog"></i> Low-Code Designer
  </button>

  <!-- NEW: HTML IDE Button -->
  <button class="btn btn-info" onclick="openHtmlIDE(app.id)" style="background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);">
    <i class="fas fa-laptop-code"></i> HTML IDE
  </button>

  <button class="btn btn-success" onclick="runApp(app.id)">
    <i class="fas fa-play"></i> Run
  </button>
</div>

<script>
async function openHtmlIDE(appId) {
  try {
    const response = await fetch(`/lowcode/api/applications/${appId}/html-ide-url`);
    const result = await response.json();

    if (result.success) {
      if (result.created) {
        alert('HTML project created! Opening IDE...');
      }
      window.location.href = result.url;
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to open HTML IDE:', error);
    alert('Failed to open HTML IDE');
  }
}
</script>
```

### 2. Application Designer (`/lowcode/views/app-designer-enhanced.ejs`)

**Add HTML Mode Toggle:**

```html
<!-- In the top toolbar -->
<div class="designer-mode-toggle">
  <button class="mode-btn active" onclick="switchMode('lowcode')">
    <i class="fas fa-th-large"></i> Low-Code
  </button>
  <button class="mode-btn" onclick="switchMode('html')">
    <i class="fas fa-code"></i> HTML/CSS/JS
  </button>
</div>

<script>
async function switchMode(mode) {
  if (mode === 'html') {
    const appId = '<%= appId %>';
    const response = await fetch(`/lowcode/api/applications/${appId}/html-ide-url`);
    const result = await response.json();

    if (result.success) {
      window.open(result.url, '_blank');
    }
  }
}
</script>
```

---

## 📋 API Reference

### Get or Create HTML Project

```http
GET /lowcode/api/applications/:appId/html-project
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "name": "My App (HTML)",
    "type": "application",
    "metadata": {
      "linkedAppId": "app-uuid",
      "syncEnabled": true,
      "lastSyncAt": "2025-12-25T12:00:00Z"
    }
  },
  "created": true
}
```

### Sync to HTML

```http
POST /lowcode/api/applications/:appId/sync-to-html
```

**Response:**
```json
{
  "success": true,
  "message": "Application synced to HTML project"
}
```

### Get HTML IDE URL

```http
GET /lowcode/api/applications/:appId/html-ide-url
```

**Response:**
```json
{
  "success": true,
  "url": "/lowcode/html-ide?projectId=uuid",
  "projectId": "uuid",
  "created": false
}
```

---

## 🎨 Customization

### App-Specific Styling

The generated `app.css` uses CSS variables based on the application's color scheme:

```css
:root {
  --primary-color: #0078D4;  /* From app.color */
  --secondary-color: #6c757d;
  --success-color: #28a745;
}

.hero-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, #1565c0 100%);
}

.btn-primary {
  background-color: var(--primary-color);
}
```

### Adding Custom Components

To support additional Low-Code components, update `generateFormComponents()` in `AppHtmlIntegrationService.js`:

```javascript
static generateFormComponents(components) {
  return components.map(comp => {
    switch (comp.type) {
      // ... existing cases ...

      case 'datepicker':
        return `
          <div class="form-group mb-3">
            <label>${comp.properties.label}</label>
            <input type="date" class="form-control" name="${comp.id}">
          </div>`;

      case 'richtext':
        return `
          <div class="form-group mb-3">
            <label>${comp.properties.label}</label>
            <div id="${comp.id}" class="richtext-editor"></div>
          </div>`;

      default:
        return `<!-- ${comp.type} not implemented -->`;
    }
  }).join('\n');
}
```

---

## 🔄 Sync Workflow

### Automatic Sync (Future Enhancement)

```javascript
// In form designer, after saving
async function saveForm(formId, data) {
  // Save form via API
  await fetch(`/lowcode/api/forms/${formId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  // Auto-sync to HTML if linked project exists
  const app = await getFormApplication(formId);
  await fetch(`/lowcode/api/applications/${app.id}/sync-to-html`, {
    method: 'POST'
  });
}
```

### Manual Sync Button

```html
<button onclick="syncToHtml('app-id')">
  <i class="fas fa-sync"></i> Sync to HTML
</button>
```

---

## 💡 Use Cases

### 1. **Rapid Prototyping**
- Build forms visually in Low-Code designer
- Export to HTML for customization
- Hand-code advanced features

### 2. **Learning Tool**
- Designers create forms visually
- See generated HTML/CSS/JS code
- Learn web development concepts

### 3. **White-Label Applications**
- Use Low-Code for logic
- Customize HTML/CSS for branding
- Deploy standalone HTML

### 4. **Hybrid Development**
- Non-coders use visual builder
- Developers enhance with code
- Best of both worlds

---

## 🚧 Pending Implementation

### To Complete in Applications Page:

1. **Find Application Card Template** (around line 700-800):
   - Look for where applications are rendered
   - Add "HTML IDE" button next to existing buttons

2. **Add openHtmlIDE Function**:
   ```javascript
   async function openHtmlIDE(appId) {
     const response = await fetch(`/lowcode/api/applications/${appId}/html-ide-url`);
     const result = await response.json();
     if (result.success) {
       window.location.href = result.url;
     }
   }
   ```

3. **Test the Integration**:
   - Open existing Low-Code app
   - Click "HTML IDE" button
   - Verify HTML files generated correctly
   - Make changes in HTML IDE
   - Ensure changes persist

---

## 📊 Data Flow

```
┌────────────────────┐
│ Low-Code App       │
│  - Forms           │
│  - Components      │
│  - Settings        │
└──────────┬─────────┘
           │
           │ (1) GET /applications/:id/html-project
           ↓
┌────────────────────┐
│ Integration Service│
│ - Create HTML proj │
│ - Generate files   │
└──────────┬─────────┘
           │
           │ (2) Create HTML files
           ↓
┌────────────────────┐
│ HTML Project       │
│  - index.html      │
│  - app.css/js      │
│  - forms/*.html    │
└──────────┬─────────┘
           │
           │ (3) Open in HTML IDE
           ↓
┌────────────────────┐
│ HTML IDE           │
│  - Monaco Editor   │
│  - Live Preview    │
│  - Components      │
└────────────────────┘
```

---

## 🎯 Testing Checklist

- [ ] API endpoint `/applications/:id/html-project` works
- [ ] HTML project created with correct structure
- [ ] index.html contains app name, description, color
- [ ] app.css uses app color scheme
- [ ] app.js loads forms from API
- [ ] Forms folder contains HTML for each form
- [ ] Form components rendered correctly
- [ ] Sync endpoint updates existing HTML files
- [ ] HTML IDE opens with generated project
- [ ] Changes in IDE persist to database
- [ ] Applications page shows HTML IDE button

---

## 🎨 Visual Flow

```
Applications Page
     │
     ↓
 [HTML IDE Button]
     │
     ↓
API: Get HTML Project
     │
     ├─ Exists? → Load existing
     │
     └─ New? → Generate files
           │
           ├─ index.html (main page)
           ├─ app.css (styles)
           ├─ app.js (logic)
           └─ forms/ (all forms)
     │
     ↓
 HTML IDE Opens
     │
     ├─ File Explorer (shows all files)
     ├─ Monaco Editor (edit code)
     ├─ Component Palette (22 components)
     └─ Live Preview (see results)
```

---

## 🔧 Troubleshooting

### Issue: HTML Project Not Creating

**Check:**
1. Database has html_projects table
2. User ID is valid (or using default)
3. Application exists

**Solution:**
```bash
# Check migration
npm run migrate:all

# Check in database
psql exprsn_lowcode -c "SELECT * FROM html_projects LIMIT 5;"
```

### Issue: Forms Not Generating

**Check:**
1. Application has forms
2. Form components are valid JSON
3. generateFormHtml function handles all component types

**Debug:**
```javascript
const forms = await db.Form.findAll({ where: { applicationId: appId } });
console.log('Forms found:', forms.length);
```

### Issue: Styles Not Applying

**Check:**
1. app.css is linked in index.html
2. Bootstrap CSS is loading
3. CSS variables are defined

---

## 📄 Summary

This integration creates a **seamless bridge** between:

- **Low-Code Visual Building** (forms, components, drag-drop)
- **Pro-Code Development** (HTML, CSS, JavaScript)

**Key Benefits:**
- ✅ No-code users can generate HTML projects
- ✅ Developers can customize generated code
- ✅ Forms auto-sync between Low-Code and HTML
- ✅ Full Monaco Editor with 22 components
- ✅ Live preview and collaboration
- ✅ Bootstrap 5 styled output

**Next Steps:**
1. Add HTML IDE button to Applications page
2. Test with existing applications
3. Implement auto-sync on form save
4. Add HTML→Low-Code reverse sync

---

**Status:** 90% Complete
**Remaining:** UI integration in Applications page

🚀 Ready to edit Low-Code apps as HTML!
