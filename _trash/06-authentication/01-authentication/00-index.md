# 🗺️ Authentication Engineering Roadmap

Authentication is the mechanism to prove identity. In a real system, you’ll combine it with authorization, auditing, secrets management, identity lifecycle, and operational controls.

> [!NOTE]
> A production authentication service must handle **Security** (cryptography), **Availability** (scale), **Privacy** (data minimization), **Compliance** (audit trails), and **Usability** (SSO, MFA).

---

## ⚖️ Authentication Mechanism Comparison

| Type | Common Use | Strength | Weakness |
| :--- | :--- | :--- | :--- |
| **Password-based** | Websites, legacy systems | Simple | Weak security |
| **MFA** | Banks, enterprises | High Security | Slightly annoying |
| **Token-based** | APIs, mobile apps | Scalable, stateless | Token theft risk |
| **Biometric** | Devices, offices | Very secure | Privacy issues |
| **Certificate-based** | VPN, corporate | Secure | Complex setup |
| **SSO** | Cloud apps | Convenient | Single point of failure |
| **Passwordless** | Modern apps | Secure, fast | Requires setup |

---

## 🚀 Roadmap: Stages of Mastery

### Stage 0: Foundations
*Get your mental model solid.*

**Goal:** Understand the concepts you can’t fake in interviews.

- [ ] **AAA**: Authentication vs Authorization vs Accounting.
- [ ] **Factors**: Something you know / have / are / behave like.
- [ ] **Threat Modeling**: Impersonation, replay, credential stuffing, phishing.
- [ ] **Cryptography**: Symmetric vs asymmetric, hashing, signatures, HMAC, TLS.

> [!TIP]
> **Practice:** Draw attack trees for a simple login flow. Explain out loud how TLS prevents MITM.

---

### Stage 1: Classic Mechanisms
*Know legacy and common systems intimately.*

- [ ] **Password Storage**: Hashing (bcrypt/argon2), salting, peppering.
- [ ] **Sessions**: Cookies, secure flags, SameSite, session fixation.
- [ ] **Biometrics**: Basic concepts and privacy.

> [!TIP]
> **Practice:** Implement a login app with Argon2 and server-side sessions. Break it with simple attacks and fix them.

---

### Stage 2: Modern Token & Federated Auth
*The heart of modern systems.*

**Goal:** Master JWT, OAuth2, OpenID Connect, SAML.

- [ ] **JWT Internals**: Headers, claims, signing vs encryption.
- [ ] **OAuth2 Flows**: Authorization Code, PKCE, Client Credentials.
- [ ] **OIDC**: `id_token` vs `access_token`, userinfo endpoint.
- [ ] **SAML**: Basics for enterprise SSO.

> [!WARNING]
> **Critical Check:** Explain exactly why storing JWTs in `localStorage` is risky and what to do instead.

---

### Stage 3: Identity Stores & Enterprise
*Directory services and legacy integration.*

- [ ] **LDAP**: Fundamentals and common operations.
- [ ] **SCIM**: Provisioning users across systems.
- [ ] **SSO Patterns**: SAML IdP/SP, OIDC RP/OP.

---

### Stage 4: Hardening & Operations
*Make systems resilient and safe.*

- [ ] **MFA**: Enrollment, backup codes, device removal.
- [ ] **Defenses**: Rate limiting, credential stuffing detection.
- [ ] **Recovery**: Account recovery flows (email vs secure).
- [ ] **Secrets**: Vaults, KMS, HSM usage.

---

### Stage 5: Scale & Observability
*Design a production auth service.*

- [ ] **Scale**: Stateless tokens vs stateful sessions.
- [ ] **Availability**: Multi-region, redundancy.
- [ ] **Observability**: Metrics (latency, failures), audit logs.

---

### Stage 6: Advanced & Future Trends
*Zero trust and best practices.*

- [ ] **Passwordless**: Magic links, WebAuthn/FIDO2.
- [ ] **Zero Trust**: Continuous auth, device posture.
- [ ] **Delegated Auth**: OAuth2 for APIs (mTLS, signed JWTs).

---

## 🛠️ Concrete Projects

1.  **Minimal Auth Server**: Python/Node.js. Registration, JWT, Refresh Rotation, TOTP.
2.  **SSO Integration**: Keycloak/Auth0 with two sample apps.
3.  **Microservices Validation**: Gateway validates tokens, forwards claims.
4.  **Passwordless Demo**: Magic link + WebAuthn.

---

## ✅ Production Checklist

- [ ] Secure password storage (Argon2/Bcrypt)?
- [ ] MFA available and enrolled?
- [ ] Strong TLS, HSTS, secure cookies?
- [ ] JWKS endpoint & key rotation?
- [ ] Secrets in Vault/KMS?
- [ ] Rate-limiting & logging?
- [ ] Audit trail & access reviews?
- [ ] Incident playbooks ready?

---

## 🚫 Common Pitfalls

> [!CAUTION]
> Avoid these mistakes to prevent security breaches:
> *   Storing JWTs in `localStorage` (XSS risk).
> *   Using `HS256` when `RS256` is needed.
> *   Long-lived refresh tokens without rotation.
> *   Using SMS as the only MFA option.
> *   Ignoring replay attacks (use nonces!).
