# Exprsn Live (exprsn-live)

**Version:** 1.0.0
**Port:** 3009
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Live** is the live streaming service that enables users to broadcast live video streams, host virtual events, and engage with audiences in real-time.

---

## Key Features

### Live Streaming
- **RTMP Ingest** - Standard streaming protocol
- **WebRTC Support** - Browser-based streaming
- **HLS Playback** - Adaptive bitrate streaming
- **Multi-Quality** - Multiple resolution options
- **DVR Mode** - Rewind live streams

### Interactive Features
- **Live Chat** - Real-time chat during streams
- **Reactions** - Live emoji reactions
- **Polls** - Interactive audience polls
- **Q&A** - Question submission and voting
- **Screen Sharing** - Share screen during stream

### Stream Management
- **Scheduled Streams** - Plan upcoming streams
- **Stream Recording** - Auto-record streams
- **VOD Conversion** - Convert to video-on-demand
- **Stream Analytics** - Viewer metrics
- **Moderation** - Chat moderation tools

---

## API Endpoints

#### `POST /api/streams`
Create stream.

**Request:**
```json
{
  "title": "Live Q&A Session",
  "description": "Ask me anything!",
  "scheduledAt": "2024-01-01T18:00:00Z",
  "visibility": "public"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "streamId": "uuid",
    "streamKey": "live_abc123xyz",
    "rtmpUrl": "rtmp://live.exprsn.io/live",
    "playbackUrl": "https://live.exprsn.io/streams/uuid/master.m3u8"
  }
}
```

#### `POST /api/streams/:id/start`
Start stream.

#### `POST /api/streams/:id/stop`
End stream.

#### `GET /api/streams/:id/viewers`
Get current viewers.

---

## Configuration

```env
PORT=3009
DB_NAME=exprsn_live
RTMP_PORT=1935
STREAMING_SERVER=nginx-rtmp
MAX_BITRATE=6000
ENABLE_DVR=true
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
