# Exprsn System Architecture

This document contains Mermaid diagrams visualizing the Exprsn Certificate Authority Ecosystem architecture.

## Service Dependency Graph

```mermaid
graph TB
    subgraph "Core Infrastructure"
        CA[exprsn-ca<br/>Port 3000<br/>Certificate Authority]
        SETUP[exprsn-setup<br/>Port 3015<br/>Service Discovery]
        BRIDGE[exprsn-bridge<br/>Port 3010<br/>API Gateway]
    end

    subgraph "Authentication & Security"
        AUTH[exprsn-auth<br/>Port 3001<br/>OAuth2/OIDC/SAML]
        VAULT[exprsn-vault<br/>Port 3013<br/>Secrets Management]
    end

    subgraph "Social & Messaging"
        SPARK[exprsn-spark<br/>Port 3002<br/>Real-time Messaging]
        TIMELINE[exprsn-timeline<br/>Port 3004<br/>Social Feed]
        PREFETCH[exprsn-prefetch<br/>Port 3005<br/>Timeline Cache]
        LIVE[exprsn-live<br/>Port 3009<br/>Live Streaming]
    end

    subgraph "Content & Media"
        FILEVAULT[exprsn-filevault<br/>Port 3007<br/>File Storage]
        GALLERY[exprsn-gallery<br/>Port 3008<br/>Media Galleries]
        MODERATOR[exprsn-moderator<br/>Port 3006<br/>AI Moderation]
    end

    subgraph "Collaboration & Events"
        NEXUS[exprsn-nexus<br/>Port 3011<br/>Groups/Events/CalDAV]
    end

    subgraph "Notifications & Analytics"
        HERALD[exprsn-herald<br/>Port 3014<br/>Notifications]
        PULSE[exprsn-pulse<br/>Port 3012<br/>Analytics]
    end

    subgraph "Business & Automation"
        FORGE[exprsn-forge<br/>Port 3016<br/>CRM/Groupware/ERP]
        WORKFLOW[exprsn-workflow<br/>Port 3017<br/>Workflow Engine]
        PAYMENTS[exprsn-payments<br/>Port 3018<br/>Payment Gateway]
    end

    subgraph "Platform & Integration"
        SVR[exprsn-svr<br/>Port 5000<br/>Dynamic Page Server<br/>Low-Code Platform]
        ATLAS[exprsn-atlas<br/>Port 3019<br/>Geospatial & Mapping]
        DBADMIN[exprsn-dbadmin<br/>Port 3020<br/>Database Admin]
        BLUESKY[exprsn-bluesky<br/>Port 3021<br/>AT Protocol/PDS]
    end

    subgraph "External Services"
        POSTGRES[(PostgreSQL<br/>22 Databases)]
        REDIS[(Redis<br/>Cache & Queues)]
        OCSP[OCSP Responder<br/>Port 2560]
    end

    %% Core dependencies (all services depend on CA)
    CA --> POSTGRES
    CA --> OCSP
    SETUP --> CA
    BRIDGE --> CA
    AUTH --> CA
    SPARK --> CA
    TIMELINE --> CA
    PREFETCH --> CA
    MODERATOR --> CA
    FILEVAULT --> CA
    GALLERY --> CA
    LIVE --> CA
    NEXUS --> CA
    PULSE --> CA
    VAULT --> CA
    HERALD --> CA
    FORGE --> CA
    WORKFLOW --> CA
    PAYMENTS --> CA
    ATLAS --> CA
    DBADMIN --> CA
    BLUESKY --> CA
    SVR --> CA

    %% Service-to-service integrations
    TIMELINE --> HERALD
    TIMELINE --> PREFETCH
    TIMELINE --> REDIS
    TIMELINE --> MODERATOR
    SPARK --> REDIS
    LIVE --> REDIS
    WORKFLOW --> REDIS
    PAYMENTS --> REDIS
    AUTH --> REDIS
    HERALD --> REDIS

    %% Data dependencies
    TIMELINE --> POSTGRES
    AUTH --> POSTGRES
    SPARK --> POSTGRES
    PREFETCH --> POSTGRES
    MODERATOR --> POSTGRES
    FILEVAULT --> POSTGRES
    GALLERY --> POSTGRES
    LIVE --> POSTGRES
    NEXUS --> POSTGRES
    PULSE --> POSTGRES
    VAULT --> POSTGRES
    HERALD --> POSTGRES
    FORGE --> POSTGRES
    WORKFLOW --> POSTGRES
    PAYMENTS --> POSTGRES
    ATLAS --> POSTGRES
    DBADMIN --> POSTGRES
    BLUESKY --> POSTGRES
    SVR --> POSTGRES

    %% Low-Code Platform integrations
    SVR --> TIMELINE
    SVR --> AUTH
    SVR --> FORGE
    SVR --> WORKFLOW
    SVR --> FILEVAULT

    %% Business integrations
    FORGE --> PAYMENTS
    WORKFLOW --> FORGE
    WORKFLOW --> HERALD

    %% External integrations
    BLUESKY -.->|AT Protocol| TIMELINE
    ATLAS -.->|OSM/Google Maps| ExternalAPIs[External APIs]
    PAYMENTS -.->|Stripe/PayPal| PaymentGateways[Payment Gateways]

    style CA fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style SETUP fill:#4ecdc4,stroke:#099268,color:#fff
    style POSTGRES fill:#339af0,stroke:#1864ab,color:#fff
    style REDIS fill:#fa5252,stroke:#c92a2a,color:#fff
```

