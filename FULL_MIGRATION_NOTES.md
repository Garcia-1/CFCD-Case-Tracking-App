# CFCD Dashboard Firestore Migration — Completion Notes

This build completes the dashboard data migration begun in the earlier Firebase version.

## What now comes from Firestore

### CFCD Supervisor
- Full case registry
- New case persistence
- Analyst assignment choices from active CFCD user profiles plus existing case assignments
- Case status changes and technical-delay notes
- Court urgent-request queue
- Team workload counts
- Court-safe status snapshots

Case updates write the full `cases/{id}` record and the reduced `courtCaseStatus/{id}` record in one Firestore commit.

Supervisor review of a court urgent request writes the case, court-safe status, and urgent request response in one Firestore commit so the records do not become partially updated.

### CFCD Analyst
- The browser no longer downloads the entire full case registry.
- Firestore is queried by the signed-in analyst Firebase UID, with a legacy name-based query merged in for existing seeded cases.
- Security rules enforce the same assignment boundary, so changing a display name no longer breaks UID-linked assignments.

### Court
- Reads only `courtCaseStatus`, never the full `cases` collection.
- Urgent requests persist in Firestore and include the submitting Firebase UID/email for traceability.
- Court-created urgent requests cannot write supervisor-response fields.

### Administrator
- Users, roles, audit events, configuration and case metrics persist in Firestore.
- Pending user profiles can now be activated from the dashboard.
- Suspended profiles lose Firestore access through the security rules.
- Dashboard data quietly refreshes when the browser regains focus and every 60 seconds.

## Runtime policy enforcement

`systemConfig/main` is now also used at runtime:

- `maintenanceMode=true` blocks non-admin case/court Firestore access through Firestore Security Rules and blocks non-admin sign-in/session restoration in the app.
- `sessionTimeout` is enforced as an idle timeout by the app. The updated value is picked up on the next sign-in/session refresh.

The `requireTwoFactor` and `emailNotifications` fields remain configuration flags. Enforcing Firebase MFA and sending email require their dedicated Firebase/notification integrations.

## Required deployment after copying these files

From the project directory, deploy the updated rules before testing the new code:

```bash
firebase login:use kmorris18@stu.ucc.edu.jm
firebase use cfcd-court-tracker
firebase deploy --only firestore
```

Then run:

```bash
npm install
npm run dev
```

No reseed is required for the existing database. Existing name-based assignments remain compatible; new/reassigned cases store `analystUid`. Re-running the seed later will also backfill the demo analyst UID and court submitter metadata.

## Files changed

- `src/App.jsx`
- `src/services/authService.js`
- `src/services/firestoreService.js`
- `src/portals/CaseManagementPortal.jsx`
- `src/portals/CFCDAdministratorDashboard.jsx`
- `firestore.rules`
- `scripts/seed-demo-users.mjs`
- `FIRESTORE_SCHEMA.md`
- `FIREBASE_SETUP.md`
