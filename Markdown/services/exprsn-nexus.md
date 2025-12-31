# Exprsn Nexus (exprsn-nexus)

**Version:** 1.0.0
**Port:** 3011
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Nexus** is the groups, events, and collaboration service that provides community building features including groups, events, calendar management, and CalDAV/CardDAV integration.

---

## Key Features

### Groups
- **Public/Private Groups** - Visibility controls
- **Group Discussions** - Forum-style discussions
- **Member Management** - Roles and permissions
- **Group Files** - Shared file storage
- **Group Calendar** - Shared event calendar

### Events
- **Event Creation** - Create and manage events
- **RSVP System** - Track attendance
- **Event Reminders** - Notification system
- **Recurring Events** - Repeat patterns
- **Virtual Events** - Online event support
- **Event Check-In** - QR code check-in

### Calendar (CalDAV)
- **CalDAV Server** - Standard calendar protocol
- **CardDAV Server** - Contact sync protocol
- **Calendar Sharing** - Share calendars
- **Free/Busy** - Availability checking
- **Time Zones** - Multi-timezone support

### Collaboration
- **Shared Workspaces** - Team collaboration
- **Task Management** - Group task tracking
- **Polls & Voting** - Group decision making
- **Announcements** - Group notifications

---

## API Endpoints

#### `POST /api/groups`
Create group.

**Request:**
```json
{
  "name": "JavaScript Developers",
  "description": "Group for JS enthusiasts",
  "visibility": "public",
  "allowMemberInvites": true
}
```

#### `POST /api/groups/:id/members`
Add group member.

#### `POST /api/events`
Create event.

**Request:**
```json
{
  "title": "Meetup: Node.js Best Practices",
  "description": "Discussion about Node.js",
  "startDate": "2024-02-01T18:00:00Z",
  "endDate": "2024-02-01T20:00:00Z",
  "location": "123 Main St, SF",
  "groupId": "group-uuid",
  "maxAttendees": 50
}
```

#### `POST /api/events/:id/rsvp`
RSVP to event.

**Request:**
```json
{
  "response": "yes"
}
```

---

## Configuration

```env
PORT=3011
DB_NAME=exprsn_nexus
CALDAV_ENABLED=true
CARDDAV_ENABLED=true
MAX_GROUP_MEMBERS=10000
EVENT_REMINDER_HOURS=24,1
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
