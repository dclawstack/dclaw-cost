# DClaw Cost — Architecture Diagrams

> Source diagrams for infographic regeneration. Rendered with Mermaid.
> Version: 1.4 · Updated: 2026-05-31

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        B[Browser / App]
    end

    subgraph Frontend["Frontend · Next.js 14 · Port 3036"]
        LP[Landing Page /]
        DB[Dashboard /dashboard]
        CA[Cloud Accounts]
        BL[Billing Explorer]
        BU[Budgets & Alerts]
        RC[Recommendations]
        WS[Waste Items]
        CP[AI Copilot /copilot]
        RI[RI Planner]
        AL[Cost Allocation]
        CC[Container Costs]
        RP[FinOps Reports]
        SP[Spot Strategy]
        SA[SaaS Spend]
        CB[Carbon /carbon]
        CW[CopilotWidget — every page]
    end

    subgraph Backend["Backend · FastAPI · Port 8122"]
        API[API Router /api/v1]
        subgraph Services["Services Layer"]
            CS[copilot_service.py]
            AS[alert_service.py]
            AN[analyzer_service.py]
            WS2[waste_scanner_service.py]
            RI2[ri_planner_service.py]
            CA2[cost_allocation_service.py]
            SP2[spot_strategy_service.py]
            CB2[carbon_service.py]
        end
        subgraph Repos["Repository Layer (13 entities)"]
            CR[cloud_account_repo]
            BR[billing_record_repo]
            BUR[budget_repo]
            ALR[cost_alert_repo]
            RCR[recommendation_repo]
            WR[waste_item_repo]
            COR[copilot_repo]
        end
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL 16\ndclaw_cost\n13 tables)]
    end

    subgraph AI["AI Providers"]
        OR[OpenRouter\nkimi-k2 / claude-*]
        OL[Ollama · Local\nllama3.2]
    end

    B --> Frontend
    Frontend --> API
    API --> Services
    API --> Repos
    Repos --> PG
    CS --> OR
    CS --> OL
```

---

## 2. AI Copilot Streaming Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (Next.js)
    participant BE as FastAPI
    participant SV as copilot_service
    participant DB as PostgreSQL
    participant AI as OpenRouter / Ollama

    U->>FE: Type message + send
    FE->>BE: POST /api/v1/copilot/chat {session_id, message}
    BE->>DB: Persist user CopilotMessage
    BE->>SV: build_context(db) — parallel queries
    Note over SV,DB: asyncio.gather: total_spend, alerts, savings, top_services
    SV-->>BE: context string (live spend data)
    BE->>SV: stream_chat(message, context, history[-12:])
    SV->>AI: POST /chat/completions (stream: true)
    loop SSE stream
        AI-->>SV: token chunk
        SV-->>BE: yield token
        BE-->>FE: data: {"content": "..."}\n\n
        FE->>U: Render token
    end
    AI-->>SV: [DONE]
    BE->>DB: Persist full assistant reply (fresh session)
    BE-->>FE: data: [DONE]\n\n

    Note over SV,AI: On OpenRouter failure: fallback to Ollama
    Note over SV,AI: On Ollama failure: yield error message to stream
```

---

## 3. FinOps Data Pipeline

```mermaid
flowchart LR
    subgraph Ingest["Data Ingest"]
        I1[Cloud Billing APIs\nAWS / GCP / Azure]
        I2[Manual CSV Upload]
        I3[Container Metrics\nKubernetes / Prometheus]
        I4[SaaS Vendor APIs\nor manual entry]
    end

    subgraph Storage["PostgreSQL 16 — dclaw_cost"]
        BR[billing_records]
        CA[cloud_accounts]
        BU[budgets]
        WI[waste_items]
        RC[resource_recommendations]
        RI[ri_plans]
        CC[container_costs]
        SA[saas_subscriptions]
        SP[spot_strategies]
        CB[carbon_records]
        TA[tag_allocations]
        AL[cost_alerts]
        CO[copilot_messages]
    end

    subgraph Analysis["Analysis Services"]
        ALS[alert_service\nthreshold + forecast + anomaly]
        ANS[analyzer_service\nright-sizing + waste heuristics]
        RIS[ri_planner_service\nbreak-even + 6 commitment types]
        SPS[spot_strategy_service\ninterruption risk scoring]
        CAS[cost_allocation_service\ntag → team/project matching]
        CBS[carbon_service\n19-region intensity table]
    end

    subgraph Output["Outputs"]
        DS[Dashboard Stats]
        SB[Showback Reports]
        FR[FinOps Reports\n12-month trend + unit economics]
        CP[Copilot Context\nlive spend snapshot]
    end

    I1 -->|POST /billing-records/ingest| BR
    I2 -->|POST /billing-records/ingest| BR
    I3 -->|POST /container-costs/ingest| CC
    I4 --> SA

    BR --> ALS --> AL
    BR --> ANS --> RC
    BR --> ANS --> WI
    BR --> RIS --> RI
    BR --> SPS --> SP
    BR --> CBS --> CB
    BR & TA --> CAS --> SB

    AL & RC & WI & RI & SP & SB --> DS
    BR & RC --> FR
    AL & RC & BR --> CP
```

