# TestForge Report — /work/project/dclaw-cost

**Overall:** 71/100  ·  7807 files · 1,107,381 lines · 136 endpoints
**Stack:** FastAPI, SQLAlchemy, Pydantic, Alembic, pytest, HTTP client (httpx/requests), PostgreSQL, Uvicorn/Gunicorn
**Analyzed:** 2026-05-31T13:05:21.932Z

## Dimension scores

| Dimension | Score | Findings |
|---|---|---|
| Security | 0/100 | 10 |
| Kubernetes | N/A | 0 |
| OWASP | 80/100 | 0 |
| Supply Chain | 100/100 | 0 |
| License | 89/100 | 0 |
| Unit Tests | 67/100 | 0 |
| Mutation | 32/100 | 0 |
| Property-Based | 50/100 | 0 |
| Edge Cases | 65/100 | 0 |
| Contract | 98/100 | 0 |
| Predictive Risk | 93/100 | 0 |
| N+1 Queries | 71/100 | 0 |
| Dead Code | 98/100 | 0 |
| Load | N/A | 0 |
| Chaos | 100/100 | 0 |
| Agentic Scale | 91/100 | 1 |
| Accessibility | 38/100 | 0 |
| Visual Regression | 95/100 | 0 |
| Vision | 81/100 | 3 |
| Scope | 100/100 | 0 |
| Stack | 47/100 | 0 |
| DORA | 25/100 | 0 |

## Findings by dimension

### Security — 0/100
*Method:* Intra-procedural AST taint tracking — JS/TS via Babel, and Python/FastAPI via a stdlib-ast python3 subprocess — tracing request input → SQL/exec/subprocess/open/HTTP sinks with sanitizer awareness; plus dependency-presence + config regex checks.
*Coverage:* JS/TS: deep AST taint (Babel). Python (FastAPI/Flask): intra-procedural AST taint for SQLi/RCE/path/SSRF (source→sink, parameterized-query & int()/quote() sanitizer-aware) PLUS 7 edge-case rules. Go: not yet (no Go parser).

- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:221`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:245`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:262`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:293`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:296`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:299`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:302`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:305`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:328`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:331`
  - `write(...)` passes its argument into a xss sink inside the helper. The argument here is built from variables.
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.

### Kubernetes — N/A
*Method:* Parses every YAML manifest and Helm chart (js-yaml, with Go-template expressions stubbed) and checks PodSpecs + RBAC: securityContext (runAsNonRoot/privileged/allowPrivilegeEscalation), resource requests/limits, liveness/readiness probes, image tags, wildcard RBAC, secrets-in-ConfigMaps, and NetworkPolicy presence.
*Coverage:* Kubernetes YAML + Helm charts (multi-doc); CRDs detected.
*Why N/A:* N/A when no Kubernetes manifests or Helm charts are found in the repo.

### OWASP — 80/100
*Method:* Maps JS/TS findings to OWASP boxes without infrastructure or polyglot coverage.
*Coverage:* JS/TS AST via Babel only. Python/Go not parsed. YAML/Helm not covered.

_No issues found in this dimension._

### Supply Chain — 100/100
*Method:* Resolves exact name@version from lockfiles across npm (package-lock), Python (poetry.lock/Pipfile.lock/requirements.txt) and Go (go.sum), then batch-queries the live OSV.dev vulnerability database; plus non-registry-source + integrity-hash + duplicate-version lockfile checks. Offline-safe (falls back to a built-in CVE list).
*Coverage:* npm + PyPI + Go ecosystems via live OSV (cached, network opt-in). Transitive npm deps via lockfile graph. Non-OSV checks (non-registry/integrity/dup) remain npm-lockfile-specific.

_No issues found in this dimension._

### License — 89/100
*Method:* Walks installed node_modules for SPDX license strings in package.json metadata, categorizes by pattern matching, reports counts and samples per category — no source-code analysis, no multi-package-manager coverage, no license-compatibility matrix.
*Coverage:* npm package-lock.json + node_modules inspection only; no Python/Go/other-language package managers (pip, go.mod, Cargo.toml, requirements.txt, etc.).

_No issues found in this dimension._

### Unit Tests — 67/100
*Method:* Uses a REAL coverage report when present (lcov / Cobertura / Istanbul) and falls back to a function-name + test-ratio heuristic otherwise. Test quality is AST-classified for both JS/TS (Babel) and Python (stdlib-ast): assertion-free, empty, and skipped tests are detected, not just counted.
*Coverage:* Coverage: lcov/Cobertura/Istanbul artifacts (any language). Test quality: JS/TS via Babel + Python (pytest/unittest) via Python AST (assertion/skip/empty). Go: counted only (no Go parser yet).

_No issues found in this dimension._