## CA Token Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Service as Any Service
    participant CA as exprsn-ca
    participant OCSP as OCSP Responder
    participant DB as PostgreSQL

    Client->>Service: API Request with CA Token
    Service->>Service: Extract Token from Header
    Service->>Service: Validate Token Structure
    Service->>CA: Verify Token Signature
    CA->>DB: Fetch Certificate
    CA->>OCSP: Check Certificate Status
    OCSP-->>CA: Certificate Valid
    CA->>CA: Verify RSA-PSS Signature
    CA->>CA: Check Token Expiry
    CA->>CA: Validate Permissions
    CA-->>Service: Token Valid + User Context
    Service->>Service: Check Resource Permissions
    Service->>DB: Execute Business Logic
    DB-->>Service: Data
    Service-->>Client: API Response
```

## Service-to-Service Communication Pattern

```mermaid
sequenceDiagram
    participant Timeline as exprsn-timeline
    participant Shared as @exprsn/shared
    participant Cache as Token Cache
    participant CA as exprsn-ca
    participant Herald as exprsn-herald

    Timeline->>Shared: serviceRequest(url, data)
    Shared->>Cache: Check for valid service token
    alt Token exists and valid
        Cache-->>Shared: Return cached token
    else Token expired or missing
        Shared->>CA: POST /api/tokens/generate
        Note over Shared,CA: {serviceName, resource, permissions}
        CA->>CA: Generate signed CA token
        CA-->>Shared: New token
        Shared->>Cache: Cache token
    end
    Shared->>Herald: HTTP Request + CA Token
    Herald->>Herald: Validate CA Token
    Herald->>Herald: Execute logic
    Herald-->>Shared: Response
    Shared-->>Timeline: Response data
```

## Low-Code Platform Architecture

```mermaid
graph TB
    subgraph "Low-Code Platform (exprsn-svr:5000)"
        LCMAIN[Platform Home<br/>/lowcode]
        APPD[App Designer<br/>/lowcode/designer]
        ENTD[Entity Designer<br/>/lowcode/entities/new]
        GRIDD[Grid Designer<br/>/lowcode/grids/new]
        FORMD[Form Designer<br/>/lowcode/forms/new]
    end

    subgraph "Form Designer Components (7 Modules)"
        FD_CORE[FormDesigner<br/>Core Engine<br/>4-Panel IDE]
        FD_DATA[DataBindingManager<br/>Entity/REST/JSONLex/Custom]
        FD_EVENT[EventHandlerManager<br/>7 Event Types]
        FD_PERM[PermissionsManager<br/>Form & Component Level]
        FD_WF[WorkflowIntegration<br/>Trigger Workflows]
        FD_FORGE[ForgeIntegration<br/>CRM Integration]
        FD_GRID[GridRuntimeRenderer<br/>Dynamic Grids]
    end

    subgraph "Component Library (27 Components)"
        BASIC[Basic: 12<br/>Input/Button/Label/etc]
        DATA[Data: 5<br/>Entity Picker/CRUD/Subgrid]
        LAYOUT[Layout: 5<br/>Container/Tabs/Accordion]
    end

    subgraph "Data Layer"
        LC_DB[(exprsn_svr DB)]
        MODELS[Low-Code Models<br/>Application/Entity<br/>EntityField/Grid<br/>Form/Resource]
    end

    subgraph "Services"
        ENTITY_SVC[EntityService<br/>CRUD Operations]
        GRID_SVC[GridService<br/>Rendering & Data]
        FORM_SVC[FormService<br/>Operations]
        JSONLEX[JSONLexService<br/>Expression Evaluation]
    end

    subgraph "Integration Points"
        INT_WF[exprsn-workflow<br/>Port 3017]
        INT_FORGE[exprsn-forge<br/>Port 3016]
        INT_AUTH[exprsn-auth<br/>Port 3001]
    end

    LCMAIN --> APPD
    LCMAIN --> ENTD
    LCMAIN --> GRIDD
    LCMAIN --> FORMD

    FORMD --> FD_CORE
    FD_CORE --> FD_DATA
    FD_CORE --> FD_EVENT
    FD_CORE --> FD_PERM
    FD_CORE --> FD_WF
    FD_CORE --> FD_FORGE
    FD_CORE --> FD_GRID

    FD_CORE --> BASIC
    FD_CORE --> DATA
    FD_CORE --> LAYOUT

    APPD --> MODELS
    ENTD --> ENTITY_SVC
    GRIDD --> GRID_SVC
    FORMD --> FORM_SVC

    MODELS --> LC_DB
    ENTITY_SVC --> LC_DB
    GRID_SVC --> LC_DB
    FORM_SVC --> LC_DB

    ENTITY_SVC --> JSONLEX
    GRID_SVC --> JSONLEX
    FORM_SVC --> JSONLEX

    FD_WF --> INT_WF
    FD_FORGE --> INT_FORGE
    FD_PERM --> INT_AUTH

    style FD_CORE fill:#845ef7,stroke:#5f3dc4,color:#fff
    style JSONLEX fill:#20c997,stroke:#099268,color:#fff
    style LC_DB fill:#339af0,stroke:#1864ab,color:#fff
