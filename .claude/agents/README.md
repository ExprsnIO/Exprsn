# Exprsn AI Agent System

**Version:** 2.0.0
**Last Updated:** 2025-12-25
**Maintainer:** Rick Holland (engineering@exprsn.com)

---

## Overview

This directory contains **27 specialized AI agent configurations** designed to assist with different roles and responsibilities across the Exprsn platform. Each agent embodies the expertise, knowledge, and best practices of a specific role, providing targeted assistance for development, design, project management, research, infrastructure, and Exprsn-specific operations.

## Why Agent-Based Assistance?

The Exprsn platform is a complex microservices ecosystem with:
- **22 microservices** with database-per-service architecture
- **Multiple technology stacks** (Node.js, PostgreSQL, Redis, Bull queues, Socket.IO, Docker, Kubernetes)
- **Diverse skillsets required** (backend, frontend, database, DevOps, UX, product, security, performance)
- **Strict security requirements** (CA token authentication, RSA-PSS cryptography, OCSP/CRL, WCAG 2.1 AA accessibility)
- **Cloud deployment options** (DigitalOcean, AWS, Azure, Google Cloud)

Having specialized agents ensures you get:
✅ **Role-specific expertise** - Each agent understands their domain deeply
✅ **Platform knowledge** - All agents know the Exprsn architecture
✅ **Best practices** - Agents follow established patterns and conventions
✅ **Consistent guidance** - Same advice you'd get from an experienced team member

---

## Available Agents

### Management & Planning

#### 1. Project Manager
**File:** `project-manager.md`
**Use when:** Planning projects, managing timelines, coordinating cross-service features

**Capabilities:**
- Project scoping and sprint planning
- Cross-service coordination
- Risk management and mitigation
- Stakeholder communication
- Status reporting and metrics tracking

**Example prompts:**
- "Help me plan a feature that spans Timeline, Herald, and Spark services"
- "Create a project plan for completing Forge Groupware module"
- "What are the risks of deploying CA service changes to production?"

#### 2. Scrum Master
**File:** `scrum-master.md`
**Use when:** Running sprints, facilitating ceremonies, removing blockers

**Capabilities:**
- Sprint planning and retrospectives
- Daily standup facilitation
- Impediment management
- Velocity tracking and burndown charts
- Team coaching on Agile practices

**Example prompts:**
- "Help me plan this 2-week sprint with 5 developers"
- "How should I run a retrospective for a remote team?"
- "We have a blocker with CA service dependencies - how do I escalate?"

#### 3. Product Manager
**File:** `product-manager.md`
**Use when:** Defining features, prioritizing roadmap, gathering requirements

**Capabilities:**
- Product strategy and roadmap
- Writing user stories with acceptance criteria
- RICE prioritization framework
- A/B testing and analytics
- Feature specifications

**Example prompts:**
- "Help me write a user story for workflow triggers in Form Designer"
- "Prioritize these 5 features using RICE scoring"
- "Create a feature spec for SAML SSO integration"

---

### Research & Strategy

#### 4. Technical Research Analyst
**File:** `technical-research-analyst.md`
**Use when:** Evaluating feature ideas, researching market trends, competitive analysis

**Capabilities:**
- Social media and networking trend analysis
- Competitive landscape research
- Feature idea qualification (RICE scoring)
- Market sizing and user demand validation
- Technical feasibility assessment
- Emerging technology evaluation

**Example prompts:**
- "Should we implement ActivityPub federation for Mastodon compatibility?"
- "Research the creator economy - should we add subscription monetization?"
- "Evaluate this feature idea: short-form vertical video like TikTok"
- "What are the top 3 social networking trends we should consider for 2026?"

---

### Development

#### 5. Jr. Developer
**File:** `jr-developer.md`
**Use when:** Learning the platform, implementing straightforward features, fixing bugs

**Capabilities:**
- Following existing code patterns
- Writing unit tests with Jest
- Bug fixing with guidance
- Using `@exprsn/shared` library
- Git workflow and PR creation

**Example prompts:**
- "How do I add a new POST endpoint to the Timeline service?"
- "Walk me through fixing this bug step-by-step"
- "What's the pattern for validating user input in Exprsn?"

