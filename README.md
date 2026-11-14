# CFCD Case Tracking System

React/Vite capstone prototype for tracking Communication Forensics & Cybercrime Division case referrals and status information across CFCD, Court, and Administrator portals.

## Firebase backend

The project now uses **Firebase Authentication + Cloud Firestore** for the login flow and the first dashboard-data migration.

Backend-enabled now:

- Email/password sign-in through Firebase Authentication
- Firestore user profiles and portal/role/status authorization
- Persistent authenticated sessions using Firebase refresh tokens
- CFCD case registry reads/writes
- Case assignment, case status, technical-delay notes and update history
- Court urgent-request submission and supervisor response workflow
- Separate court-safe case status collection so Court accounts do not read full investigative records
- Admin user-profile management metadata
- Admin roles
- Firestore audit records
- Admin system configuration
- Admin overview metrics/workload calculated from case data
- Firestore security rules for CFCD / Court / Admin separation

See **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** for setup, rule deployment, seed data and test instructions.

## Local development

```bash
npm install
cp .env.example .env
# Add your Firebase Web API key and Project ID to .env
npm run dev
```

## Seed Firebase prototype data

```bash
export FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
export FIREBASE_API_KEY="YOUR_WEB_API_KEY"
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/Downloads/YOUR-SERVICE-ACCOUNT.json"
npm run seed:firebase
```

## Build

```bash
npm run build
```

## Still to complete for a production backend

- Firebase Admin SDK/Cloud Function for Admin-created/deleted Authentication users
- Enforced MFA (the current 2FA field is profile metadata)
- Server-side/transactional workflow operations where multiple documents must update atomically
- Server-generated tamper-resistant audit logging
- Formal rule/emulator tests and production security review
