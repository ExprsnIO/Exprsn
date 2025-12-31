# Calendar & File Storage Integration - Complete Architecture

## 🎯 Overview

The Exprsn ecosystem now has a **unified calendar and file storage system** that integrates across all 23 services, providing CalDAV/CardDAV/WebDAV support, centralized file management, and cross-service attachment capabilities.

## 📊 Existing Infrastructure

### ✅ Already Implemented

#### 1. **exprsn-filevault** (Port 3007) - Centralized File Storage
- ✅ S3/Disk/IPFS storage backends
- ✅ File versioning and deduplication (SHA-256 hashing)
- ✅ WebDAV support for file access
- ✅ Thumbnail generation
- ✅ Share links with expiration and password protection
- ✅ Storage quotas per user
- ✅ Virus scanning integration
- ✅ Encryption at rest

**Models:**
- `File` - Core file metadata
- `FileVersion` - Version history
- `FileBlob` - Binary data storage
- `Directory` - Folder structure
- `ShareLink` - Public/private sharing
- `StorageQuota` - User/org limits
- `Thumbnail` - Image previews
- `Download` - Download tracking

#### 2. **exprsn-nexus** (Port 3011) - Calendar & Events
- ✅ CalDAV service (RFC 4791)
- ✅ CardDAV service (RFC 6352)
- ✅ iCal generation and parsing
- ✅ Event management with RSVP
- ✅ Group calendars
- ✅ User calendars
- ✅ Calendar subscriptions
- ✅ Multi-calendar support

**Models:**
- `Event` - Calendar events
- `EventAttendee` - Attendee/RSVP tracking
- `Group` - Groups with calendars
- `GroupMembership` - Calendar permissions

#### 3. **@exprsn/shared** - Common Infrastructure
- ✅ WebDAV middleware (PROPFIND, PROPPATCH, LOCK, etc.)
- ✅ WebDAV lock manager
- ✅ XML parsing and generation
- ✅ ETag generation
- ✅ Authentication middleware

#### 4. **Existing Attachment Patterns**
- ✅ exprsn-spark: Message attachments
- ✅ exprsn-gallery: Media files
- ✅ exprsn-svr/forge: Document attachments (CRM, ERP, Groupware)

## 🆕 New Integration Layer

### Unified Attachment Service (`@exprsn/shared/services/attachmentService.js`)

**Purpose**: Provides a consistent API for all services to upload, download, and manage files through exprsn-filevault.

**Features:**
- File upload with automatic FileVault integration
- Download and streaming
- Thumbnail generation
- Share link creation
- File validation (size, MIME type, extension)
- Multiple file uploads
- SHA-256 hash generation for deduplication
- Cross-service file access

**Usage Example:**
```javascript
const { createAttachmentService } = require('@exprsn/shared/services/attachmentService');

const attachmentService = createAttachmentService({
  serviceName: 'exprsn-timeline',
  serviceToken: process.env.SERVICE_TOKEN
});

// Upload file
const file = await attachmentService.uploadFile(req.file, {
  userId: req.user.id,
  filename: 'document.pdf',
  mimeType: 'application/pdf',
  visibility: 'private',
  tags: ['important', 'work'],
  metadata: {
    postId: '123',
    category: 'attachments'
  }
});

// Create share link
const shareLink = await attachmentService.createShareLink(file.id, {
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  maxDownloads: 10,
  password: 'secret123'
});

// Get thumbnail
const thumbnailUrl = attachmentService.getThumbnailUrl(file.id, {
  width: 300,
  height: 300
});
```

## 🗂️ Service Integration Plan

### Phase 1: Timeline & Social (PRIORITY)

#### exprsn-timeline (Port 3004)
**Add Post Attachments:**
```javascript
// Model enhancement
Post.hasMany(Attachment, {
  foreignKey: 'entityId',
  constraints: false,
  scope: {
    entityType: 'post'
  }
});

// Route
router.post('/api/posts/:postId/attachments',
  validateCAToken,
  upload.array('files', 10),
  async (req, res) => {
    const files = await attachmentService.uploadMultipleFiles(req.files, {
      userId: req.user.id,
      visibility: req.body.visibility || 'public',
      tags: ['post-attachment'],
      metadata: { postId: req.params.postId }
    });

    // Create attachment records
    await Attachment.bulkCreate(files.map(f => ({
      entityType: 'post',
      entityId: req.params.postId,
      fileId: f.id,
      filename: f.filename,
      mimeType: f.mimeType,
      size: f.size,
      url: f.url
    })));

    res.json({ success: true, files });
  }
);
```

