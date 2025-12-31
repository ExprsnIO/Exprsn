# Exprsn Herald (exprsn-herald)

**Version:** 1.0.0
**Port:** 3014
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Herald** is the multi-channel notification service that delivers real-time notifications across email, SMS, push notifications, and in-app channels. It provides a unified API for sending notifications with intelligent delivery optimization and user preference management.

---

## Key Features

### Notification Channels
- **In-App Notifications** - Real-time browser notifications
- **Email** - Multi-provider email delivery (SendGrid, SES, SMTP)
- **SMS** - Twilio integration
- **Push Notifications** - Web Push, mobile push (FCM, APNS)
- **Webhook** - Custom webhook delivery
- **Slack** - Slack integration

### Notification Types
- **System Notifications** - Platform announcements
- **Social Notifications** - Likes, comments, follows
- **Transaction Notifications** - Order confirmations, receipts
- **Security Alerts** - Login attempts, password changes
- **Marketing** - Promotional messages
- **Custom** - User-defined notification types

### Delivery Management
- **Batching** - Group similar notifications
- **Scheduling** - Send at specific time
- **Priority Queues** - Urgent vs. normal delivery
- **Retry Logic** - Automatic retry on failure
- **Delivery Status** - Track sent, delivered, failed, read
- **Throttling** - Rate limit notification sending

### User Preferences
- **Channel Preferences** - Enable/disable per channel
- **Type Preferences** - Filter by notification type
- **Quiet Hours** - Do not disturb periods
- **Frequency Limits** - Max notifications per period
- **Digest Mode** - Batched notification summaries

### Template System
- **Handlebars Templates** - Dynamic content rendering
- **Multi-Language** - i18n support
- **Template Versioning** - A/B testing support
- **Fallback Templates** - Default templates
- **Preview** - Test template rendering

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (`exprsn_herald`)
- **Queues:** Bull (Redis-backed)
- **Templates:** Handlebars
- **Email:** SendGrid, AWS SES, Nodemailer
- **SMS:** Twilio
- **Push:** web-push, firebase-admin

### Database Schema

**Tables:**
- `notifications` - Notification records
- `notification_templates` - Template definitions
- `user_preferences` - User notification settings
- `delivery_logs` - Delivery tracking
- `notification_queues` - Pending notifications
- `push_subscriptions` - Push notification subscriptions
- `email_templates` - Email-specific templates
- `sms_templates` - SMS-specific templates

---

## API Endpoints

### Send Notifications

#### `POST /api/notifications/send`
Send notification to users.

**Request:**
```json
{
  "recipientIds": ["user-uuid-1", "user-uuid-2"],
  "type": "post_like",
  "title": "New Like on Your Post",
  "message": "{{likerName}} liked your post",
  "data": {
    "postId": "post-uuid",
    "likerId": "liker-uuid",
    "likerName": "John Doe"
  },
  "channels": ["in_app", "push"],
  "priority": "normal",
  "actionUrl": "/posts/post-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "recipientCount": 2,
    "queued": true,
    "estimatedDelivery": "2024-01-01T00:00:05Z"
  }
}
```

#### `POST /api/notifications/send-email`
Send email notification.

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Exprsn",
  "template": "welcome_email",
  "data": {
    "userName": "John Doe",
    "activationLink": "https://..."
  }
}
```

#### `POST /api/notifications/send-sms`
Send SMS notification.

**Request:**
```json
{
  "to": "+1234567890",
  "message": "Your verification code is: 123456"
}
```

#### `POST /api/notifications/send-bulk`
Send bulk notifications (up to 10,000 recipients).

**Request:**
```json
{
  "recipientIds": ["uuid1", "uuid2", "..."],
  "type": "announcement",
  "title": "Platform Update",
  "message": "We've released new features!",
  "channels": ["in_app", "email"],
  "scheduleAt": "2024-01-01T12:00:00Z"
}
```

---

### Notification Management

#### `GET /api/notifications`
Get user's notifications.

**Query Parameters:**
- `type` - Filter by type
- `read` - Filter by read status (true/false)
- `channel` - Filter by channel
- `limit` - Results per page
- `cursor` - Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "post_like",
        "title": "New Like on Your Post",
        "message": "John Doe liked your post",
        "read": false,
        "actionUrl": "/posts/post-uuid",
        "data": {
          "postId": "post-uuid",
          "likerId": "user-uuid"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "unreadCount": 15,
    "nextCursor": "abc123",
    "hasMore": true
  }
}
```

