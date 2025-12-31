# Exprsn Moderator (exprsn-moderator)

**Version:** 1.0.0
**Port:** 3006
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Moderator** is the AI-powered content moderation service that automatically detects and filters inappropriate content including spam, hate speech, violence, and adult content.

---

## Key Features

### AI Content Moderation
- **Text Moderation** - NLP-based text analysis
- **Image Moderation** - Computer vision analysis
- **Video Moderation** - Frame-by-frame analysis
- **Spam Detection** - Pattern-based spam filtering
- **Hate Speech Detection** - Multi-language support
- **Violence Detection** - Graphic content filtering

### Moderation Actions
- **Auto-Remove** - Automatic content removal
- **Flag for Review** - Human moderator queue
- **Shadow Ban** - Hide from public timelines
- **User Warnings** - Strike system
- **Account Suspension** - Temporary/permanent bans

### Moderation Dashboard
- **Review Queue** - Flagged content review
- **Moderation Logs** - Action audit trail
- **User Reports** - Community reporting
- **Statistics** - Moderation metrics
- **Rule Configuration** - Custom moderation rules

---

## API Endpoints

#### `POST /api/moderate/text`
Moderate text content.

**Request:**
```json
{
  "content": "Text to moderate...",
  "userId": "user-uuid",
  "contentType": "post"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "confidence": 0.95,
    "categories": {
      "spam": 0.05,
      "hate": 0.02,
      "violence": 0.01,
      "adult": 0.03
    },
    "action": "allow"
  }
}
```

#### `POST /api/moderate/image`
Moderate image content.

#### `POST /api/reports`
Submit user report.

**Request:**
```json
{
  "contentId": "post-uuid",
  "contentType": "post",
  "reason": "spam",
  "details": "This is spam content"
}
```

---

## Configuration

```env
PORT=3006
DB_NAME=exprsn_moderator
AI_MODEL=perspective_api
PERSPECTIVE_API_KEY=your-key
AUTO_MODERATE_ENABLED=true
CONFIDENCE_THRESHOLD=0.8
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