#### exprsn-spark (Port 3002)
**Already has attachments** - Update to use unified service:
```javascript
// Replace direct file handling with attachmentService
const file = await attachmentService.uploadFile(req.file, {
  userId: req.user.id,
  filename: req.file.originalname,
  mimeType: req.file.mimetype,
  visibility: 'private',
  tags: ['message-attachment'],
  metadata: {
    messageId: message.id,
    conversationId: message.conversationId
  }
});
```

### Phase 2: Business Applications

#### exprsn-svr/forge (Port 5001)
**CRM Attachments:**
```javascript
// Company documents
POST /api/forge/crm/companies/:id/attachments
GET  /api/forge/crm/companies/:id/attachments
DELETE /api/forge/crm/companies/:id/attachments/:attachmentId

// Contract files
POST /api/forge/crm/contracts/:id/attachments

// Support ticket attachments
POST /api/forge/crm/tickets/:id/attachments
```

**ERP Document Management:**
```javascript
// Invoice PDFs
POST /api/forge/erp/invoices/:id/attachments

// Purchase order documents
POST /api/forge/erp/purchase-orders/:id/attachments

// Asset documentation
POST /api/forge/erp/assets/:id/attachments
```

**Groupware Integration:**
```javascript
// Calendar event attachments
POST /api/forge/groupware/events/:id/attachments

// Task file attachments
POST /api/forge/groupware/tasks/:id/attachments

// Wiki page file uploads
POST /api/forge/groupware/wiki/:id/attachments

// Document version control
POST /api/forge/groupware/documents/:id/versions
```

### Phase 3: Content & Media

#### exprsn-gallery (Port 3008)
**Already has media management** - Enhance with:
- Album cover images
- Photo metadata extraction (EXIF)
- Video thumbnail generation
- Media collections sharing

#### exprsn-moderator (Port 3006)
**Add evidence attachments:**
```javascript
// Attach screenshots/evidence to moderation cases
POST /api/moderation/cases/:id/evidence
```

### Phase 4: Collaboration

#### exprsn-nexus (Port 3011)
**Event Attachments:**
```javascript
// Add files to events (agendas, presentations, etc.)
POST /api/events/:id/attachments
GET  /api/events/:id/attachments

// Group shared files
POST /api/groups/:id/files
GET  /api/groups/:id/files
```

## 📅 CalDAV/CardDAV Architecture

### CalDAV Endpoints (exprsn-nexus)

```
# Principal/User Calendar Discovery
PROPFIND /caldav/users/:userId/

# Get User Calendar
GET /caldav/users/:userId/calendar.ics

# Get Group Calendar
GET /caldav/groups/:groupId/calendar.ics

# Sync Calendar (REPORT method)
REPORT /caldav/users/:userId/
REPORT /caldav/groups/:groupId/

# Individual Event
GET /caldav/events/:eventId.ics
PUT /caldav/events/:eventId.ics
DELETE /caldav/events/:eventId.ics
```

### CardDAV Endpoints (exprsn-nexus)

```
# Address Book Discovery
PROPFIND /carddav/users/:userId/

# Get Contacts
GET /carddav/users/:userId/contacts.vcf
GET /carddav/groups/:groupId/members.vcf

# Individual Contact
GET /carddav/contacts/:contactId.vcf
PUT /carddav/contacts/:contactId.vcf
DELETE /carddav/contacts/:contactId.vcf
```

### Integration with Business Apps

#### exprsn-forge Calendar Integration

```javascript
// Create calendar event from CRM activity
POST /api/forge/crm/activities
{
  "title": "Client Meeting",
  "description": "Quarterly review with Acme Corp",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T15:00:00Z",
  "location": "Conference Room A",
  "attendees": ["user1", "user2"],
  "relatedTo": {
    "type": "company",
    "id": "company-uuid"
  },
  "syncToCalendar": true // Creates event in exprsn-nexus
}

// Automatically syncs to:
// - User personal calendars (CalDAV)
// - Google Calendar (via OAuth)
// - Outlook Calendar (via Graph API)
// - Apple Calendar (via CalDAV)
```