```

## Database Architecture (Database-Per-Service)

```mermaid
graph LR
    subgraph "PostgreSQL Server"
        DB_CA[(exprsn_ca<br/>13 tables, 62 indexes)]
        DB_AUTH[(exprsn_auth<br/>14 tables, 84 indexes)]
        DB_TIMELINE[(exprsn_timeline)]
        DB_SPARK[(exprsn_spark)]
        DB_FILEVAULT[(exprsn_filevault)]
        DB_GALLERY[(exprsn_gallery)]
        DB_LIVE[(exprsn_live)]
        DB_NEXUS[(exprsn_nexus)]
        DB_PULSE[(exprsn_pulse)]
        DB_VAULT[(exprsn_vault)]
        DB_HERALD[(exprsn_herald)]
        DB_FORGE[(exprsn_forge)]
        DB_WORKFLOW[(exprsn_workflow)]
        DB_PAYMENTS[(exprsn_payments)]
        DB_ATLAS[(exprsn_atlas<br/>PostGIS enabled)]
        DB_BLUESKY[(exprsn_bluesky)]
        DB_SVR[(exprsn_svr<br/>Low-Code tables)]
        DB_MODERATOR[(exprsn_moderator)]
        DB_PREFETCH[(exprsn_prefetch)]
    end

    SVC_CA[exprsn-ca] --> DB_CA
    SVC_AUTH[exprsn-auth] --> DB_AUTH
    SVC_TIMELINE[exprsn-timeline] --> DB_TIMELINE
    SVC_SPARK[exprsn-spark] --> DB_SPARK
    SVC_FILEVAULT[exprsn-filevault] --> DB_FILEVAULT
    SVC_GALLERY[exprsn-gallery] --> DB_GALLERY
    SVC_LIVE[exprsn-live] --> DB_LIVE
    SVC_NEXUS[exprsn-nexus] --> DB_NEXUS
    SVC_PULSE[exprsn-pulse] --> DB_PULSE
    SVC_VAULT[exprsn-vault] --> DB_VAULT
    SVC_HERALD[exprsn-herald] --> DB_HERALD
    SVC_FORGE[exprsn-forge] --> DB_FORGE
    SVC_WORKFLOW[exprsn-workflow] --> DB_WORKFLOW
    SVC_PAYMENTS[exprsn-payments] --> DB_PAYMENTS
    SVC_ATLAS[exprsn-atlas] --> DB_ATLAS
    SVC_BLUESKY[exprsn-bluesky] --> DB_BLUESKY
    SVC_SVR[exprsn-svr] --> DB_SVR
    SVC_MODERATOR[exprsn-moderator] --> DB_MODERATOR
    SVC_PREFETCH[exprsn-prefetch] --> DB_PREFETCH

    style DB_CA fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style DB_AUTH fill:#845ef7,stroke:#5f3dc4,color:#fff
    style DB_ATLAS fill:#20c997,stroke:#099268,color:#fff