#### `GET /api/notifications/:id`
Get notification details.

#### `PUT /api/notifications/:id/read`
Mark notification as read.

#### `PUT /api/notifications/read-all`
Mark all notifications as read.

#### `DELETE /api/notifications/:id`
Delete notification.

#### `DELETE /api/notifications/clear`
Clear all notifications.

---

### User Preferences

#### `GET /api/preferences`
Get user's notification preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": {
      "in_app": true,
      "email": true,
      "sms": false,
      "push": true
    },
    "types": {
      "post_like": true,
      "comment": true,
      "follow": true,
      "message": true,
      "announcement": true,
      "marketing": false
    },
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/New_York"
    },
    "digest": {
      "enabled": false,
      "frequency": "daily",
      "time": "09:00"
    }
  }
}
```

#### `PUT /api/preferences`
Update notification preferences.

**Request:**
```json
{
  "channels": {
    "email": false
  },
  "types": {
    "marketing": false
  },
  "quietHours": {
    "enabled": true,
    "start": "23:00",
    "end": "07:00"
  }
}
```

---

### Push Notifications

#### `POST /api/push/subscribe`
Subscribe to push notifications.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "base64-key",
    "auth": "base64-auth"
  }
}
```

#### `DELETE /api/push/unsubscribe`
Unsubscribe from push notifications.

---

### Templates

#### `GET /api/templates`
List notification templates.

#### `POST /api/templates`
Create notification template.

**Request:**
```json
{
  "name": "welcome_email",
  "type": "email",
  "subject": "Welcome to Exprsn, {{userName}}!",
  "bodyHtml": "<h1>Welcome {{userName}}</h1><p>Click here to get started: <a href=\"{{activationLink}}\">Activate</a></p>",
  "bodyText": "Welcome {{userName}}! Click here to activate: {{activationLink}}"
}
```

#### `GET /api/templates/:id`
Get template details.

#### `PUT /api/templates/:id`
Update template.

#### `POST /api/templates/:id/test`
Test template rendering.

**Request:**
```json
{
  "data": {
    "userName": "John Doe",
    "activationLink": "https://..."
  }
}
```

---

## Configuration

```env
# Application
NODE_ENV=development|production
PORT=3014
SERVICE_NAME=exprsn-herald

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_herald
DB_USER=postgres
DB_PASSWORD=your_password

# Redis/Bull
REDIS_HOST=localhost
REDIS_PORT=6379
QUEUE_CONCURRENCY=20

# Email Providers
EMAIL_PROVIDER=sendgrid|ses|smtp
SENDGRID_API_KEY=your-key
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASSWORD=password
EMAIL_FROM=noreply@exprsn.io

# SMS (Twilio)
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications
PUSH_ENABLED=true
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:admin@exprsn.io
FCM_SERVER_KEY=your-fcm-key

# Notification Limits
MAX_BULK_RECIPIENTS=10000
MAX_NOTIFICATIONS_PER_HOUR=100
DIGEST_BATCH_SIZE=50

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_MS=5000

# Service Integration
CA_URL=http://localhost:3000
AUTH_URL=http://localhost:3001

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### Send Notification from Service

```javascript
const axios = require('axios');

async function notifyPostLike(postId, likerId, postOwnerId, token) {
  await axios.post('http://localhost:3014/api/notifications/send', {
    recipientIds: [postOwnerId],
    type: 'post_like',
    title: 'New Like',
    message: 'Someone liked your post',
    data: {
      postId,
      likerId
    },
    channels: ['in_app', 'push'],
    actionUrl: `/posts/${postId}`
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

### Real-Time Notification Listener

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3014', {
  auth: { token: 'your-ca-token' }
});

socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  showNotificationBanner(notification);
});

socket.on('notification_read', (data) => {
  console.log('Notification marked read:', data.notificationId);
});
```

---

## Development

```bash
cd src/exprsn-herald
npm install
npm run migrate
npm run seed
npm run dev

# Start worker (separate terminal)
npm run worker
```

---

## Dependencies

- **express** (^4.18.2)
- **bull** (^4.12.0)
- **socket.io** (^4.7.2)
- **handlebars** (^4.7.8)
- **@sendgrid/mail** (^7.7.0)
- **@aws-sdk/client-ses** (^3.450.0)
- **nodemailer** (^6.9.7)
- **twilio** (^4.19.0)
- **web-push** (^3.6.6)
- **@exprsn/shared** (file:../shared)

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
