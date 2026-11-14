# CFCD Case Tracking System — Firebase Setup

The prototype now uses Firebase for both authentication and the first dashboard-data migration.

## Firebase-backed areas

Firebase Authentication stores email/password identities.

Cloud Firestore now stores:

- `users/{uid-or-profile-id}` — portal, role, account status and profile metadata
- `cases/{caseId}` — full CFCD case records used by CFCD and Admin
- `courtCaseStatus/{caseId}` — reduced court-safe status snapshot (no suspects, victims, I/O, offence or technical note)
- `urgentRequests/{requestId}` — court urgent requests and supervisor responses
- `roles/{roleId}` — administrator-managed role definitions
- `auditLogs/{auditId}` — append-only prototype administrator audit events
- `systemConfig/main` — system configuration values used by the Admin dashboard

The Admin overview metrics and analyst workload are calculated from the `cases` collection rather than hard-coded numbers. Analyst case access is now assignment-filtered in Firestore (UID-first, with legacy name fallback), and Supervisor case/court-response updates use atomic Firestore commits.

## 1. Create or choose a Firebase project

1. Open Firebase Console.
2. Use the existing Firebase project **CFCD-Court-Tracker** (`cfcd-court-tracker`).
3. In **Project settings > General**, add a **Web app** if the project does not already have one.
4. The repository is already configured for the registered web app in `cfcd-court-tracker`.

Do not commit a Firebase service-account JSON file to GitHub.

## 2. Enable email/password authentication

In Firebase Console:

1. Go to **Build > Authentication**.
2. Click **Get started** if prompted.
3. Open **Sign-in method**.
4. Enable **Email/Password**.

## 3. Create Cloud Firestore

1. Go to **Build > Firestore Database**.
2. Click **Create database**.
3. Use **Production mode**.
4. Select the Firebase/Google Cloud location appropriate for the project.

The app uses the default Firestore database.

## 4. Configure the web app

From the repository root:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cfcd-court-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cfcd-court-tracker
VITE_FIREBASE_STORAGE_BUCKET=cfcd-court-tracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=684059154174
VITE_FIREBASE_APP_ID=1:684059154174:web:...
VITE_ENABLE_DEMO_ACCOUNTS=true
```

The project ZIP supplied for this setup already contains the real values in `.env`. The abbreviated values above are shown only to avoid duplicating the full configuration in the setup guide.

Firebase's Web API key identifies the Firebase project; it is not a service-account private key. The `.env` file is excluded by `.gitignore`.

## 5. Deploy Firestore security rules

Install the Firebase CLI if needed:

```bash
npm install -g firebase-tools
firebase login
```

Then, from the repository root:

```bash
firebase use cfcd-court-tracker
firebase deploy --only firestore:rules,firestore:indexes
```

The included rules intentionally separate portal access:

- **CFCD Supervisor** profiles can read/update the full `cases` collection, maintain court-safe status snapshots, query CFCD user profiles for assignment, and review urgent requests. **Analyst** profiles can read only cases assigned to their own profile name.
- **Court** accounts cannot read `cases`; they read only `courtCaseStatus` and may create urgent requests.
- **Admin** accounts manage user profiles, roles, configuration and audit data and may read case metrics.
- Audit records can be created/read by Admin but are not editable or deletable through the client rules.
- `maintenanceMode` blocks non-admin operational Firestore access; `sessionTimeout` is enforced by the app idle-session manager.

## 6. Seed Authentication + dashboard data

The repository contains `scripts/seed-demo-users.mjs`. It seeds the four demo Firebase Authentication accounts and the dashboard Firestore collections.

In Firebase Console, open:

**Project settings > Service accounts > Generate new private key**

Save the JSON key somewhere outside this repository.

On macOS/zsh, run:

```bash
export FIREBASE_PROJECT_ID="cfcd-court-tracker"
export FIREBASE_API_KEY="YOUR_WEB_API_KEY_FROM_PROJECT_SETTINGS"
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/Downloads/YOUR-SERVICE-ACCOUNT.json"
npm run seed:firebase
```

The script creates/updates these collections:

```text
users
roles
cases
courtCaseStatus
urgentRequests
auditLogs
systemConfig
```

It also seeds these prototype login accounts:

| Portal | Account | Email | Prototype password |
|---|---|---|---|
| CFCD | CFCD Analyst | `analyst@cfcd.demo` | `AnalystDemo123!` |
| CFCD | CFCD Supervisor | `supervisor@cfcd.demo` | `SupervisorDemo123!` |
| Court | Court User | `court@cfcd.demo` | `CourtDemo123!` |
| Admin | Administrator | `admin@cfcd.demo` | `AdminDemo123!` |

These credentials and all seeded case information are fictional prototype data only.

## 7. Run and test

```bash
npm install
npm run dev
```

### Authentication tests

- correct email/password + correct portal
- incorrect password
- correct credentials + wrong portal
- change a user's Firestore `status` to `Suspended` and verify sign-in is blocked
- refresh after sign-in and verify the session restores
- sign out

### CFCD dashboard tests

Sign in as the Supervisor and verify:

- seeded cases load from Firestore
- registering a case persists after refresh
- analyst assignment persists
- case status changes persist
- technical-delay notes persist
- reviewing a court urgent request updates both the request and case status

Sign in as the Analyst and verify only cases assigned to **CFCD Analyst** appear.

### Court dashboard tests

Sign in as Court and verify:

- case status rows load from `courtCaseStatus`
- investigative fields are not displayed/read from the full `cases` collection
- a new urgent request persists after refresh
- supervisor court-facing responses appear in the request register

### Administrator dashboard tests

Sign in as Admin and verify:

- overview metrics change based on Firestore cases
- workload is calculated from case assignments
- user profile edits/suspensions persist
- password-reset action requests a Firebase password-reset email for real Auth users
- roles persist
- audit entries persist
- system configuration persists

## Important user-management limitation

The Admin dashboard can now manage Firestore **user profile metadata**, but creating/deleting the actual Firebase Authentication identity is intentionally not performed from browser code. That should be implemented with Firebase Admin SDK in a trusted Cloud Function/server endpoint.

A Pending profile created in the Admin dashboard is therefore not automatically a login account yet.

## Production hardening still required

Before operational use with sensitive data:

1. Replace demo accounts and seeded case records.
2. Add an Admin SDK provisioning function for creating/deleting Authentication users.
3. Add real MFA enforcement; the current `twoFactor` value is profile metadata only.
4. The browser now uses atomic Firestore commits for related case/status/request writes; consider moving those workflows to trusted Cloud Functions for server-side validation/auditing before operational deployment.
5. Add server-generated audit events for sensitive actions instead of relying only on client-originated audit writes.
6. Review data-retention, access-control, logging and hosting requirements with JCF/MOJ stakeholders.
7. Run Firebase Emulator Suite tests against the security rules before production deployment.
