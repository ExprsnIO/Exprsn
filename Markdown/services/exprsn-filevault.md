# Exprsn FileVault (exprsn-filevault)

**Version:** 1.0.0
**Port:** 3007
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn FileVault** is the centralized file storage and management service that provides secure file uploads, downloads, and media processing. It supports multiple storage backends (S3, local disk, IPFS) with automatic CDN integration and intelligent content delivery.

---

## Key Features

### File Management
- **Multi-Backend Storage** - S3, local disk, IPFS
- **File Upload** - Multipart upload with progress tracking
- **File Download** - Secure signed URLs
- **File Versioning** - Keep file history
- **Folder Organization** - Hierarchical folder structure
- **File Sharing** - Share files with permissions
- **Bulk Operations** - Mass upload/download/delete

### Media Processing
- **Image Optimization** - Automatic compression and resizing
- **Thumbnail Generation** - Multiple size variants
- **Image Formats** - Convert between formats (JPEG, PNG, WebP)
- **Video Transcoding** - Multiple quality levels
- **PDF Processing** - PDF thumbnail and text extraction
- **Metadata Extraction** - EXIF, ID3 tags

### Security
- **Virus Scanning** - ClamAV integration
- **Access Control** - Granular permissions
- **Signed URLs** - Temporary access links
- **Encryption at Rest** - File encryption
- **Encryption in Transit** - TLS/SSL
- **Secure Deletion** - Permanent file removal

### CDN Integration
- **CloudFront** - AWS CDN integration
- **Cloudflare** - Cloudflare CDN support
- **Custom CDN** - Custom CDN configuration
- **Cache Control** - Smart caching strategies
- **Purge Cache** - Invalidate cached files

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (`exprsn_filevault`)
- **Storage:** AWS S3, Local FS, IPFS
- **Media:** Sharp (images), FFmpeg (video)
- **Upload:** Multer
- **Virus Scan:** ClamAV

### Database Schema

**Tables:**
- `files` - File metadata
- `folders` - Folder structure
- `file_versions` - Version history
- `file_shares` - Sharing permissions
- `upload_sessions` - Multipart uploads
- `processing_jobs` - Media processing queue

---

## API Endpoints

### File Upload

#### `POST /api/upload`
Upload single file.

**Request:**
```
Content-Type: multipart/form-data
file: <binary>
folderId: optional-folder-uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "filename": "image.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "url": "https://cdn.exprsn.io/files/abc123.jpg",
    "thumbnails": {
      "small": "https://cdn.exprsn.io/files/abc123_sm.jpg",
      "medium": "https://cdn.exprsn.io/files/abc123_md.jpg",
      "large": "https://cdn.exprsn.io/files/abc123_lg.jpg"
    },
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `POST /api/upload/multiple`
Upload multiple files.

#### `POST /api/upload/url`
Upload from URL.

**Request:**
```json
{
  "url": "https://example.com/image.jpg",
  "filename": "downloaded-image.jpg"
}
```

---

### File Management

#### `GET /api/files`
List user's files.

**Query Parameters:**
- `folderId` - Filter by folder
- `type` - Filter by file type (image, video, document)
- `search` - Search by filename
- `sortBy` - name, size, date
- `order` - asc, desc

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "filename": "presentation.pdf",
        "size": 2048000,
        "mimeType": "application/pdf",
        "url": "https://cdn.exprsn.io/files/xyz789.pdf",
        "thumbnail": "https://cdn.exprsn.io/files/xyz789_thumb.jpg",
        "folderId": "folder-uuid",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 156
  }
}
```

#### `GET /api/files/:id`
Get file details.

#### `GET /api/files/:id/download`
Download file (returns signed URL).

#### `PUT /api/files/:id`
Update file metadata.

**Request:**
```json
{
  "filename": "new-name.jpg",
  "description": "Updated description",
  "tags": ["vacation", "2024"]
}
```

#### `DELETE /api/files/:id`
Delete file.

---

### Folder Management

#### `GET /api/folders`
List folders.

#### `POST /api/folders`
Create folder.

**Request:**
```json
{
  "name": "Projects",
  "parentId": "parent-folder-uuid",
  "description": "Project files"
}
```

#### `PUT /api/folders/:id`
Update folder.

#### `DELETE /api/folders/:id`
Delete folder (and contents).

---

### File Sharing

#### `POST /api/files/:id/share`
Share file.

**Request:**
```json
{
  "users": ["user-uuid-1", "user-uuid-2"],
  "permissions": "read",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareId": "uuid",
    "publicUrl": "https://exprsn.io/share/abc123xyz",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

#### `GET /share/:shareId`
Access shared file.

#### `DELETE /api/files/:id/share/:shareId`
Revoke share.

---

### Media Processing

#### `POST /api/files/:id/process`
Process media file.

**Request:**
```json
{
  "operation": "resize",
  "params": {
    "width": 800,
    "height": 600,
    "format": "webp"
  }
}
```

#### `GET /api/files/:id/thumbnail`
Get file thumbnail.

**Query Parameters:**
- `size` - small, medium, large (default: medium)

---

### Storage Management

#### `GET /api/storage/usage`
Get storage usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "used": 5368709120,
    "limit": 10737418240,
    "usedPercentage": 50,
    "fileCount": 1234,
    "byType": {
      "images": 3221225472,
      "videos": 1610612736,
      "documents": 536870912
    }
  }
}
```

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=3007
SERVICE_NAME=exprsn-filevault

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_filevault
DB_USER=postgres
DB_PASSWORD=your_password

# Storage Backend
STORAGE_BACKEND=s3|local|ipfs
STORAGE_PATH=/var/exprsn/files

# AWS S3
S3_BUCKET=exprsn-files
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret

# IPFS
IPFS_API_URL=http://localhost:5001

# CDN
CDN_ENABLED=true
CDN_URL=https://cdn.exprsn.io
CDN_PROVIDER=cloudfront|cloudflare

# File Limits
MAX_FILE_SIZE=104857600
MAX_UPLOAD_FILES=10
ALLOWED_FILE_TYPES=image/*,video/*,application/pdf

# Image Processing
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_MAX_WIDTH=2048
IMAGE_MAX_HEIGHT=2048
IMAGE_QUALITY=85
THUMBNAIL_SIZES=small:200x200,medium:400x400,large:800x800

# Video Processing
VIDEO_TRANSCODING_ENABLED=true
VIDEO_QUALITIES=360p,720p,1080p

# Security
VIRUS_SCAN_ENABLED=true
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
FILE_ENCRYPTION_ENABLED=false

# Signed URLs
SIGNED_URL_EXPIRY_SECONDS=3600

# Service Integration
CA_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### Upload File with Progress

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadFileWithProgress(filePath, token) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    'http://localhost:3007/api/upload',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    }
  );

  return response.data.data;
}
```

### Create Shared Link

```javascript
async function shareFile(fileId, token) {
  const response = await axios.post(
    `http://localhost:3007/api/files/${fileId}/share`,
    {
      permissions: 'read',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const { publicUrl } = response.data.data;
  console.log('Share link:', publicUrl);
  return publicUrl;
}
```

---

## Development

```bash
cd src/exprsn-filevault
npm install
npm run migrate
npm run dev
```

---

## Dependencies

- **express** (^4.18.2)
- **multer** (^1.4.5-lts.1)
- **sharp** (^0.33.1)
- **aws-sdk** (^2.1000.0)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