## 🔗 WebDAV File Access

### Mount as Network Drive

**macOS Finder:**
```
Go → Connect to Server
Server: http://localhost:3007/webdav/users/:userId
Username: user@example.com
Password: [CA Token]
```

**Windows Explorer:**
```
Map Network Drive
Folder: \\localhost@3007\webdav\users\:userId
```

**Linux (davfs2):**
```bash
sudo mount -t davfs http://localhost:3007/webdav/users/:userId /mnt/exprsn
```

### WebDAV Operations

```
PROPFIND  /webdav/users/:userId/          # List files/folders
GET       /webdav/users/:userId/file.pdf  # Download
PUT       /webdav/users/:userId/file.pdf  # Upload
DELETE    /webdav/users/:userId/file.pdf  # Delete
MKCOL     /webdav/users/:userId/newfolder # Create folder
COPY      /webdav/...                     # Copy file
MOVE      /webdav/...                     # Move file
LOCK      /webdav/...                     # Lock for editing
UNLOCK    /webdav/...                     # Release lock
```

## 🎨 UI Components

### File Picker Component (React)

```jsx
import { FilePicker } from '@exprsn/ui-components';

<FilePicker
  multiple={true}
  maxSize={100 * 1024 * 1024} // 100 MB
  accept=".pdf,.doc,.docx,image/*"
  onSelect={(files) => handleFileSelect(files)}
  onUpload={(uploadedFiles) => handleUploadComplete(uploadedFiles)}
  showPreview={true}
  enableDragDrop={true}
/>
```

### File Browser Component

```jsx
import { FileBrowser } from '@exprsn/ui-components';

<FileBrowser
  userId={currentUser.id}
  directory="/"
  view="grid" // or "list"
  sortBy="name" // or "date", "size", "type"
  onFileSelect={(file) => handleFileSelect(file)}
  onFolderNavigate={(path) => handleNavigation(path)}
  enableContextMenu={true}
  enableSearch={true}
/>
```

### Calendar Component

```jsx
import { Calendar } from '@exprsn/ui-components';

<Calendar
  view="month" // or "week", "day", "agenda"
  events={events}
  onEventClick={(event) => handleEventClick(event)}
  onDateSelect={(date) => handleDateSelect(date)}
  enableDragDrop={true}
  calendarUrl="http://localhost:3011/caldav/users/:userId/calendar.ics"
/>
```

## 🔒 Security & Permissions

### File Access Control

```javascript
// File visibility levels
- 'private': Only owner can access
- 'shared': Owner + specific users/groups
- 'public': Anyone with link

// Permission model
{
  userId: 'owner-uuid',
  visibility: 'shared',
  sharedWith: [
    { type: 'user', id: 'user-uuid', permissions: ['read', 'write'] },
    { type: 'group', id: 'group-uuid', permissions: ['read'] }
  ]
}
```

### Calendar Permissions

```javascript
// Event visibility
- Group events: Visible to all group members
- Private events: Only owner + invited attendees
- Public events: Listed in public calendar feeds

// CalDAV authentication
- CA Token (preferred)
- Basic Auth (username/password)
- OAuth (Google, Microsoft)
```

## 📊 Database Schema

### Generic Attachment Model (All Services)

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Polymorphic association
  entity_type VARCHAR(50) NOT NULL, -- 'post', 'message', 'ticket', etc.
  entity_id UUID NOT NULL,

  -- FileVault reference
  file_id UUID NOT NULL,

  -- Denormalized for performance
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Metadata
  upload_source VARCHAR(50), -- 'web', 'mobile', 'api'
  uploaded_by UUID NOT NULL,

  -- Flags
  is_primary BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'deleted', 'quarantined'

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_file (file_id),
  INDEX idx_uploaded_by (uploaded_by),
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);
```

### Calendar Event Attachments

```sql
-- Add to Event model in exprsn-nexus
ALTER TABLE events ADD COLUMN attachments JSONB DEFAULT '[]';