### Mutation — 32/100
*Method:* Walks JS/TS test-file AST to classify assertions by kill-potential (strong: specific value/error/object checks vs weak: truthiness-only), aggregates test-to-source ratio and matcher variety, applies a heuristic scoring formula, then flags per-file anti-patter…
*Coverage:* JS/TS AST only (Babel parser on .test.ts/.spec.ts files). Test-file counting includes Python (test_*.py, *_test.py) and Go (*_test.go) by filename convention, but NO assertion-quality analysis for th…

_No issues found in this dimension._

### Property-Based — 50/100
*Method:* Counts framework imports and property-assertion call sites via JS/TS Babel AST; detects invariant guards (type checks) as proxy signals, but makes no distinction between real property-based tests and mere assert/invariant call clustering.
*Coverage:* JS/TS AST only via Babel (via isParseable() gate). Python (hypothesis, pytest-check, property-based) — zero coverage (no Python AST introspection). Go (quickcheck, gopter) — zero coverage. Polyglot c…

_No issues found in this dimension._

### Edge Cases — 65/100
*Method:* Runs a real per-file Babel AST walk on JS/TS (catching parent-aware context like variable assignment) and spawns python3 ast subprocess for Python to surface exact line-number boundary-condition footguns, but is blind to Go and ignores k8s manifests/Helm/oper…
*Coverage:* JS/TS AST coverage is complete (Babel parses both). Python coverage is complete (python3 subprocess with stdin-piped script). Go: zero coverage — no edge-case detection for .go files even though the…

_No issues found in this dimension._

### Contract — 98/100
*Method:* Discovers endpoints via AST — JS/TS (Babel) and Python/FastAPI/Flask (stdlib-ast subprocess) — and cross-references against an OpenAPI/Swagger spec. For FastAPI (which auto-generates OpenAPI) it checks response_model coverage as the contract signal instead of demanding a static spec file.
*Coverage:* JS/TS routes via Babel AST. Python FastAPI/Flask/Starlette routes via Python AST (method/path + response_model/status_code/body-model signals). Go handlers not yet analyzed.

_No issues found in this dimension._

### Predictive Risk — 93/100
*Method:* Aggregates per-file complexity, N+1, dead-export, size, TODO density, and security findings via weighted linear scoring to rank files by incident likelihood.
*Coverage:* **JS/TS (full):** Complexity, N+1, dead exports via Babel AST.  **Python/Go (partial):** Only size (LOC) and TODO/FIXME regex. No AST-based complexity, N+1, or dead-code detection—these analyzers are…

_No issues found in this dimension._

