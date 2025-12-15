# Authentication Engineering Roadmap

Authentication is the mechanism to prove identity. In a real system you’ll combine it with authorization, auditing, secrets management, identity lifecycle, and operational controls. A production authentication service must handle security (cryptography, secrets), availability (scale, redundancy), privacy (data minimization), compliance (audit trails), and usability (SSO, MFA).

---

## Authentication Mechanism Comparison

| Type              | Common Use               | Strength            | Weakness                |
| ----------------- | ------------------------ | ------------------- | ----------------------- |
| Password-based    | Websites, legacy systems | Simple              | Weak security           |
| MFA               | Banks, enterprises       | High                | Slightly annoying       |
| Token-based       | APIs, mobile apps        | Scalable, stateless | Token theft             |
| Biometric         | Devices, offices         | Very secure         | Privacy issues          |
| Certificate-based | VPN, corporate           | Secure              | Complex setup           |
| SSO               | Cloud apps               | Convenient          | Single point of failure |
| Passwordless      | Modern apps              | Secure, fast        | Requires setup          |


## Roadmap — stages and what to master in each

### Stage 0 — Foundations (get your mental model solid)

**Goal:** understand the concepts you can’t fake in interviews.  
**What to learn:**

- Authentication vs Authorization vs Accounting (AAA).
- Factors: something you know / have / are / behave like.
- Threat modeling basics: impersonation, replay, credential stuffing, phishing, token theft.
- Cryptography basics: symmetric vs asymmetric keys, hashing, digital signatures, HMAC, TLS fundamentals.

**Practice:**

- Draw attack trees for a simple login flow.
- Explain, out loud, how TLS prevents MITM.

**Checkpoint (self-test):**

- Can you explain how a replay attack works and how nonces/timestamps mitigate it?

---

### Stage 1 — Classic authentication mechanisms

**Goal:** know legacy and common systems intimately.  
**What to learn:**

- Password storage best practices: hashing (bcrypt/argon2), salting, peppering, iteration counts.
- Session-based auth: cookies, secure flags, SameSite, session stores and session fixation.
- Basic biometric concepts and privacy considerations.

**Practice:**

- Implement a small login app that stores passwords with argon2 and issues server-side sessions.
- Break your own app with simple attacks (weak password checks, insecure cookie flags) and fix them.

**Checkpoint:**

- Can you list exact HTTP flags to protect session cookies and why each matters?

---

### Stage 2 — Modern token & federated auth (the heart of modern systems)

**Goal:** master JWT, OAuth2, OpenID Connect, SAML — when to use what.  
**What to learn:**

- JWT internals: headers, claims, signing vs encryption, RS256 vs HS256, token revocation problems.
- OAuth2 flows: Authorization Code, PKCE, Client Credentials, Device Flow, Refresh tokens.
- OpenID Connect basics: id_token vs access_token, userinfo endpoint.
- SAML basics for enterprise SSO and how it differs from OIDC.

**Practice:**

- Build an Authorization Server prototype (or use Keycloak locally) and wire a demo app using Authorization Code + PKCE.
- Create a microservice that validates access tokens and enforces scopes/claims.
- Implement refresh token rotation and detect token reuse.

**Checkpoint:**

- Explain exactly why storing JWTs in localStorage is risky and what to do instead.

---

### Stage 3 — Identity stores & enterprise protocols

**Goal:** know directory services, enterprise SSO, and legacy integration.  
**What to learn:**

- LDAP fundamentals and common operations.
- Kerberos basics and where it still matters.
- SCIM for provisioning users across systems.
- SSO integration patterns (SAML IdP/SP, OIDC RP/OP).

**Practice:**

- Spin up an LDAP server; create users and authenticate a small app against it.
- Integrate Keycloak with an external LDAP as user store.

**Checkpoint:**

- Can you map out user lifecycle: create user in HR system → provision to apps via SCIM → revoke access?

---

### Stage 4 — Hardening, security patterns & operational controls

**Goal:** make systems resilient and safe in production.  
**What to learn:**

- MFA enrollment flows and device lifecycle (backup codes, device removal).
- Rate limiting, credential stuffing detection, anomaly detection, and account lockout strategies.
- Account recovery flows & their risks (email reset vs. secure recovery).
- PKI basics, certificate management, mTLS (client certs).
- Secrets management: vaults, KMS, HSM usage for signing keys.

**Practice:**

- Implement MFA (TOTP) in your demo app and show how to enroll and revoke devices.
- Integrate your auth server with a secrets manager for signing keys.

**Checkpoint:**

- Describe a safe account recovery flow that balances usability and security.

---

### Stage 5 — Scale, observability, and enterprise features

**Goal:** design a production auth service.  
**What to learn:**