```

## Payment Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant Payments as exprsn-payments
    participant Queue as Bull Queue
    participant Worker as Payment Worker
    participant Gateway as Payment Gateway<br/>(Stripe/PayPal/Authorize.Net)
    participant DB as PostgreSQL
    participant Webhook as Webhook Handler

    Client->>Payments: POST /api/payments/process
    Payments->>Payments: Validate CA Token
    Payments->>DB: Create Payment Record (PENDING)
    Payments->>Queue: Add payment job
    Payments-->>Client: Payment ID + Status

    Queue->>Worker: Process payment job
    Worker->>Gateway: Process payment
    Gateway-->>Worker: Payment result
    Worker->>DB: Update payment status

    alt Payment Success
        Worker->>DB: Status = COMPLETED
    else Payment Failed
        Worker->>DB: Status = FAILED
        Worker->>Queue: Retry if applicable
    end

    Gateway->>Webhook: Payment notification
    Webhook->>DB: Update payment details
    Webhook->>Client: Webhook event (if configured)
```

## Workflow Execution Flow

```mermaid
graph TB
    START([Workflow Trigger])

    START --> LOAD[Load Workflow Definition]
    LOAD --> INIT[Initialize Execution Context]
    INIT --> STEP1{Step Type?}

    STEP1 -->|HTTP Request| HTTP[Execute HTTP Step]
    STEP1 -->|JavaScript| JS[Execute in VM2 Sandbox]
    STEP1 -->|Database| DB[Execute DB Query]
    STEP1 -->|Condition| COND[Evaluate Condition]
    STEP1 -->|Loop| LOOP[Iterate Collection]
    STEP1 -->|Delay| DELAY[Wait Duration]
    STEP1 -->|Email| EMAIL[Send via Herald]
    STEP1 -->|Transform| TRANS[JSONLex Transform]

    HTTP --> STORE[Store Result in Context]
    JS --> STORE
    DB --> STORE
    COND --> STORE
    LOOP --> STORE
    DELAY --> STORE
    EMAIL --> STORE
    TRANS --> STORE

    STORE --> CHECK{More Steps?}
    CHECK -->|Yes| STEP1
    CHECK -->|No| COMPLETE[Mark Complete]

    STORE -->|Error| ERROR[Error Handler]
    ERROR --> RETRY{Retry?}
    RETRY -->|Yes| STEP1
    RETRY -->|No| FAILED[Mark Failed]

    COMPLETE --> NOTIFY[Notify via Socket.IO]
    FAILED --> NOTIFY
    NOTIFY --> END([End])

    style START fill:#51cf66,stroke:#2b8a3e,color:#fff
    style END fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style ERROR fill:#ffa94d,stroke:#e67700,color:#fff
```

## SAML 2.0 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant SP as Service Provider<br/>(exprsn-auth)
    participant IdP as Identity Provider<br/>(Enterprise SSO)
    participant DB as PostgreSQL
    participant CA as exprsn-ca

    User->>SP: Access Protected Resource
    SP->>SP: Generate SAMLRequest
    SP->>SP: Sign with SP certificate
    SP-->>User: Redirect to IdP with SAMLRequest

    User->>IdP: SAMLRequest
    IdP->>IdP: Authenticate User
    IdP->>IdP: Generate SAMLResponse
    IdP->>IdP: Sign with IdP certificate
    IdP-->>User: Redirect to SP with SAMLResponse

    User->>SP: POST SAMLResponse
    SP->>SP: Validate XML signature
    SP->>SP: Verify IdP certificate
    SP->>SP: Extract user attributes
    SP->>DB: Find or create user
    SP->>CA: Generate CA token
    CA-->>SP: Signed token
    SP->>DB: Create session
    SP-->>User: Set session cookie + redirect

    User->>SP: Access resource with session
    SP-->>User: Protected resource
```

## Real-time Messaging Architecture (Spark)

```mermaid
graph TB
    subgraph "Client Layer"
        CLIENT1[Client 1<br/>Socket.IO]
        CLIENT2[Client 2<br/>Socket.IO]
        CLIENT3[Client 3<br/>Socket.IO]
    end

    subgraph "exprsn-spark (Port 3002)"
        SOCKET[Socket.IO Server]
        AUTH_MW[Socket Auth Middleware]
        MSG_HANDLER[Message Handler]
        E2E[E2EE Manager]
    end

    subgraph "Data Layer"
        REDIS_PUB[(Redis Pub/Sub<br/>Real-time events)]
        REDIS_CACHE[(Redis Cache<br/>Online users)]
        POSTGRES[(PostgreSQL<br/>Message history)]
    end

    subgraph "Integration"
        CA[exprsn-ca<br/>Token validation]
        HERALD[exprsn-herald<br/>Push notifications]
    end

    CLIENT1 <-->|Encrypted| SOCKET
    CLIENT2 <-->|Encrypted| SOCKET
    CLIENT3 <-->|Encrypted| SOCKET

    SOCKET --> AUTH_MW
    AUTH_MW --> CA
    AUTH_MW --> MSG_HANDLER

    MSG_HANDLER --> E2E
    E2E --> REDIS_PUB
    E2E --> POSTGRES

    MSG_HANDLER --> REDIS_CACHE
    REDIS_PUB --> MSG_HANDLER

    MSG_HANDLER -.->|Offline users| HERALD

    style E2E fill:#845ef7,stroke:#5f3dc4,color:#fff
    style REDIS_PUB fill:#fa5252,stroke:#c92a2a,color:#fff
