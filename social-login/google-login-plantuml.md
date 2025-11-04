@startuml
title Google Sign-In End-to-End Flow (Android + Backend + Google + Firebase + DB)

actor User as U
participant "Android App" as APP
participant "Google Identity (OAuth)" as GOOGLE
participant "Backend API" as API
database "Database" as DB
participant "Firebase (Admin SDK)" as FIREBASE
participant "Google Cloud Console" as GCP

== Initial Setup (One-time tasks) ==
GCP -> GCP : Create Project\nEnable Google Identity API
GCP -> GCP : Create OAuth Client IDs\n(Android + Web)
GCP -> GCP : Configure OAuth Consent Screen
GCP --> API : Provide GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
GCP --> APP : Provide Android OAuth Client ID
API -> FIREBASE : Initialize Firebase Admin with serviceAccount.json
note right of FIREBASE
serviceAccount.json is used only
for server-to-server calls
and token verification.
end note
DB -> DB : Create users table with\n(email, social_id, provider, etc.)

== User Login Flow ==
U -> APP : Clicks "Sign in with Google"
APP -> GOOGLE : Request ID Token\n(via Google SDK / Credential Manager)
GOOGLE --> APP : Return ID Token (JWT)

APP -> API : POST /socialAuth/social-register\n{token, authType, deviceType, deviceToken}
API -> GOOGLE : Verify ID Token\nverifyIdToken(token, audienceClients)
GOOGLE --> API : Valid payload\n(email, name, picture, sub)

alt Existing User (Login)
    API -> DB : SELECT * FROM users WHERE email = payload.email
    DB --> API : Existing user record
    API -> FIREBASE : Verify ID token (optional)\ngetAuth().verifyIdToken()
    FIREBASE --> API : Valid user verified
    API -> API : generateAuthTokens(user)
    API -> DB : Fetch user permissions
    DB --> API : Permission data
    API --> APP : 200 OK\nSocial_LOGIN_VERIFICATION\n{user, tokens}
else New User (Registration)
    API -> DB : SELECT * FROM users WHERE email = payload.email
    DB --> API : No record found
    API -> DB : INSERT new user\n(email, social_id, social_provider)
    DB --> API : New user created
    API -> API : generateAuthTokens(newUser)
    API --> APP : 201 CREATED\nREGISTERATION_SUCCESS\n{user, tokens}
end

APP --> U : Store tokens\nRedirect to Dashboard/Profile

== Post-login (Optional Backend Actions) ==
APP -> API : Authenticated requests\nwith access token
API -> FIREBASE : Verify Firebase token (optional)
API -> DB : Access protected data
DB --> API : Return user-specific results
API --> APP : Response (success/data)

@enduml