#### 6. Sr. Developer
**File:** `sr-developer.md`
**Use when:** Designing architecture, complex features, security reviews, mentoring

**Capabilities:**
- System architecture design
- Security-first code review
- Performance optimization
- Mentoring junior developers
- Complex problem-solving

**Example prompts:**
- "Design the architecture for real-time notifications across services"
- "Review this code for security vulnerabilities"
- "How should I optimize this N+1 query problem?"

#### 7. Backend Web Developer
**File:** `backend-web-developer.md`
**Use when:** Building APIs, implementing business logic, service integration

**Capabilities:**
- RESTful API development (Express.js)
- Service layer business logic
- Bull queue background jobs
- Socket.IO real-time features
- Service-to-service communication

**Example prompts:**
- "Help me build a CRUD API for posts with pagination"
- "How do I set up a Bull queue for email notifications?"
- "Implement real-time post likes with Socket.IO"

---

### Design & User Experience

#### 8. UX/UI Specialist
**File:** `ux-ui-specialist.md`
**Use when:** User research, wireframing, accessibility testing, usability studies

**Capabilities:**
- User research and personas
- Information architecture
- Wireframing and user flows
- WCAG 2.1 AA accessibility compliance
- Usability testing

**Example prompts:**
- "Design the user flow for creating a post with media"
- "How do I ensure this form meets WCAG 2.1 AA standards?"
- "Create a usability test plan for the Form Designer"

#### 9. Product Designer
**File:** `product-designer.md`
**Use when:** Visual design, design systems, high-fidelity mockups, branding

**Capabilities:**
- Visual design system creation
- Component library design
- Iconography and illustration
- Motion design and micro-interactions
- Design handoff to developers

**Example prompts:**
- "Design a Post Card component with all states (hover, focus, loading)"
- "Create a color palette for the Exprsn brand"
- "How should I animate the modal entrance?"

---

### Quality & Testing

#### 10. QA Specialist
**File:** `qa-specialist.md`
**Use when:** Testing strategy, writing tests, bug reporting, quality gates

**Capabilities:**
- Test planning and strategy
- Automated testing (Jest, Supertest)
- Manual testing checklists
- Bug reporting and severity classification
- Performance and security testing

**Example prompts:**
- "Create a test plan for workflow trigger integration"
- "Write Jest tests for the PostService.createPost method"
- "How should I test this feature for accessibility?"

---

### Database

#### 11. SQL Database Administrator
**File:** `sql-database-administrator.md`
**Use when:** Database performance, backups, monitoring, maintenance

**Capabilities:**
- Performance monitoring and tuning
- Automated backups and recovery
- Query optimization
- Connection pool management
- Security and permissions

**Example prompts:**
- "Help me optimize this slow query"
- "Set up automated backups for all 18 Exprsn databases"
- "The database is running out of disk space - what should I do?"

#### 12. SQL Database Engineer
**File:** `sql-database-engineer.md`
**Use when:** Schema design, migrations, complex queries, data modeling

**Capabilities:**
- Database schema design (ERD modeling)
- Sequelize migration development
- Complex SQL queries (CTEs, window functions)
- Data integrity (constraints, triggers)
- JSONB usage patterns

**Example prompts:**
- "Design the database schema for Forge CRM contacts and opportunities"
- "Write a migration to add custom fields to the contacts table"
- "Create a recursive CTE to query org chart hierarchy"

---

### Infrastructure & DevOps

#### 13. Cloud Engineer
**File:** `cloud-engineer.md`
**Use when:** Deployment, containers, Kubernetes, CI/CD, monitoring

**Capabilities:**
- Docker containerization
- Kubernetes orchestration (Helm charts)
- CI/CD pipelines (GitHub Actions)
- Infrastructure as Code (Terraform)
- Monitoring (Prometheus, Grafana)

**Example prompts:**
- "Create a Dockerfile for the Timeline service"
- "Set up a Kubernetes deployment for all 18 Exprsn services"
- "Configure a CI/CD pipeline to deploy on every push to main"

---

### Exprsn-Specific Specialists (NEW in v2.0)

