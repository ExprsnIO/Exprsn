# Exprsn Services Documentation

Complete documentation for all Exprsn microservices.

**Version:** 1.0.0
**Last Updated:** 2025-12-22
**Total Services:** 22

---

## 📑 Documentation Index

### Core Infrastructure (Must Start First)

#### [exprsn-ca](exprsn-ca.md) - Certificate Authority (Port 3000)
⚠️ **MUST START FIRST** - Core authentication infrastructure with CA tokens, X.509 certificates, OCSP, and CRL.
- **Status:** ✅ Production-Ready
- **Critical:** All services depend on this

#### [exprsn-setup](exprsn-setup.md) - Service Discovery (Port 3015)
Service registry, health monitoring, and admin dashboard.
- **Status:** ✅ Production-Ready

---

### Gateway & Security

#### [exprsn-bridge](exprsn-bridge.md) - API Gateway (Port 3010)
Unified API gateway with rate limiting, load balancing, and request routing.
- **Status:** ✅ Production-Ready

#### [exprsn-auth](exprsn-auth.md) - Authentication (Port 3001)
OAuth2/OIDC, SAML SSO, MFA, role-based access control.
- **Status:** ✅ Production-Ready (260+ test cases)
- **Security:** CRITICAL

---

### Communication Services

#### [exprsn-spark](exprsn-spark.md) - Messaging (Port 3002)
Real-time messaging with end-to-end encryption, group chats, and Socket.IO.
- **Status:** ✅ Production-Ready

#### [exprsn-herald](exprsn-herald.md) - Notifications (Port 3014)
Multi-channel notifications: email, SMS, push, in-app.
- **Status:** ✅ Production-Ready

---

### Social & Content

#### [exprsn-timeline](exprsn-timeline.md) - Social Feed (Port 3004)
Timeline generation, posts, comments, likes, search with Elasticsearch.
- **Status:** ✅ Production-Ready (50+ tests, 70% coverage)

#### [exprsn-prefetch](exprsn-prefetch.md) - Timeline Caching (Port 3005)
Pre-computed timeline caching for faster feed loading.
- **Status:** ✅ Production-Ready

#### [exprsn-moderator](exprsn-moderator.md) - Content Moderation (Port 3006)
AI-powered content moderation: spam, hate speech, violence detection.
- **Status:** ✅ Production-Ready

---

### Media Services

#### [exprsn-filevault](exprsn-filevault.md) - File Storage (Port 3007)
File uploads, media processing, S3/Local/IPFS storage, CDN integration.
- **Status:** ✅ Production-Ready

#### [exprsn-gallery](exprsn-gallery.md) - Media Galleries (Port 3008)
Photo albums, video collections, slideshows, EXIF data.
- **Status:** ✅ Production-Ready

#### [exprsn-live](exprsn-live.md) - Live Streaming (Port 3009)
RTMP/WebRTC live streaming with chat, reactions, and DVR.
- **Status:** ✅ Production-Ready

---

### Collaboration

#### [exprsn-nexus](exprsn-nexus.md) - Groups & Events (Port 3011)
Groups, events, CalDAV/CardDAV, shared workspaces.
- **Status:** ✅ Production-Ready

---

### Business Platform

#### [exprsn-forge](exprsn-forge.md) - Business Management (Port 3016)
**CRM (100%):** 92 endpoints, contacts, leads, opportunities, cases
**Groupware (40%):** Email, calendar, documents (partial)
**ERP (15%):** Inventory (basic)
- **Status:** 🔄 Partial
- **Lines of Code:** 8,600+ (CRM module)

---

### Automation & Workflows

#### [exprsn-workflow](exprsn-workflow.md) - Workflow Engine (Port 3017)
Visual workflow builder with 15+ step types, JavaScript execution (VM2), JSONLex.
- **Status:** ✅ Production-Ready

---

### Platform Services

#### [exprsn-svr](exprsn-svr.md) - Dynamic Page Server (Port 5000)
Server-rendered pages, **Low-Code Platform** with:
- Entity Designer (visual database schema)
- Form Designer (27 components, 100% complete)
- Grid Designer (runtime renderer)
- Workflow & Forge integration
- **Status:** ✅ Production-Ready

