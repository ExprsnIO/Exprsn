# Exprsn Gallery (exprsn-gallery)

**Version:** 1.0.0
**Port:** 3008
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Gallery** is the media gallery and album management service that allows users to organize photos and videos into albums, create slideshows, and share collections.

---

## Key Features

### Gallery Management
- **Photo Albums** - Organize photos into albums
- **Video Collections** - Video playlist management
- **Mixed Media** - Photos and videos in one album
- **Album Covers** - Custom album thumbnails
- **Album Sharing** - Share albums with permissions

### Media Features
- **Slideshow** - Auto-play presentations
- **EXIF Data** - Photo metadata display
- **Geolocation** - Location-based galleries
- **Tagging** - Tag people and objects
- **Comments** - Comment on media items
- **Reactions** - Like and react to media

### Organization
- **Folders** - Hierarchical organization
- **Smart Albums** - Auto-populated albums
- **Search** - Find media by date, location, tags
- **Favorites** - Mark favorite items
- **Collections** - Group related albums

---

## API Endpoints

#### `GET /api/galleries`
List user's galleries.

#### `POST /api/galleries`
Create gallery.

**Request:**
```json
{
  "name": "Vacation 2024",
  "description": "Summer vacation photos",
  "visibility": "public",
  "coverImageId": "image-uuid"
}
```

#### `POST /api/galleries/:id/items`
Add media to gallery.

**Request:**
```json
{
  "fileIds": ["file-uuid-1", "file-uuid-2"]
}
```

#### `GET /api/galleries/:id/items`
Get gallery items.

---

## Configuration

```env
PORT=3008
DB_NAME=exprsn_gallery
FILEVAULT_URL=http://localhost:3007
SLIDESHOW_INTERVAL=5000
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