#### 14. CA Security Specialist
**File:** `ca-security-specialist.md`
**Use when:** Working with exprsn-ca, certificates, CA tokens, OCSP/CRL, cryptographic operations

**Capabilities:**
- RSA-SHA256-PSS cryptographic operations
- CA token generation and validation
- X.509 certificate lifecycle management
- OCSP responder operations (Port 2560)
- PKI security hardening
- Service-to-service authentication design

**Example prompts:**
- "Review this CA token validation code for security issues"
- "How do I implement certificate renewal automation?"
- "The OCSP responder is returning errors - help me troubleshoot"

#### 15. Microservices Architect
**File:** `microservices-architect.md`
**Use when:** Designing services, inter-service communication, database-per-service patterns, distributed systems

**Capabilities:**
- Service boundary definition (Domain-Driven Design)
- Inter-service communication patterns (sync/async)
- Database-per-service architecture (22 databases)
- Event-driven architecture and saga patterns
- Circuit breakers and fault tolerance
- Service discovery and health monitoring

**Example prompts:**
- "Should feature X be a new service or added to Timeline?"
- "Design the architecture for a real-time notification system across services"
- "We have a circular dependency between Timeline and Herald - how do we fix it?"

#### 16. API Integration Specialist
**File:** `api-integration-specialist.md`
**Use when:** Integrating third-party APIs (Stripe, PayPal, AWS S3, Twilio, Bluesky, etc.)

**Capabilities:**
- Payment gateway integration (Stripe, PayPal, Authorize.Net)
- OAuth 2.0 and API authentication
- Webhook handling and event processing
- Cloud storage APIs (S3, Spaces, IPFS)
- Communication APIs (Twilio SMS, SendGrid Email)
- Federated protocols (AT Protocol/Bluesky)

**Example prompts:**
- "Implement Stripe webhook handling for payment events"
- "Configure AWS S3 integration for exprsn-filevault"
- "Set up Bluesky AT Protocol sync for cross-posting"

#### 17. Performance Engineer
**File:** `performance-engineer.md`
**Use when:** Optimizing performance, database tuning, caching strategies, load testing

**Capabilities:**
- Performance profiling and bottleneck identification
- Database query optimization (N+1 detection)
- Redis caching strategies
- Bull queue optimization
- Load testing and stress testing
- Memory leak detection
- Connection pool tuning

**Example prompts:**
- "Timeline feed is slow - help me optimize it"
- "Design a caching strategy for user sessions in exprsn-auth"
- "This query is taking 5 seconds - how do I fix it?"

#### 18. Low-Code Platform Specialist
**File:** `low-code-platform-specialist.md`
**Use when:** Working on exprsn-svr, Forge CRM/ERP, Entity Designer, Form Designer, Grid Designer

**Capabilities:**
- Entity Designer (visual schema design)
- Form Designer (27 components, drag-and-drop)
- Grid Designer (data tables)
- Forge CRM (Contacts, Accounts, Leads, Opportunities, 92 endpoints)
- JSONLex expression language
- Dynamic DDL (runtime schema changes)
- Workflow automation integration

**Example prompts:**
- "Add a new field type to the Form Designer"
- "Implement custom entity creation via Entity Designer"
- "How do I evaluate JSONLex expressions safely?"

#### 19. Business Process Engineer
**File:** `business-process-engineer.md`
**Use when:** Designing workflows, automation, approval chains, process optimization

**Capabilities:**
- Visual workflow design (15 step types)
- Trigger configuration (webhook, schedule, event-based)
- Approval chains and parallel processing
- Conditional logic and branching
- Real-time workflow tracking (Socket.IO)
- Sandboxed JavaScript execution (VM2)

**Example prompts:**
- "Design a lead nurturing workflow with email sequences"
- "Create an expense approval workflow with multi-stage approvals"
- "How do I trigger a workflow when a Forge CRM opportunity closes?"

---

### Support & Quality Assurance (NEW in v2.0)

#### 20. Technical Support Specialist
**File:** `technical-support-specialist.md`
**Use when:** Troubleshooting user issues, support tickets, diagnostics, user onboarding

**Capabilities:**
- Ticket triage and prioritization (P0-P4)
- Log analysis and error diagnosis
- User onboarding and training
- Knowledge base documentation
- Escalation to engineering teams
- Customer communication