---

## 4. LLM Provider Selection

```mermaid
flowchart TD
    S[Copilot Request] --> A{OPENROUTER_API_KEY\nset?}
    A -->|Yes| OR[httpx.AsyncClient\nhttps://openrouter.ai/api/v1\nmodel: kimi-k2 or claude-*\nstream: true]
    A -->|No| OL[httpx.AsyncClient\nhttp://localhost:11434/api/chat\nmodel: llama3.2\nstream: true]

    OR --> TC1[try/except]
    TC1 -->|ConnectError| OL
    TC1 -->|TimeoutException| MSG1["yield: [Copilot timed out]"]
    TC1 -->|Other error| MSG2["yield: [Copilot error — sanitized]"]
    TC1 -->|Success| R[Stream tokens to client via SSE]

    OL --> TC2[try/except]
    TC2 -->|ConnectError| MSG3["yield: [Ollama not running]"]
    TC2 -->|Success| R

    R --> D[data: content\n\n per token]
    D --> DONE["data: [DONE]\n\n"]
```

---

## 5. Docker Compose Service Map

```mermaid
graph LR
    subgraph dc["docker compose up"]
        PG[(postgres:16-alpine\nPort 5432\ndclaw_cost DB)]
        BE[backend\npython:3.11-slim\nPort 8122\nnon-root user]
        FE[web / frontend\nnode:20-alpine\nPort 3036]
    end

    FE -->|BACKEND_URL\nServer-side proxy| BE
    BE -->|DATABASE_URL| PG
    PG -.->|healthcheck pg_isready| BE
    BE -.->|healthcheck urllib.request| FE

    note1["Backend: python urllib.request.urlopen()"]
    note2["Frontend: wget -q --spider"]
    note3["All API calls proxied server-side\n— BACKEND_URL never exposed to browser"]
```

---

## 6. Data Model (13 Entities)

```mermaid
erDiagram
    CloudAccount {
        UUID id PK
        string name
        enum provider
        string external_account_id
        enum status
    }
    BillingRecord {
        UUID id PK
        UUID cloud_account_id FK
        string service
        string region
        float cost_usd
        date billing_period_start
        date billing_period_end
        json tags
    }
    Budget {
        UUID id PK
        string name
        float amount_usd
        enum period
        enum scope
        int alert_threshold_pct
    }
    CostAlert {
        UUID id PK
        UUID budget_id FK
        enum alert_type
        float current_spend_usd
        enum severity
        bool acknowledged
    }
    ResourceRecommendation {
        UUID id PK
        UUID cloud_account_id FK
        enum recommendation_type
        float estimated_savings_usd
        int confidence
        enum status
    }
    WasteItem {
        UUID id PK
        UUID cloud_account_id FK
        enum waste_type
        float estimated_monthly_waste_usd
        enum status
    }
    CopilotMessage {
        UUID id PK
        string session_id
        enum role
        text content
    }
    RIPlan {
        UUID id PK
        UUID cloud_account_id FK
        string commitment_type
        float annual_savings
        int break_even_months
    }
    TagAllocation {
        UUID id PK
        string tag_key
        string tag_value
        string team
        string project
    }
    ContainerCost {
        UUID id PK
        UUID cloud_account_id FK
        string cluster
        string namespace
        float total_cost_usd
    }
    SaasSubscription {
        UUID id PK
        string vendor
        float monthly_cost_usd
        date renewal_date
        enum status
    }
    SpotStrategy {
        UUID id PK
        UUID cloud_account_id FK
        enum workload_type
        float estimated_savings_usd
        enum interruption_risk
    }
    CarbonRecord {
        UUID id PK
        UUID cloud_account_id FK
        string region
        float co2_kg
        float carbon_intensity_gco2_kwh
    }

    CloudAccount ||--o{ BillingRecord : "has records"
    CloudAccount ||--o{ ResourceRecommendation : "has recommendations"
    CloudAccount ||--o{ WasteItem : "has waste"
    CloudAccount ||--o{ RIPlan : "has RI plans"
    CloudAccount ||--o{ ContainerCost : "has container costs"
    CloudAccount ||--o{ SpotStrategy : "has spot strategies"
    CloudAccount ||--o{ CarbonRecord : "has carbon records"
    Budget ||--o{ CostAlert : "triggers alerts"
```