-- Or separate table
CREATE TABLE event_attachments (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_id UUID NOT NULL,
  filename VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_event (event_id)
);
```

## 🔄 Migration Strategy

### Step 1: Add Attachment Service (DONE)
✅ Created `@exprsn/shared/services/attachmentService.js`

### Step 2: Update Existing Services
```javascript
// For each service with file uploads:
1. Install: npm install form-data
2. Import: const { createAttachmentService } = require('@exprsn/shared/services/attachmentService');
3. Initialize: const attachmentService = createAttachmentService({ serviceName: 'exprsn-timeline' });
4. Replace direct file handling with attachmentService.uploadFile()
5. Add attachment model/table
6. Update routes to return file URLs
```

### Step 3: Calendar Sync
```javascript
// In exprsn-forge CRM:
const calendarService = require('./services/calendarService');

// When creating CRM activity with calendar flag
if (activity.syncToCalendar) {
  await calendarService.createEvent({
    title: activity.title,
    description: activity.description,
    startTime: activity.scheduledAt,
    duration: activity.duration || 60,
    attendees: activity.attendees,
    location: activity.location,
    metadata: {
      source: 'crm-activity',
      activityId: activity.id,
      companyId: activity.companyId
    }
  });
}
```

## 🎯 Next Steps

1. **Phase 1** - Core Services (Week 1)
   - ✅ Create unified attachment service
   - ⏳ Add attachments to exprsn-timeline posts
   - ⏳ Update exprsn-spark to use unified service
   - ⏳ Add attachments to exprsn-nexus events

2. **Phase 2** - Business Apps (Week 2)
   - ⏳ Add document management to exprsn-forge CRM
   - ⏳ Add file attachments to ERP modules
   - ⏳ Integrate calendar sync with CRM activities
   - ⏳ Add WebDAV access to groupware documents

3. **Phase 3** - UI Components (Week 3)
   - ⏳ Build FilePicker React component
   - ⏳ Build FileBrowser component
   - ⏳ Build Calendar component with CalDAV sync
   - ⏳ Add to exprsn-svr UI library

4. **Phase 4** - Advanced Features (Week 4)
   - ⏳ Cross-service file search
   - ⏳ Global file deduplication
   - ⏳ Automated file retention policies
   - ⏳ Advanced calendar features (recurring events, reminders)

## 📚 API Documentation

### Attachment Service Methods

```typescript
interface AttachmentService {
  // File operations
  uploadFile(file: File, options: UploadOptions): Promise<FileMetadata>;
  downloadFile(fileId: string): Promise<Buffer>;
  getFileMetadata(fileId: string): Promise<FileMetadata>;
  deleteFile(fileId: string): Promise<boolean>;

  // Sharing
  createShareLink(fileId: string, options: ShareOptions): Promise<ShareLink>;
  getThumbnailUrl(fileId: string, options: ThumbnailOptions): string;
  getPreviewUrl(fileId: string): string;
  getDownloadUrl(fileId: string): string;

  // Batch operations
  uploadMultipleFiles(files: File[], options: UploadOptions): Promise<FileMetadata[]>;

  // Validation
  validateFile(file: File, rules: ValidationRules): ValidationResult;
  generateFileHash(file: Buffer | string): Promise<string>;
}

interface UploadOptions {
  userId: string;
  filename?: string;
  mimeType?: string;
  visibility?: 'private' | 'shared' | 'public';
  directory?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  url: string;
  previewUrl: string;
  thumbnailUrl: string;
  storageBackend: 'disk' | 's3' | 'ipfs';
  visibility: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🌟 Benefits

1. **Unified Storage**: All files in one place (exprsn-filevault)
2. **Deduplication**: SHA-256 hashing prevents duplicate storage
3. **Versioning**: Track file changes over time
4. **WebDAV Access**: Mount as network drive
5. **CalDAV/CardDAV**: Standard calendar sync with all clients
6. **Cross-Service**: Share files between services seamlessly
7. **Security**: Encryption, virus scanning, access control
8. **Scalability**: S3/IPFS support for unlimited storage

---

**Implementation Status**: 🟡 In Progress
**Priority**: 🔴 High
**Completion**: 15% (Attachment Service Created)