#### [exprsn-pulse](exprsn-pulse.md) - Analytics (Port 3012)
Event tracking, dashboards, metrics, user analytics.
- **Status:** ✅ Production-Ready

#### [exprsn-vault](exprsn-vault.md) - Secrets Management (Port 3013)
Encrypted secrets storage, key rotation, audit logging.
- **Status:** ✅ Production-Ready

---

### Financial

#### [exprsn-payments](exprsn-payments.md) - Payment Processing (Port 3018)
Stripe integration, subscriptions, invoicing, revenue analytics.
- **Status:** ✅ Production-Ready

---

### Experimental & Tools

#### [exprsn-atlas](exprsn-atlas.md) - Location Services (Port 3019)
Mapping, geocoding, geofencing, route planning.
- **Status:** 🚧 In Development

#### [exprsn-bluesky](exprsn-bluesky.md) - Federation (Port 3020)
AT Protocol federation, decentralized social networking.
- **Status:** 🚧 Experimental

#### [exprsn-dbadmin](exprsn-dbadmin.md) - Database Admin (Port 3021)
Web-based PostgreSQL administration tool.
- **Status:** ✅ Production-Ready

---

## 📊 Service Status Summary

| Status | Count | Services |
|--------|-------|----------|
| ✅ Production-Ready | 18 | Most services |
| 🔄 Partial | 1 | Forge (CRM complete, others partial) |
| 🚧 In Development | 2 | Atlas, BlueSky |

---

## 🚀 Quick Start Order

Services must start in dependency order:

1. **exprsn-ca** (3000) - MUST START FIRST
2. **exprsn-setup** (3015) - Service discovery
3. **Core Services:**
   - exprsn-bridge (3010) - API Gateway
   - exprsn-auth (3001) - Authentication
   - exprsn-timeline (3004) - Social feed
   - exprsn-spark (3002) - Messaging
   - exprsn-herald (3014) - Notifications
4. **Supporting Services:** (any order)
   - All others

---

## 📖 Documentation Structure

Each service documentation includes:

1. **Overview** - Service purpose and role
2. **Key Features** - Functionality breakdown
3. **Architecture** - Tech stack and database schema
4. **API Endpoints** - Complete API reference with examples
5. **Configuration** - Environment variables
6. **Usage Examples** - Code samples
7. **Development** - Setup and testing
8. **Dependencies** - npm packages
9. **Support** - Contact information

---

## 🏗️ Architecture Principles

### Microservices Pattern
- **Database-per-Service** - Each service has its own PostgreSQL database
- **Independent Deployment** - Services deploy independently
- **API-Based Communication** - REST APIs with CA token authentication

### Security First
- **CA Token Authentication** - Cryptographically-signed tokens (RSA-SHA256-PSS)
- **Fine-Grained Permissions** - read, write, append, delete, update
- **OCSP Validation** - Real-time certificate status checking
- **Audit Logging** - Comprehensive security audit trails

### Shared Infrastructure
- **@exprsn/shared** - Common middleware and utilities
- **PostgreSQL 12+** - Relational database
- **Redis 7+** - Caching and queues
- **Bull** - Job queues
- **Socket.IO** - Real-time communication

---

## 🔗 Related Documentation

- **Platform Guide:** `/CLAUDE.md` - Complete platform documentation
- **Token Specification:** `/TOKEN_SPECIFICATION_V1.0.md` - CA token format
- **Main README:** `/README.md` - Quick start guide
- **Database Guide:** `/database/README.md` - Database documentation
- **Theme Guide:** `/theme/README.md` - UI theme system

---

## 📧 Support

For issues, questions, or contributions:
- **Email:** engineering@exprsn.com
- **Main Documentation:** See `/CLAUDE.md`
- **License:** MIT

---

**Last Updated:** 2025-12-22
**Generated by:** Claude Code
**Exprsn Platform Version:** 1.0.0
