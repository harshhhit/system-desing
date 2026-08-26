# 🌐 Google Sign-In with Credential Manager

This guide explains how **Google Sign-In** works in an Android app backed by a Node.js API.

> [!TIP]
> **Quick Summary**: The Android app gets an ID Token from Google, sends it to your Backend, and your Backend verifies it with Google before issuing its own session tokens.

---

## ⚡ Quick Implementation Checklist

- [ ] **Android**: Integrate Credential Manager API.
- [ ] **Android**: Obtain `ID Token` from Google.
- [ ] **Backend**: Create endpoint `POST /socialAuth/social-register`.
- [ ] **Backend**: Verify token using `google-auth-library`.
- [ ] **Backend**: Check if user exists (Login) or create new (Register).
- [ ] **Backend**: Return your own `accessToken` & `refreshToken`.

---

## 🖼️ Sequence Diagram (Mermaid)

This diagram visualizes the trust handshake between the Android app, your backend, Google’s servers, and your database.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant App as 📱 Android App
    participant API as 🛡️ Backend API
    participant Google as ☁️ Google OAuth
    participant DB as 🗄️ Database

    User->>App: Clicks "Sign in with Google"
    App->>Google: Request ID Token (via SDK)
    Google-->>App: Returns ID Token (JWT)

    Note right of App: Token contains email, name, picture

    App->>API: POST /socialAuth/social-register<br/>(ID Token, Device Info)
    
    API->>Google: verifyIdToken(token)
    Google-->>API: Valid Payload (email, sub, etc.)

    alt User Already Exists
        API->>DB: Find User by Email
        DB-->>API: User Record Found
        API->>API: Generate Auth Tokens
        API-->>App: 200 OK {user, tokens}
    else New User Registration
        API->>DB: Find User by Email
        DB-->>API: Not Found
        API->>DB: INSERT New User
        DB-->>API: User Created
        API->>API: Generate Auth Tokens
        API-->>App: 201 Created {user, tokens}
    end

    App-->>User: Show Logged-in Dashboard
```

---

## 🔍 Step-by-Step Explanation

### 1. User Action
The user taps the Google sign-in button. The Android app starts the OAuth flow using the **Credential Manager API**.

### 2. App Requests ID Token
Google handles the UI. After successful login, it returns an **ID Token** (a JWT) that proves identity.

### 3. App Sends Token to Backend
The app sends the ID token to your API:
`POST /socialAuth/social-register`

### 4. Backend Verifies Token
**Crucial Step**: Your backend must **NOT** trust the token blindly. It verifies it with Google to ensure:
*   Valid signature?
*   Not expired?
*   Issued for *your* Client ID?

### 5. Login or Registration Logic
*   **Existing User**: If the email exists in your DB, log them in.
*   **New User**: If not, create a new user record automatically (JIT Provisioning).

### 6. Issue App Tokens
Finally, your backend issues its **own** access/refresh tokens. The app uses these for future requests, not the Google token.