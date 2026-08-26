Alright, here’s the **complete checklist** — everything each side (Android, Backend, Google Console, and Firebase if you’re using it) needs to do for your **Google Social Login flow** to work end-to-end.
No fluff. No hand-wavy “connect this with that.” Just the jobs that actually need doing.

---

## 🧩 1. **Google Cloud Console / API Setup**

This is the “Google-side” prep — you do this *once* for your project.

**Tasks:**

1. **Create or open** your Google Cloud project.
2. **Enable APIs:**

   * “Google Identity Services” or “Google Sign-In” API.
3. **Create OAuth 2.0 credentials:**

   * **Android Client ID** → use your app’s package name + SHA-1 signing certificate.
   * **Web Client ID** → used by your backend (for token verification).
4. **Set OAuth consent screen:**

   * App name, logo, support email, and authorized domains.
   * Add scopes if needed (default “email”, “profile”, “openid” are fine).
5. **Save the Client IDs:**

   * These go into both your Android app (`google-services.json` or code config) and your backend environment (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

**Outcome:**
You now have `client_id` values Google trusts.

---

## 📱 2. **Android App Setup**

Your Android app is the user-facing side — it talks to Google first, then to your backend.

**Tasks:**

1. **Add Credential Manager or Google Sign-In SDK:**

   * Use the official library per [Android docs](https://developer.android.com/identity/sign-in/credential-manager-siwg).
2. **Configure the Google Client ID:**

   * Use the **Android OAuth client ID** from the Google Console.
   * Add it in `google-services.json` or directly in the sign-in configuration.
3. **Implement Google Sign-In flow:**

   * Call Google’s sign-in intent.
   * On success, you’ll get an **ID token**.
4. **Send ID token to your backend:**

   * POST request to `/socialAuth/social-register` or `/socialAuth/social-login`.
   * Include:

     ```json
     {
       "token": "<ID_TOKEN>",
       "authType": "google",
       "deviceType": 2,
       "deviceToken": "<DEVICE_TOKEN>"
     }
     ```
5. **Handle backend response:**

   * Save `accessToken` and `refreshToken`.
   * Redirect user to dashboard or home screen.

**Outcome:**
User signs in via Google → gets ID token → backend receives and validates it.

---

## 🧠 3. **Backend Setup**

This is where your provided Node.js code comes in. It does the real work.

**Tasks:**

1. **Add environment variables:**

   * `GOOGLE_CLIENT_ID` → from Google Console (Web Client ID).
   * `GOOGLE_CLIENT_SECRET` (optional, mostly for OAuth flows).
   * `JWT_SECRET` → for your own token generation.
2. **Implement verification logic:**

   * Use `google-auth-library`’s `OAuth2Client` to verify the token.
   * The code you showed already does this:

     ```js
     const ticket = await googleClient.verifyIdToken({
       idToken: token,
       audience: config.google.audienceClients
     });
     ```
3. **Handle login/register logic:**

   * If user exists → `handleSocialLogin`.
   * If not → `handleSocialRegister`.
   * Both return tokens and user info.
4. **Add routes:**

   * `POST /socialAuth/social-login`
   * `POST /socialAuth/social-register`
5. **Connect database (Prisma):**

   * Ensure `users` table has fields like `email`, `social_id`, `social_provider`, etc.
6. **Use Firebase Admin SDK (optional):**

   * If you’re validating tokens in a Firebase backend or issuing Firebase custom tokens, initialize it with `serviceAccount.json`.

**Outcome:**
Your backend securely validates the Google token, manages user records, and issues your own app’s tokens.

---

## ☁️ 4. **Firebase (Optional Integration)**

If your backend uses Firebase for user management or notifications:

**Tasks:**

1. **Download `serviceAccount.json`:**

   * From Firebase Console → Project Settings → Service Accounts.
2. **Use only for backend Firebase SDK initialization:**

   * Example:

     ```js
     import admin from "firebase-admin";
     admin.initializeApp({
       credential: admin.credential.cert(serviceAccount)
     });
     ```
3. **Do *not* use serviceAccount.json for login verification.**

   * That’s only for server-to-server calls or token verification.

**Outcome:**
Backend can securely verify ID tokens, send FCM messages, or interact with Firebase.

---

## 🗄️ 5. **Database Setup**

Your Prisma-backed database holds the user information.

**Tasks:**

1. Add or verify these fields in your `users` table:

   * `id`
   * `email`
   * `social_id`
   * `social_provider`
   * `is_email_verified`
   * `created_at`
2. Add relationship to `user_role` if you use roles and permissions.
3. Make sure indexing is done on `email` (so you don’t duplicate users).

**Outcome:**
User records persist cleanly and link to tokens and roles.

---

## 🔄 6. **End-to-End Flow Summary**

| Step | Component                       | What Happens                        |
| ---- | ------------------------------- | ----------------------------------- |
| 1    | User taps “Sign in with Google” | Android app launches Google Sign-In |
| 2    | Google authenticates user       | Returns ID token to Android app     |
| 3    | Android sends token to backend  | Along with device details           |
| 4    | Backend verifies token          | Confirms authenticity with Google   |
| 5    | Backend checks DB               | Finds or creates user               |
| 6    | Backend issues tokens           | JWTs or custom access tokens        |
| 7    | App stores tokens               | User session starts                 |

---

## ✅ **Final Deliverables Checklist**

| Area                | Task                                             | Responsible      |
| ------------------- | ------------------------------------------------ | ---------------- |
| Google Cloud        | Create OAuth clients (Android + Web)             | Cloud Admin      |
| Android App         | Integrate Google Sign-In, send token to backend  | Mobile Dev       |
| Backend             | Verify token, manage users, generate JWTs        | Backend Dev      |
| Database            | Store user + role data                           | Backend Dev      |
| Firebase (optional) | Initialize Admin SDK                             | DevOps / Backend |
| Config              | Set up `GOOGLE_CLIENT_ID`, `JWT_SECRET` env vars | DevOps           |

---

If you follow this structure, your login flow will be airtight:
Google vouches for the user → your backend vouches for the token → your app vouches for the session.

Want me to write this as a **developer-ready checklist markdown file** (so you can drop it straight into your project repo)? It’ll look professional enough to pretend you planned it all from day one.