**Example prompts:**
- "User reports they can't log in - walk me through diagnosis"
- "Create a troubleshooting guide for workflow execution failures"
- "How do I explain CA token authentication to a non-technical user?"

#### 21. QA Reviewer
**File:** `qa-reviewer.md`
**Use when:** Code review from QA perspective, test coverage analysis, bug validation

**Capabilities:**
- Code review for testability
- Test coverage analysis
- Edge case identification
- Bug validation and regression testing
- Security vulnerability detection
- Performance impact assessment

**Example prompts:**
- "Review this PR for missing tests and edge cases"
- "Validate this bug fix includes proper regression tests"
- "What test coverage do we need before deploying this feature?"

#### 22. QA Planner
**File:** `qa-planner.md`
**Use when:** Test strategy, test plans, QA sprint planning, quality gates

**Capabilities:**
- Test strategy development
- Test plan creation
- Test case design (functional, integration, E2E)
- QA sprint planning
- Test automation roadmap
- Quality gate definitions

**Example prompts:**
- "Create a test plan for the new Workflow approval feature"
- "Design a test strategy for the Forge CRM module"
- "What quality gates should we set for production deployment?"

---

### Cloud Platform Specialists (NEW in v2.0)

#### 23. DigitalOcean Cloud Engineer
**File:** `digitalocean-cloud-engineer.md`
**Use when:** Deploying to DigitalOcean, DOKS, Spaces, managed PostgreSQL

**Capabilities:**
- DigitalOcean Kubernetes (DOKS)
- Spaces storage (S3-compatible)
- Managed PostgreSQL and Redis
- App Platform deployment
- Load balancers and networking
- Cost optimization

**Example prompts:**
- "Deploy Exprsn to DigitalOcean Kubernetes"
- "Configure Spaces for exprsn-filevault"
- "Set up managed PostgreSQL for all 22 databases"

#### 24. AWS Cloud Engineer
**File:** `aws-cloud-engineer.md`
**Use when:** Deploying to AWS, ECS/EKS, S3, RDS, ElastiCache

**Capabilities:**
- ECS/EKS container orchestration
- S3 storage with CloudFront CDN
- RDS managed PostgreSQL
- ElastiCache Redis
- VPC and networking
- IAM roles and security

**Example prompts:**
- "Deploy Exprsn to AWS ECS with Fargate"
- "Configure S3 with CloudFront for file delivery"
- "Set up Multi-AZ RDS for high availability"

#### 25. Azure Cloud Engineer
**File:** `azure-cloud-engineer.md`
**Use when:** Deploying to Azure, AKS, Azure SQL, Blob Storage

**Capabilities:**
- Azure Kubernetes Service (AKS)
- Azure SQL Database
- Blob Storage with CDN
- App Service deployment
- Azure AD integration
- Azure Monitor and logging

**Example prompts:**
- "Deploy Exprsn to Azure AKS"
- "Configure Azure SQL for exprsn-ca database"
- "Integrate Azure AD for SSO authentication"

#### 26. Google Cloud Engineer
**File:** `google-cloud-engineer.md`
**Use when:** Deploying to Google Cloud, GKE, Cloud SQL, Cloud Storage

**Capabilities:**
- Google Kubernetes Engine (GKE)
- Cloud SQL managed PostgreSQL
- Cloud Storage and CDN
- Cloud Run serverless containers
- Firebase integration (FCM, Realtime DB)
- BigQuery for analytics

**Example prompts:**
- "Deploy Exprsn to Google Kubernetes Engine"
- "Configure Cloud Storage for exprsn-filevault"
- "Integrate Firebase Cloud Messaging for push notifications"

---

### Business & Pricing (Existing)

#### 27. Exprsn Pricing Analyst
**File:** `exprsn-pricing-analyst.md`
**Use when:** Pricing strategy, revenue models, PBC-aligned monetization

**Capabilities:**
- Public Benefit Corporation pricing alignment
- Service-level pricing analysis
- Freemium tier design
- Cost structure analysis
- Competitive positioning
- Revenue forecasting

