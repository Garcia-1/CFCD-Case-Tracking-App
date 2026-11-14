# Firestore Schema — CFCD Case Tracking System

## `users/{documentId}`

Authentication-linked users use their Firebase Auth UID as the document ID. Pending directory-only profiles may use a temporary document ID until a trusted Admin SDK provisioning service is added.

Typical fields:

- `name`
- `email`
- `portal`: `cfcd`, `court`, or `admin`
- `role`: `Supervisor`, `Analyst`, `Court`, `Administrator`, etc.
- `status`: `Active`, `Pending`, or `Suspended`
- `description`
- `twoFactor` (profile metadata flag)
- `updatedAt`

Administrators manage these profiles. Supervisors may query CFCD directory profiles so analyst assignment choices come from Firestore rather than a hard-coded array.

## `cases/{caseId}`

Full CFCD case registry record. Court accounts are blocked from this collection.

Typical fields:

- `uid`
- `cons`
- `registryYear`
- `ref`
- `otherRef`
- `offence`
- `received`
- `item`
- `io`
- `division`
- `suspects`
- `victims`
- `analyst`
- `analystUid` (Firebase Auth UID when the assignment is linked to a real user profile)
- `status`
- `technicalNote`
- `history[]`
- `createdBy`
- `createdAt`
- `completedAt`
- `updatedAt`

Supervisors can read/write the full registry. Analysts query/read documents by `analystUid` when available. Legacy seeded/name-only assignments remain readable by matching the signed-in profile name during migration. Admin can read for system metrics.

## `courtCaseStatus/{caseId}`

Reduced case-status document written at the same time as the full case record.

Allowed fields:

- `uid`
- `cons`
- `registryYear`
- `ref`
- `otherRef`
- `received`
- `status`
- `updatedAt`

Court accounts read this collection instead of `cases`.

## `urgentRequests/{requestId}`

Court-to-CFCD urgent-request workflow.

Typical fields:

- `id`
- `caseRef`
- `court`
- `courtDate`
- `reason`
- `submitted`
- `submittedAt`
- `submittedBy`
- `submittedByUid`
- `submittedByEmail`
- `requestStatus`
- `replyStatus`
- `publicNote`
- `reviewedBy`
- `reviewedAt`
- `updatedAt`

Court users can create requests but cannot populate review/response fields. Supervisor/Admin profiles may update requests.

## `roles/{roleId}`

Administrator-managed role directory.

- `name`
- `description`
- `updatedAt`

## `auditLogs/{auditId}`

Administrator audit events.

- `date`
- `createdAt`
- `action`
- `by`
- `target`
- `ip`
- `details`

Client rules permit Admin create/read and disallow update/delete.

## `systemConfig/main`

Administrator configuration plus safe runtime policy settings.

- `defaultTat`
- `overdueReminder`
- `sessionTimeout`
- `auditRetention`
- `requireTwoFactor`
- `emailNotifications`
- `maintenanceMode`
- `updatedAt`

Active authenticated users may read this document because `sessionTimeout` and `maintenanceMode` are used by the application at runtime. Only Admin may write it.

## Security boundary

The system deliberately duplicates a small, non-sensitive subset of case status into `courtCaseStatus`. Court users never receive the full investigative case record.

Analysts no longer load all `cases` and filter only in React; the app makes an assignment-filtered Firestore query and the rules require the matching assignment.

Case + court-status updates and Supervisor urgent-request reviews use Firestore Commit so related documents are written atomically.