```

## Timeline Feed Generation (Fan-out Pattern)

```mermaid
sequenceDiagram
    participant User
    participant Timeline as exprsn-timeline
    participant Queue as Bull Queue
    participant Worker as Timeline Worker
    participant Prefetch as exprsn-prefetch
    participant Herald as exprsn-herald
    participant Moderator as exprsn-moderator
    participant DB as PostgreSQL
    participant Redis

    User->>Timeline: POST /api/posts (Create post)
    Timeline->>Moderator: Moderate content
    Moderator-->>Timeline: Content approved
    Timeline->>DB: Insert post
    Timeline->>Queue: Add fan-out job
    Timeline-->>User: Post created (202 Accepted)

    Queue->>Worker: Process fan-out
    Worker->>DB: Get user's followers

    loop For each follower
        Worker->>Redis: Add post to follower's feed
        Worker->>Prefetch: Invalidate cache
    end

    Worker->>Herald: Queue notifications
    Worker->>DB: Update fan-out status

    Herald->>Herald: Send push notifications

    Note over User,Redis: Later: User requests timeline
    User->>Timeline: GET /api/timeline
    Timeline->>Prefetch: Check cache
    alt Cache hit
        Prefetch-->>Timeline: Cached feed
    else Cache miss
        Timeline->>Redis: Get feed from Redis
        Timeline->>Prefetch: Store in cache
    end
    Timeline-->>User: Timeline data
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer Layer"
        LB[Nginx/HAProxy]
    end

    subgraph "Application Servers"
        APP1[Server 1<br/>All Services]
        APP2[Server 2<br/>All Services]
        APP3[Server 3<br/>All Services]
    end

    subgraph "Data Layer"
        PG_PRIMARY[(PostgreSQL Primary<br/>Read/Write)]
        PG_REPLICA1[(PostgreSQL Replica 1<br/>Read Only)]
        PG_REPLICA2[(PostgreSQL Replica 2<br/>Read Only)]

        REDIS_PRIMARY[(Redis Primary)]
        REDIS_REPLICA[(Redis Replica)]
    end

    subgraph "Storage Layer"
        S3[S3/MinIO<br/>File Storage]
        IPFS[IPFS<br/>Distributed Storage]
    end

    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ALERTS[AlertManager]
    end

    LB --> APP1
    LB --> APP2
    LB --> APP3

    APP1 --> PG_PRIMARY
    APP2 --> PG_PRIMARY
    APP3 --> PG_PRIMARY

    APP1 --> PG_REPLICA1
    APP2 --> PG_REPLICA2
    APP3 --> PG_REPLICA1

    PG_PRIMARY -.->|Replication| PG_REPLICA1
    PG_PRIMARY -.->|Replication| PG_REPLICA2

    APP1 --> REDIS_PRIMARY
    APP2 --> REDIS_PRIMARY
    APP3 --> REDIS_PRIMARY

    REDIS_PRIMARY -.->|Replication| REDIS_REPLICA

    APP1 --> S3
    APP2 --> S3
    APP3 --> S3

    APP1 -.-> IPFS
    APP2 -.-> IPFS
    APP3 -.-> IPFS

    APP1 --> PROMETHEUS
    APP2 --> PROMETHEUS
    APP3 --> PROMETHEUS

    PROMETHEUS --> GRAFANA
    PROMETHEUS --> ALERTS

    style LB fill:#4ecdc4,stroke:#099268,color:#fff
    style PG_PRIMARY fill:#339af0,stroke:#1864ab,color:#fff
    style REDIS_PRIMARY fill:#fa5252,stroke:#c92a2a,color:#fff
```

---

## Legend

- **Solid lines** = Direct dependencies/communication
- **Dashed lines** = Optional or external integrations
- **Red services** = Critical infrastructure (CA)
- **Blue databases** = Data persistence layer
- **Purple services** = Authentication/Security
- **Green services** = External integrations