**Example prompts:**
- "Design pricing tiers for the Exprsn platform"
- "How should we price exprsn-payments transaction fees?"
- "Balance accessibility and sustainability for Forge CRM pricing"

---

## How to Use These Agents

### Option 1: Direct Reference
Read the agent markdown file directly for comprehensive guidance on that role's responsibilities, best practices, and examples.

```bash
# Read the Sr. Developer agent guide
cat .claude/agents/sr-developer.md

# Search for specific topics
grep -i "security" .claude/agents/sr-developer.md
```

### Option 2: AI Assistant Prompting
When working with an AI assistant (like Claude Code), you can reference these agents to get role-specific help:

```
"Acting as the Sr. Developer agent from .claude/agents/sr-developer.md,
review this code for security vulnerabilities and suggest improvements."
```

```
"Using the guidance from the Database Engineer agent, design a schema
for the Forge CRM contacts module with proper indexes and constraints."
```

### Option 3: Team Onboarding
Use these agents as onboarding materials for new team members:

- **New backend developer?** Start with `jr-developer.md` → `backend-web-developer.md`
- **New PM?** Read `product-manager.md` → `project-manager.md`
- **New DBA?** Study `sql-database-administrator.md` → `sql-database-engineer.md`

---

## Agent Specializations Quick Reference

### General Development & Management
| **Need help with...** | **Use this agent** |
|------------------------|---------------------|
| Planning a multi-sprint feature | Project Manager |
| Running sprint ceremonies | Scrum Master |
| Writing user stories and prioritizing | Product Manager |
| Evaluating feature ideas & market trends | Technical Research Analyst |
| Learning the Exprsn codebase | Jr. Developer |
| Architecting a complex feature | Sr. Developer |
| Building a REST API | Backend Web Developer |
| User research and wireframes | UX/UI Specialist |
| Design system and visual design | Product Designer |
| Database performance tuning | SQL Database Administrator |
| Schema design and migrations | SQL Database Engineer |
| Docker, K8s, CI/CD pipelines | Cloud Engineer |

### Exprsn-Specific Operations
| **Need help with...** | **Use this agent** |
|------------------------|---------------------|
| CA tokens, certificates, OCSP/CRL | CA Security Specialist |
| Service boundaries, distributed systems | Microservices Architect |
| Third-party API integrations (Stripe, AWS, etc.) | API Integration Specialist |
| Performance optimization, caching, load testing | Performance Engineer |
| Forge CRM, Entity Designer, Form Designer | Low-Code Platform Specialist |
| Workflow automation, approval chains | Business Process Engineer |

### Quality & Support
| **Need help with...** | **Use this agent** |
|------------------------|---------------------|
| User issues, troubleshooting, support tickets | Technical Support Specialist |
| Code review for testability, bug validation | QA Reviewer |
| Test strategy, test plans, QA planning | QA Planner |
| QA Specialist (deprecated - use QA Reviewer/Planner) | QA Specialist |

### Cloud Deployments
| **Need help with...** | **Use this agent** |
|------------------------|---------------------|
| DigitalOcean deployment (DOKS, Spaces) | DigitalOcean Cloud Engineer |
| AWS deployment (ECS, S3, RDS) | AWS Cloud Engineer |
| Azure deployment (AKS, Azure SQL) | Azure Cloud Engineer |
| Google Cloud deployment (GKE, Cloud SQL) | Google Cloud Engineer |

### Business Strategy
| **Need help with...** | **Use this agent** |
|------------------------|---------------------|
| Pricing strategy, revenue models | Exprsn Pricing Analyst |

---

## Collaboration Between Agents

Agents are designed to work together, mirroring real team dynamics:

**Example: Implementing a new feature**
1. **Technical Research Analyst** evaluates the feature idea against market trends and technical feasibility
2. **Product Manager** writes the user story and acceptance criteria based on research findings
3. **UX/UI Specialist** creates wireframes and user flows
4. **Product Designer** creates high-fidelity mockups
5. **Sr. Developer** designs the technical architecture
6. **Database Engineer** designs the schema and migration
7. **Backend Developer** implements the API endpoints
8. **Jr. Developer** writes unit tests
9. **QA Specialist** creates test plan and validates the feature
10. **Cloud Engineer** updates Docker/K8s configs for deployment
11. **Scrum Master** tracks progress and removes blockers
12. **Project Manager** coordinates and reports to stakeholders

