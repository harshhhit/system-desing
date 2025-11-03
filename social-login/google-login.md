Here’s the full, plain-English breakdown of what that PlantUML code represents — line by line — so you don’t have to squint at arrows like you’re decoding ancient cave drawings.

---

### **Overall Purpose**

The diagram describes how **Google Sign-In with Credential Manager** works in your app:
from the moment a user taps “Sign in with Google” on Android, all the way until your backend verifies the token, creates or fetches the user in the database, and returns access tokens.

It’s a **sequence diagram**, meaning it shows the order of interactions between five entities:

1. **User (U)** – the person tapping “Sign in with Google.”
2. **Android App (APP)** – your mobile client that integrates Google’s SDK.
3. **Backend API (API)** – your Node.js/TypeScript service (the one you showed earlier).
4. **Google OAuth Server (GOOGLE)** – Google’s authentication system.
5. **Database (DB)** – your app’s persistence layer (Prisma in your code).

---

### **Step-by-Step Explanation of Each Block**

#### 1. **Actors and Participants**

```plantuml
actor User as U
participant "Android App" as APP
participant "Backend API" as API
participant "Google OAuth Server" as GOOGLE
database "Database" as DB
```

These define the “people” and systems in the sequence.
The “actor” is the end-user; the rest are internal or external systems.

---

#### 2. **User Action**

```plantuml
U -> APP : Clicks "Sign in with Google"
```

The user taps the Google sign-in button. The Android app starts the OAuth flow using the Credential Manager API or Google Sign-In SDK.

---

#### 3. **App Requests ID Token from Google**

```plantuml
APP -> GOOGLE : Request ID Token (via Google SDK)
GOOGLE --> APP : Returns ID Token
```

Google handles the actual authentication UI.
After successful login, it returns an **ID token** (a JWT) that proves this user’s identity and includes their verified Google email, name, and profile picture.

---

#### 4. **App Sends Token to Backend**

```plantuml
APP -> API : POST /socialAuth/social-register\n(ID Token, device info, authType)
```

The app now sends the ID token to your backend API endpoint `/socialAuth/social-register` (or `/socialAuth/social-login`, depending on the case).
It also includes info like device type, device token, and authentication type (“google”).

---

#### 5. **Backend Verifies Token with Google**

```plantuml
API -> GOOGLE : verifyIdToken(token, audienceClients)
GOOGLE --> API : Valid token payload (email, name, picture, sub)
```

Your backend doesn’t blindly trust the token.
It sends it to Google’s servers to verify:

* Is it a valid signature?
* Is it not expired?
* Was it issued for *your* client ID?

If all checks pass, Google returns the decoded payload: user’s email, name, profile picture, and a unique ID (`sub`).

---

#### 6. **Branch: Login or Registration**

This is where the `alt` block comes in — PlantUML’s way of showing two possible paths.

##### **A. Existing User (Login)**

```plantuml
alt User already exists
    API -> DB : SELECT * FROM users WHERE email = payload.email
    DB --> API : Existing user found
    API -> API : generateAuthTokens(user)
    API -> DB : Fetch user permissions\n(convertGrantsToPermissionsObject)
    DB --> API : Permission data
    API --> APP : { status: OK,\nmessage: Social_LOGIN_VERIFICATION,\nuser, tokens }
```

1. Backend queries the database for the user’s email.
2. Finds a record → generates access and refresh tokens.
3. Fetches user roles and permissions (`convertGrantsToPermissionsObject`).
4. Sends a success response back to the Android app with tokens and user info.

##### **B. New User (Registration)**

```plantuml
else New user registration
    API -> DB : SELECT * FROM users WHERE email = payload.email
    DB --> API : No record found
    API -> DB : INSERT new user (email, social_id, social_provider, verified)
    DB --> API : New user created
    API -> API : generateAuthTokens(user)
    API --> APP : { status: CREATED,\nmessage: REGISTERATION_SUCCESS,\nuser, tokens }
end
```

1. Backend checks the database, finds no record.
2. Creates a new user with the Google email, social ID, and provider.
3. Marks the email as verified (since Google already did that).
4. Generates tokens for the new user.
5. Sends a “Registration Success” response to the app.

---

#### 7. **App Returns to User**

```plantuml
APP --> U : Logged-in user experience (dashboard, profile, etc.)
```

Once the Android app receives the response, it stores the tokens and redirects the user to the logged-in interface (dashboard, profile, etc.).

---

### **What the Diagram Shows Conceptually**

* **Front-end flow:** The Android app handles UI and Google SDK communication.
* **Back-end flow:** The API ensures the token is genuine, manages users in the database, and issues your app’s internal tokens.
* **Security:** The backend never trusts tokens from the client without verifying with Google.
* **Idempotent logic:** If the user already exists, it logs in; if not, it registers automatically.

---

In short:

> The PlantUML diagram visualizes the trust handshake between the Android app, your backend, Google’s servers, and your database, ensuring that only verified Google users can log in or sign up — all wrapped neatly in a secure, token-based workflow.

---

It’s the digital equivalent of a bouncer checking IDs at the door, verifying them with Google’s headquarters, and then either letting the guest in (login) or adding them to the guest list (registration).


@startuml
title Google Sign-In Social Login Flow (Android + Backend)

actor User as U
participant "Android App" as APP
participant "Backend API" as API
participant "Google OAuth Server" as GOOGLE
database "Database" as DB

U -> APP : Clicks "Sign in with Google"
APP -> GOOGLE : Request ID Token (via Google SDK)
GOOGLE --> APP : Returns ID Token

APP -> API : POST /socialAuth/social-register\n(ID Token, device info, authType)
API -> GOOGLE : verifyIdToken(token, audienceClients)
GOOGLE --> API : Valid token payload (email, name, picture, sub)

alt User already exists
    API -> DB : SELECT * FROM users WHERE email = payload.email
    DB --> API : Existing user found
    API -> API : generateAuthTokens(user)
    API -> DB : Fetch user permissions\n(convertGrantsToPermissionsObject)
    DB --> API : Permission data
    API --> APP : { status: OK,\nmessage: Social_LOGIN_VERIFICATION,\nuser, tokens }
else New user registration
    API -> DB : SELECT * FROM users WHERE email = payload.email
    DB --> API : No record found
    API -> DB : INSERT new user (email, social_id, social_provider, verified)
    DB --> API : New user created
    API -> API : generateAuthTokens(user)
    API --> APP : { status: CREATED,\nmessage: REGISTERATION_SUCCESS,\nuser, tokens }
end

APP --> U : Logged-in user experience (dashboard, profile, etc.)

@enduml