<div align="center">

# 🚀 Exprsn Platform

### Enterprise Microservices Ecosystem for Social & Business Applications

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-13%2B-blue.svg)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/redis-7%2B-red.svg)](https://redis.io)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A comprehensive, production-ready microservices platform built on Node.js, PostgreSQL, and Redis**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Production Services](#-production-services)
- [Quick Start](#-quick-start)
- [Technology Stack](#-technology-stack)
- [Documentation](#-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

Exprsn is a **complete enterprise-grade microservices ecosystem** combining social networking capabilities with comprehensive business management tools. Built with security-first principles, it features a unique **Certificate Authority (CA) token authentication system** for secure service-to-service communication.

### Why Exprsn?

- **🔐 Security First**: RSA-PSS cryptographic signatures, OCSP validation, and granular permissions
- **🎯 Production Ready**: 15/23 services fully operational with comprehensive test coverage
- **⚡ High Performance**: Redis caching, Bull queues, Elasticsearch integration
- **🔧 Low-Code Platform**: Visual designers for entities, forms, grids, and workflows
- **💼 Complete CRM/ERP**: 92+ endpoints for contact management, sales, inventory, HR, and financials
- **🌐 Real-time Everything**: WebSocket support, live streaming, instant messaging
- **📊 Enterprise Analytics**: Comprehensive metrics, dashboards, and reporting

---

## ✨ Key Features

### Security & Authentication
- **CA-Based Token System** with RSA-SHA256-PSS signatures
- **Multi-Factor Authentication** (TOTP, SMS, Email, Hardware keys)
- **OAuth2/OIDC Provider** with SAML 2.0 SSO
- **OCSP/CRL Support** for certificate validation
- **Role-Based Access Control** with granular permissions

### Business Applications
- **Low-Code Platform**: Entity Designer, Form Designer (27 components), Grid Designer
- **CRM Module**: Contacts, Leads, Opportunities, Campaigns, Support Tickets
- **ERP Suite**: Accounting, Inventory, HR, Assets, Projects, Payroll
- **Groupware**: Calendar (CalDAV), Email, Tasks, Documents, Wiki
- **Workflow Automation**: Visual designer with 15 step types and sandboxed JavaScript

### Social & Communication
- **Real-time Messaging** with end-to-end encryption (E2EE)
- **Social Timeline** with fan-out architecture and Elasticsearch
- **Live Streaming** with WebRTC and HLS/DASH transcoding
- **Groups & Events** management
- **Multi-channel Notifications** (Email, SMS, Push, In-app)

### Infrastructure & DevOps
- **Service Discovery** with health monitoring
- **API Gateway** with rate limiting and routing
- **Secrets Management** with encryption and audit logging
- **Analytics & Metrics** with Prometheus export
- **File Storage** (S3-compatible) with virus scanning

---

## 🏗️ Architecture

Exprsn uses a **microservices architecture** with **database-per-service** pattern, providing:

- **Independent Deployment**: Each service can be deployed separately
- **Technology Flexibility**: Services can use different technologies as needed
- **Fault Isolation**: Issues in one service don't cascade to others
- **Scalability**: Scale individual services based on demand

### Service Communication

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Bridge)                     │
│                         Port 3010                            │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │   CA    │    │  Auth   │    │Timeline │
    │ :3000   │    │ :3001   │    │ :3004   │
    └────┬────┘    └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                    ┌────▼────┐
                    │  Redis  │
                    │  Cache  │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │PostgreSQL│
                    │ Cluster │
                    └─────────┘
```

**Key Architectural Principles:**
- CA service **must start first** (provides authentication for all other services)
- Shared middleware library (`@exprsn/shared`) ensures consistency
- Event-driven architecture with Bull queues
- Redis for distributed caching and rate limiting
- Database-per-service isolation

---

## 🎯 Production Services

### Core Infrastructure (Port 3000-3015)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **exprsn-ca** | 3000 | ✅ | Certificate Authority & OCSP/CRL |
| **exprsn-auth** | 3001 | ✅ | OAuth2/OIDC/SAML SSO + MFA (260+ tests) |
| **exprsn-spark** | 3002 | ✅ | Real-time Messaging (WebSocket/E2EE) |
| **exprsn-timeline** | 3004 | ✅ | Social Feed (Bull queues, Elasticsearch) |
| **exprsn-prefetch** | 3005 | ✅ | Timeline Prefetching & Caching |
| **exprsn-moderator** | 3006 | ✅ | AI Content Moderation |
| **exprsn-filevault** | 3007 | ✅ | S3-Compatible File Storage |
| **exprsn-gallery** | 3008 | ✅ | Media Galleries & Processing |
| **exprsn-live** | 3009 | ✅ | WebRTC Live Streaming |
| **exprsn-bridge** | 3010 | ✅ | API Gateway |
| **exprsn-nexus** | 3011 | ✅ | Groups & Events |
| **exprsn-pulse** | 3012 | ✅ | Analytics & Metrics |
| **exprsn-vault** | 3013 | ✅ | Secrets Management |
| **exprsn-herald** | 3014 | ✅ | Multi-channel Notifications |
| **exprsn-setup** | 3015 | ✅ | Service Discovery & Management |

### Business Applications

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **exprsn-svr** | 5001 | ✅ | Business Hub (Low-Code + Forge CRM/ERP/Groupware) |
| **exprsn-workflow** | 3017 | ✅ | Visual Workflow Automation |

### Development Services

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **exprsn-payments** | 3018 | 🚧 | Payment Processing (Stripe/PayPal/Authorize.Net) |
| **exprsn-atlas** | 3019 | 🚧 | Geospatial Services (PostGIS) |
| **exprsn-dbadmin** | TBD | 🚧 | Database Administration UI |
| **exprsn-bluesky** | TBD | 🚧 | AT Protocol Integration |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **PostgreSQL** 13+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

```bash
# Clone the repository
git clone https://github.com/ExprsnIO/Exprsn.git
cd Exprsn

# Install all dependencies (uses npm workspaces)
npm install

# Initialize the system (creates databases, runs migrations, seeds data)
npm run init

# Start all production services
npm start

# Check service health
npm run health
```

### First Steps

1. **Access the Admin Dashboard**: http://localhost:3000/admin
2. **Configure Authentication**: http://localhost:3001/admin
3. **Explore Business Hub**: https://localhost:5001
4. **View Service Health**: http://localhost:3015/health

### Environment Configuration

Copy the example environment file and configure for your setup:

```bash
cp .env.example .env
```

Edit `.env` and set:
- Database credentials (`DB_USER`, `DB_PASSWORD`)
- Redis connection (`REDIS_HOST`, `REDIS_PORT`)
- Service ports and domains
- Email/SMS provider credentials (optional)
- OAuth provider credentials (optional)

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 13+ (with PostGIS for Atlas)
- **ORM**: Sequelize
- **Cache**: Redis 7+
- **Queue**: Bull (Redis-backed)
- **Search**: Elasticsearch 8+

### Frontend
- **Framework**: React 18 with Vite
- **UI Library**: Bootstrap 5.3
- **State Management**: Zustand
- **Real-time**: Socket.IO 4+

### Security
- **Encryption**: bcrypt, helmet, RSA-PSS signatures
- **Authentication**: Passport.js, SAML 2.0, OAuth2/OIDC
- **Validation**: Joi, express-validator
- **Sanitization**: sanitize-html, DOMPurify

### DevOps
- **Testing**: Jest with 60%+ coverage target
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Prometheus metrics, health checks

---

## 📚 Documentation

Comprehensive documentation is available in the repository:

- **[CLAUDE.md](CLAUDE.md)** - Complete platform guide for developers
- **[Quick Start Guide](Markdown/QUICK_START_GUIDE.md)** - Get up and running quickly
- **[System Architecture](Markdown/SYSTEM_ARCHITECTURE.md)** - Architectural decisions and patterns
- **[Installation Guide](Markdown/INSTALLATION_GUIDE.md)** - Detailed installation instructions
- **[Testing Guide](Markdown/TESTING_GUIDE.md)** - Writing and running tests

### Service Documentation

Each service has detailed documentation in the `Markdown/services/` directory:

- [exprsn-ca](Markdown/services/exprsn-ca.md) - Certificate Authority
- [exprsn-auth](Markdown/services/exprsn-auth.md) - Authentication & SSO
- [exprsn-svr](Markdown/services/exprsn-svr.md) - Business Hub & Low-Code
- [exprsn-timeline](Markdown/services/exprsn-timeline.md) - Social Feed
- [exprsn-workflow](Markdown/services/exprsn-workflow.md) - Workflow Automation
- [And more...](Markdown/services/)

---

## 💻 Development

### Project Structure

```
Exprsn/
├── src/                      # Microservices
│   ├── exprsn-ca/           # Certificate Authority
│   ├── exprsn-auth/         # Authentication
│   ├── exprsn-svr/          # Business Hub
│   ├── exprsn-timeline/     # Social Feed
│   ├── exprsn-workflow/     # Workflow Engine
│   └── ...                  # Other services
├── src/shared/              # Shared middleware library
├── scripts/                 # System scripts
├── admin/                   # Admin dashboard
├── cli/                     # Command-line tools
├── seeders/                 # Database seeders
└── Markdown/                # Documentation

```

### Development Workflow

```bash
# Start specific service with hot-reload
npm run dev:timeline
npm run dev:auth
npm run dev:spark

# Run migrations for a service
cd src/exprsn-auth
npx sequelize-cli db:migrate

# Run tests
npm run test:all              # All services
cd src/exprsn-timeline
npm test                      # Single service

# Reset system (interactive menu)
npm run reset

# Health monitoring
npm run health:watch          # Continuous monitoring
```

### Creating a New Service

1. Create service directory in `src/exprsn-{service}/`
2. Add to `package.json` workspaces
3. Implement standard structure (routes, models, controllers)
4. Use `@exprsn/shared` middleware
5. Add migrations and seeders
6. Update `scripts/start-services.js`

---

## 🧪 Testing

Exprsn has comprehensive test coverage across all services.

### Running Tests

```bash
# All services
npm run test:all

# With coverage report
npm run test:coverage

# Specific service
cd src/exprsn-auth
npm test

# Watch mode
npm run test:watch
```

### Coverage Goals
- **Minimum**: 60% overall
- **Target**: 70%+
- **Critical paths** (auth, tokens, payments, CA): 90%+

### Test Structure

```javascript
const request = require('supertest');
const app = require('../index');

describe('POST /api/posts', () => {
  it('should create a new post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: 'Test post' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong secrets (`SESSION_SECRET`, JWT keys)
- [ ] Configure PostgreSQL with SSL
- [ ] Enable Redis persistence
- [ ] Configure HTTPS/TLS for all services
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure backup strategy
- [ ] Enable audit logging
- [ ] Review rate limits
- [ ] Configure email/SMS providers

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

Key production environment variables:

```bash
NODE_ENV=production
DB_SSL=true
SESSION_SECURE=true
REDIS_ENABLED=true
OCSP_ENABLED=true

# Generate with: npm run setup
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
SESSION_SECRET=...
```

### Recommended Infrastructure

```
┌─────────────────┐
│  Load Balancer  │  (nginx/HAProxy)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│  CA   │ │ Auth  │  (Multiple instances)
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
    ┌────▼────┐
    │PostgreSQL│  (with replication)
    └────┬────┘
         │
    ┌────▼────┐
    │  Redis  │  (with persistence)
    └─────────┘
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🐛 **Report bugs** via [GitHub Issues](https://github.com/ExprsnIO/Exprsn/issues)
- 💡 **Suggest features** in [Discussions](https://github.com/ExprsnIO/Exprsn/discussions)
- 📝 **Improve documentation**
- 🔧 **Submit pull requests**
- ⭐ **Star the repository** to show support

### Development Guidelines

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Write tests** for new functionality
4. **Ensure tests pass** (`npm test`)
5. **Follow code style** (ESLint configuration provided)
6. **Commit changes** (`git commit -m 'Add amazing feature'`)
7. **Push to branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using open-source technologies
- Inspired by modern microservices best practices
- Community feedback and contributions

---

## 📞 Support

- **Documentation**: [CLAUDE.md](CLAUDE.md)
- **Issues**: [GitHub Issues](https://github.com/ExprsnIO/Exprsn/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ExprsnIO/Exprsn/discussions)
- **Email**: support@exprsn.io

---

<div align="center">

**Made with 🚀 by the Exprsn Team**

[⬆ Back to Top](#-exprsn-platform)

</div>