---

## Common Workflows

### Workflow 1: Adding a New Service Feature

```
1. Product Manager → Define feature requirements
2. UX/UI Specialist → Design user interface
3. Database Engineer → Design schema changes
4. Backend Developer → Implement API
5. QA Specialist → Write tests and validate
6. Cloud Engineer → Deploy to staging
7. Project Manager → Coordinate release
```

### Workflow 2: Fixing a Production Bug

```
1. Sr. Developer → Assess severity and impact
2. Backend Developer → Identify root cause
3. Database Administrator → Check for data issues
4. Jr. Developer → Write regression test
5. QA Specialist → Validate fix in staging
6. Cloud Engineer → Deploy hotfix to production
7. Scrum Master → Document in retrospective
```

### Workflow 3: Performance Optimization

```
1. Database Administrator → Identify slow queries
2. Database Engineer → Optimize queries and add indexes
3. Backend Developer → Implement caching layer
4. Cloud Engineer → Scale infrastructure if needed
5. QA Specialist → Load test to verify improvements
6. Sr. Developer → Code review and approve changes
```

---

## Agent Development Guidelines

If you need to create a new agent or update an existing one:

### Agent Structure Template

```markdown
# [Role Name] Agent

## Role Identity
[Who you are, what you do]

## Core Competencies
- Bullet list of key skills

## Exprsn Platform Knowledge
[Platform-specific context]

## Key Responsibilities
[What this role does day-to-day]

## Essential Commands
[Relevant CLI commands]

## Best Practices
### DO: [Good practices]
### DON'T: [Anti-patterns]

## Communication Style
[How this role communicates]

## Success Metrics
[How success is measured]

## Collaboration Points
[Which roles this agent works with]
```

### Guidelines for Agent Content

✅ **DO include:**
- Real Exprsn platform examples
- Actual service names and ports
- Specific commands that work in the codebase
- Links to relevant documentation (CLAUDE.md, etc.)
- Code snippets from actual services

❌ **DON'T include:**
- Generic advice that applies to any project
- Outdated technology references
- Theoretical examples without Exprsn context
- Secrets, passwords, or sensitive data

---

## Maintaining This Agent System

### When to Update Agents

**Update agents when:**
- New services are added to the platform
- Architecture patterns change
- New tools/technologies are adopted
- Best practices evolve
- Security requirements change

**Update frequency:**
- **Minor updates:** As needed (typo fixes, small clarifications)
- **Major updates:** Quarterly or after significant platform changes
- **Review:** Every 6 months minimum

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-25 | **MAJOR UPDATE:** Added 14 new agents (27 total)<br>**New Exprsn-Specific Agents:** CA Security Specialist, Microservices Architect, API Integration Specialist, Performance Engineer, Low-Code Platform Specialist, Business Process Engineer<br>**New QA/Support Agents:** Technical Support Specialist, QA Reviewer, QA Planner<br>**New Cloud Agents:** DigitalOcean, AWS, Azure, Google Cloud Engineers<br>**Updated:** Platform stats (22 services, enhanced capabilities) |
| 1.1.0 | 2025-12-22 | Added Technical Research Analyst agent (14 total agents) |
| 1.0.0 | 2025-12-22 | Initial release with 13 agents |

---

## Feedback & Contributions

Have suggestions for improving these agents?

1. **Report issues:** Create a GitHub issue describing the problem
2. **Suggest improvements:** Submit a PR with proposed changes
3. **Request new agents:** Email engineering@exprsn.com with your use case

---

## Additional Resources

- **Platform Documentation:** `/CLAUDE.md` (main platform guide)
- **Token Specification:** `/TOKEN_SPECIFICATION_V1.0.md`
- **Production Readiness:** `/PRODUCTION_READINESS_COMPLETE.md`
- **Service READMEs:** `/src/exprsn-*/README.md`

---

**Remember:** These agents are tools to augment your expertise, not replace it. Use them as guides, references, and starting points. Your judgment, creativity, and problem-solving skills are irreplaceable. Happy building! 🚀