### N+1 Queries — 71/100
*Method:* Walks Babel AST nodes for loop constructs, collects direct DB call children, and exempts parallelized patterns (Promise.all/allSettled).
*Coverage:* JavaScript/TypeScript AST only; Python/FastAPI backends, Go services, and other polyglot components ZERO coverage. The codebase is explicitly polyglot (React/TS frontend + FastAPI/Python backend + Go…

_No issues found in this dimension._

### Dead Code — 98/100
*Method:* Per-file Babel AST walks collect declared and referenced names, cross-referencing to find exports and dependencies with zero external uses; Python/Go are blind spots relying only on package.json presence checks.
*Coverage:* JS/TS AST only; Python/Go regex-only via imports (no per-file analysis); other languages: zero coverage

_No issues found in this dimension._

### Load — N/A
*Method:* Static AST pattern matching on middleware/imports yields a load-readiness capability score: credit for rate limiting, caching, connection pooling, health probes, request timeouts, circuit breakers, compression/LB/CDN; penalty for blocking sync I/O in request handlers (baseline 45, bounded 15–95 since static analysis can't confirm real throughput). Live throughput is measured separately by the /simulate engine.
*Coverage:* JS/TS AST only via Babel. Python and Go patterns not yet scored.
*Why N/A:* N/A when no Docker/k8s deployment files exist, codebase is a library without server entrypoint, or no web framework dependencies detected.

### Chaos — 100/100
*Method:* Walks Babel AST for JS/TS resilience patterns (retry, error handlers, graceful shutdown) and substring-matches try/catch; completely silent on Python backends, Go microservices, and k8s manifest-level chaos (probes, PDB, preStop hooks) that are equally critic…
*Coverage:* JS/TS AST only. Python FastAPI backend completely unanalyzed for chaos patterns (py-edge-cases.ts covers requests-no-timeout but not retry libraries, circuit breakers, or error handlers). Go complete…

_No issues found in this dimension._

### Agentic Scale — 91/100
*Method:* Regex substring matching on dependency names and code tokens (rateLimit, Cache-Control, pool, retry) combined with manual sequential threshold scoring to predict agent capacity.
*Coverage:* JS/TS only (regex on allContent, dependency parsing); does NOT check Python (FastAPI backend has no rate-limit analysis), Go (if present), Helm charts, or k8s manifests. For dkubex specifically: Fast…

- **[HIGH]** Auth Endpoints Not Rate Limited
  - AI agents frequently re-authenticate (token refresh, retry on 401). Without auth rate limiting, agents can brute-force or DoS your auth system.
  - _Fix:_ Rate limit auth endpoints separately: 5 attempts/min per IP. Add account locking after 10 failures. Monitor for unusual auth patterns.

### Accessibility — 38/100
*Method:* AST analysis for JSX/TSX attribute structure + regex pattern matching for HTML/Vue/Svelte + static luminance formula (no runtime contrast measurement or rendered pixel analysis).
*Coverage:* JS/TS only (JSX/TSX AST via Babel). HTML/Vue/Svelte via regex (no proper AST parser). Python/Go/Java backends ZERO coverage — no a11y checks for server-side rendered templates, API response contracts…

_No issues found in this dimension._

### Visual Regression — 95/100
*Method:* Walks JSX AST for inline style attributes and regex-scans their string values for hardcoded pixel units and hex color literals; does not analyze CSS files or test visual-regression setup.
*Coverage:* JS/TS only (JSX/TSX via Babel). Sees CSS/SCSS/LESS file COUNTS but does NOT parse them. No Vue/Svelte/Python/Go style analysis.

_No issues found in this dimension._

### Vision — 81/100
*Method:* Vision tests observability/analytics/flags via dependency whitelists and API versioning via regex substring; scope via README keyword matching with word boundaries; stack via Node.js package ecosystem classification — no AST analysis, no dynamic runtime measu…
*Coverage:* JS/TS only. Dependency detection works for any polyglot codebase if package.json exists. Scope/feature matching uses generic keyword-based word-boundary regex — works on README in any format. Stack a…

- **[HIGH]** No observability stack detected
  - No APM (OpenTelemetry/Datadog/NewRelic/Honeycomb) and no error tracking (Sentry/Rollbar/Bugsnag) dep detected. Without these, you can't correlate user-impacting issues with code changes.
  - _Fix:_ Start with Sentry — fastest path to crash/error visibility. Add OpenTelemetry if you need full tracing. Wire up alerts to a notification channel humans actually read.
- **[MEDIUM]** No feature-flag platform
  - Feature flags decouple deploy from release: kill-switch on regressions, staged rollouts to a % of users, A/B test cohorts. Releases without them are all-or-nothing.
  - _Fix:_ For early-stage: Posthog (free tier, JS-SDK-only). For larger teams: LaunchDarkly / Statsig. Even a homegrown flags table beats no kill-switch.
- **[HIGH]** No product analytics dependency
  - No Posthog / Mixpanel / Amplitude / Segment / Heap / Plausible / Fathom dep detected. Without telemetry on feature adoption + user journeys, you can't close the loop between code shipped and value delivered.
  - _Fix:_ PostHog (open source, generous free tier) is the lowest-friction start. Track 3-5 key events: signup, activation, first-value-moment, retention, churn signal.

### Scope — 100/100
*Method:* Scope tests whether documented product capabilities (from README) are actually implemented in source code by matching feature keywords via plaintext regex, not by AST taint-tracing or endpoint enumeration.
*Coverage:* JS/TS only via string content matching; Python/Go/other languages ignored (the hasAnyKeyword() function operates on plaintext string content, not parsed AST, so any mention of "api" or "auth" in back…

_No issues found in this dimension._

### Stack — 47/100
*Method:* Flat string set matching with JSON parse and file checks
*Coverage:* JS/TS only. No Python tools, no Go, no container config.

_No issues found in this dimension._

### DORA — 25/100
*Method:* Inspects CI workflow YAML filenames and job/step naming patterns, plus presence/absence of observability and test packages in package.json — no execution metrics, no cross-language analysis, no k8s-native patterns.
*Coverage:* JS/TS CI configs only; package.json devDependencies only. Python backend (FastAPI, pytest, observability) completely invisible. Go tooling undetected. Only filesystem and package.json examined — no A…

_No issues found in this dimension._

## Test coverage

| Metric | Value |
|---|---|
| Estimated function coverage | 67% |
| Test files | 54 |
| Test cases | 275 |
| Frameworks | pytest |

## Security findings

933 total · 540 critical · 386 high · 1 medium · 3 low
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:221`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:245`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:262`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:293`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:296`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:299`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:302`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:305`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:328`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.
- **[HIGH]** XSS via `write()` helper — `web/node_modules/object-hash/index.js:331`
  - _Fix:_ Either sanitize the argument before passing it to `write`, or rewrite `write` to use the safe alternative (parameterized queries, escape, etc.) internally.

## Tier 2 — Generated tests

Model: anthropic/claude-sonnet-4.6 · 12/12 tests passed
- `no-observability-stack-detected-src-l0.test.ts` — passed 4/4 · for: No observability stack detected
- `no-product-analytics-dependency-src-l0.test.ts` — passed 4/4 · for: No product analytics dependency
- `auth-endpoints-not-rate-limited-src-l0.test.ts` — passed 4/4 · for: Auth Endpoints Not Rate Limited

---
Generated by TestForge MCP (self-hosted) · testforge.run