---

## 7. Screen Navigation Map

```mermaid
graph TD
    LAND[Landing /]
    DASH[Dashboard /dashboard]
    CA[Cloud Accounts /cloud-accounts]
    BL[Billing /billing]
    BU[Budgets /budgets]
    RC[Recommendations /recommendations]
    WS[Waste /waste]
    CP[Copilot /copilot]
    RI[RI Planner /ri-planner]
    AL[Cost Allocation /cost-allocation]
    CC[Container Costs /container-costs]
    RP[Reports /reports]
    SP[Spot Strategy /spot-strategy]
    SA[SaaS /saas]
    CB[Carbon /carbon]
    CW[CopilotWidget — all app pages]

    LAND --> DASH
    DASH --> CA
    DASH --> BU
    DASH --> RC

    CA --> BL
    BU --> BL
    RC --> WS

    DASH --> RI
    DASH --> AL
    DASH --> CC
    DASH --> RP
    DASH --> SP
    DASH --> SA
    DASH --> CB
    DASH --> CP

    CW -.->|floating widget| DASH
    CW -.->|floating widget| CA
    CW -.->|floating widget| BL
    CW -.->|floating widget| BU
    CW -.->|floating widget| RC

    RC -->|AI: scan account| RC
    BU -->|AI: forecast alert| BU
    CP -->|AI: streaming chat| CP
    RI -->|AI: RI analysis| RI
    SP -->|AI: spot analysis| SP
    CB -->|AI: carbon calc| CB
```

---

## 8. API Feature Coverage by Priority

```mermaid
mindmap
  root((DClaw Cost\nAPI · 136 routes))
    P0 Foundation
      Health /health
      Cloud Accounts CRUD
      Billing Records ingest + list
      Budgets CRUD
      Cost Alerts list + acknowledge
      Recommendations list + status
      Waste Items list + status
      Dashboard aggregate stats
      Copilot chat SSE + history
    P1 Platform
      RI Plans analyze + CRUD + status
      Waste Scan on-demand scan
      Cost Allocation rules + showback
      Container Costs ingest + namespace summary
    P2 Scale
      FinOps Reports 12-month trend
      Spot Strategy analyze + summary + status
      SaaS Subscriptions CRUD + summary
      Carbon calculate + summary
```

---

## 9. P0.5 Security & Reliability Hardening (Pending)

```mermaid
flowchart LR
    subgraph Current["Current State (no auth)"]
        REQ[Any HTTP Request]
        API[All 136 Endpoints\nPublicly Accessible]
        LLM[OpenRouter\nUnlimited spend]
        DB2[PostgreSQL\nAll data exposed]
    end

    subgraph Target["Target State (P0.5)"]
        REQ2[HTTP Request]
        LOGTO[Logto JWT\nValidation]
        RATELIM[Rate Limiter\n30 req/min copilot\n5 req/min auth]
        SCOPE[Scoped CORS\nExplicit origins only]
        AUTH2[Protected Routes\n/api/v1/* — auth required\n/health — public]
        IDEM[Idempotent Ingest\nsource_record_id unique]
        OBS[Observability\nstructlog + Prometheus + Sentry]
    end

    REQ --> API
    API --> LLM
    API --> DB2

    REQ2 --> SCOPE
    SCOPE --> LOGTO
    LOGTO -->|valid JWT| AUTH2
    LOGTO -->|invalid| 401[401 Unauthorized]
    AUTH2 --> RATELIM
    AUTH2 --> IDEM
    AUTH2 --> OBS
```
