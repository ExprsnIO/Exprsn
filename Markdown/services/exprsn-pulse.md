# Exprsn Pulse (exprsn-pulse)

**Version:** 1.0.0
**Port:** 3012
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Pulse** is the analytics and metrics collection service that tracks user behavior, system performance, and business metrics across the entire Exprsn platform.

---

## Key Features

### Analytics Collection
- **Event Tracking** - User actions and interactions
- **Page Views** - Page visit tracking
- **User Sessions** - Session duration and flow
- **Conversion Tracking** - Goal completion
- **Custom Events** - Application-specific events

### Metrics & Reporting
- **Real-Time Dashboards** - Live metrics
- **Historical Reports** - Trend analysis
- **User Analytics** - User behavior insights
- **Performance Metrics** - System performance
- **Business Metrics** - Revenue, engagement, growth

### Data Visualization
- **Charts & Graphs** - Visual data representation
- **Heatmaps** - User interaction patterns
- **Funnel Analysis** - Conversion funnels
- **Cohort Analysis** - User cohort tracking
- **A/B Test Results** - Experiment analytics

---

## API Endpoints

#### `POST /api/events`
Track event.

**Request:**
```json
{
  "event": "post_created",
  "userId": "user-uuid",
  "properties": {
    "postId": "post-uuid",
    "contentLength": 250,
    "hasMedia": true
  }
}
```

#### `GET /api/analytics/dashboard`
Get dashboard metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 12543,
    "pageViews": 456789,
    "avgSessionDuration": 420,
    "conversionRate": 0.045
  }
}
```

#### `GET /api/analytics/users/:userId`
Get user analytics.

---

## Configuration

```env
PORT=3012
DB_NAME=exprsn_pulse
ELASTICSEARCH_ENABLED=true
REAL_TIME_ENABLED=true
DATA_RETENTION_DAYS=90
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