- Horizontal scale for auth: stateless tokens vs stateful sessions, sync of revocation lists, key rotation strategies.
- Availability: multi-region, redundancy, failover.
- Observability: auth metrics (latency, failures, suspicious logins), audit logs, sovereignty/compliance requirements.
- Rate-limiting and bot defenses (CAPTCHA, device fingerprinting).

**Practice:**

- Design an auth service diagram: load balancer → auth service clones → database, KMS/HSM for keys → cache for sessions/revocations → analytics pipeline for logs.
- Implement token key rotation and show consumers retrieve new keys (JWKS endpoint).

**Checkpoint:**

- Can you explain how to revoke a JWT immediately in a stateless system? Provide at least two pragmatic approaches and tradeoffs.

---

### Stage 6 — Advanced and modern trends

**Goal:** know where industry is headed and best practices for zero trust.  
**What to learn:**

- Passwordless flows (magic links, WebAuthn/FIDO2).
- Zero trust identity: continuous authentication, device posture, short-lived credentials.
- Delegated auth: OAuth2 for APIs and service-to-service auth (mutual TLS, signed JWTs).
- Identity governance: least privilege, periodic access reviews, Just-in-Time (JIT) access.

**Practice:**

- Implement a WebAuthn login demo.
- Design a zero trust access model for a microservice architecture (include device attestation).

**Checkpoint:**

- Explain the difference between WebAuthn and a TOTP-based second factor and when to choose each.

---

## Concrete hands-on projects (do them; don’t pretend)

### Build a minimal auth server

**Tech:** Python (FastAPI) or Node.js (Express).

**Features:** registration (argon2), login, issue JWT access + refresh token, refresh rotation, logout (revoke refresh), TOTP MFA.

**Extras:** JWKS endpoint for public keys, simple dashboard to view active tokens.

---

### SSO integration project

Install Keycloak or Auth0 (local or trial) and integrate with two sample apps (one web, one API). Support SAML and OIDC apps.

---

### Microservices token validation

Create 3 services: auth, api-gateway, resource-service. Gateway validates tokens and forwards claims. Simulate token expiry and revocation.

---

### Passwordless + WebAuthn demo

Implement magic link flow and a WebAuthn flow for device-based login.

---

### Enterprise lab

LDAP + Keycloak + SCIM user provisioning + MFA + audit logs shipped to ELK/Prometheus.

---

## How to practice architecture/design interviews

- Practice drawing end-to-end diagrams on a whiteboard or Miro quickly: user → IdP → SP → microservices → DB → KMS. Label threats and mitigation.
- Memorize tradeoffs: stateful vs stateless sessions, short vs long tokens, token revocation strategies, user experience vs security.
- Prepare answers for: “How do you rotate signing keys without downtime?”, “How do you detect a compromised token?”, “Design an SSO for 10 internal apps and external partners.”

---

## Evaluation checklist for a production auth service

- Secure password storage and enforcement policy?
- MFA available and enrolled?
- Strong TLS everywhere, HSTS, secure cookie flags?
- JWKS endpoint, key rotation, and audited signing keys?
- Secrets in vault/KMS/HSM?
- Rate-limiting, anomaly detection, and logging?
- Audit trail with immutable logs, access review processes?
- Recovery and incident playbooks (compromised keys, user data breach)?
- Compliance: data locality, retention, consent flows?

---

## Tools & tech you should become comfortable with

**Protocols:** OAuth2, OIDC, SAML, JWT, WebAuthn, SCIM, LDAP, Kerberos.  
**Servers/Products:** Keycloak, Auth0, AWS Cognito, Okta (know tradeoffs), Vault, Let's Encrypt.  
**Languages/frameworks:** Python (Flask/FastAPI), Node.js (Express), Java (Spring Security) — whichever you’ll deploy for real.  
**Infra:** KMS (AWS KMS/GCP KMS), HSM (conceptually), Docker, Kubernetes, Redis (session store), PostgreSQL, ELK/Prometheus for logs/metrics.

---

## Interview-style checklist of concepts you must explain clearly

- JWT signing vs encryption — when to use each.
- PKCE — why public clients need it.
- Refresh token rotation and detection of reuse.
- How to safely implement SSO across domains.
- Strategies to immediately revoke access in a stateless JWT world.
- WebAuthn attestation/registration lifecycle.

---

## Quick study & practice plan (order to follow)

Foundations → 2. Passwords & sessions → 3. JWT & OAuth2/OIDC → 4. LDAP/SAML/SSO → 5. MFA & account lifecycle → 6. Scale and key management → 7. Passwordless & zero trust → 8. Hands-on projects above → 9. Interview practice.

---

## Common pitfalls (so you don’t look foolish later)

- Storing JWTs in localStorage (XSS risk).
- Using HS256 when RS256 is needed for distributed verification.
- Long-lived refresh tokens without rotation.
- Using SMS as the only MFA option (SIM-swap risk).
- Ignoring replay attacks and not using nonce/timestamps where required.
