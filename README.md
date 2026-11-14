# CFCD Case Tracking System

React + Vite capstone prototype for the Communication Forensics and Cybercrime Division (CFCD).

## Included portals

The project starts at one sign-in screen with **CFCD** and **Court** choices. Administrators use the CFCD choice. It routes each demo account to its appropriate interface:

=======
The project starts at a single sign-in screen and routes each demo account to its portal:

| Demo account | Portal | Username | Password |
| --- | --- | --- | --- |
| CFCD Analyst | CFCD Analyst interface | `analyst@cfcd.demo` | `AnalystDemo123!` |
| CFCD Supervisor | CFCD Supervisor interface | `supervisor@cfcd.demo` | `SupervisorDemo123!` |
| Court User | Court interface | `court@cfcd.demo` | `CourtDemo123!` |
| Administrator | Administrator dashboard | `admin@cfcd.demo` | `AdminDemo123!` |

These credentials are hard-coded for prototype demonstrations only. 
=======
These credentials are hard-coded for prototype demonstrations only.

## Project structure

```text
cfcd-case-tracking-system/
├── .vscode/
│   └── settings.json
├── src/
│   ├── assets/
<<<<<<< HEAD
│   │   ├── CFCD-logo.jpg
│   │   ├── court-portal-background.webp
│   │   └── CFCD-portal-background.jpg
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Login.css
│   │   ├── ProfileMenu.jsx
│   │   └── ProfileMenu.css
=======
│   │   └── CFCD-logo.jpg
│   ├── components/
│   │   ├── Login.jsx
│   │   └── Login.css
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
│   ├── portals/
│   │   ├── CaseManagementPortal.jsx
│   │   ├── CaseManagementPortal.css
│   │   ├── CFCDAdministratorDashboard.jsx
│   │   └── CFCDAdministratorDashboard.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── cfcd-case-tracking-system.code-workspace
├── index.html
├── package.json
└── vite.config.js
```

## Run in VS Code

1. Open `cfcd-case-tracking-system.code-workspace`.
2. Open the integrated terminal.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL shown by Vite.

## Portal routing

`src/App.jsx` acts as the demonstration-only front-end account router. The Administrator signs in through the **CFCD** tab.
=======
`src/App.jsx` acts as the front-end authentication router.

- CFCD Analyst -> `CaseManagementPortal` with the Analyst role.
- CFCD Supervisor -> `CaseManagementPortal` with the Supervisor role.
- Court User -> `CaseManagementPortal` with the Court role.
- Administrator -> `CFCDAdministratorDashboard`.

The avatar menu in each portal contains Profile (editable demo display name/email/notification preference) and Sign Out, which returns to the login screen.

## Shared design system

=======
The Sign out button in each portal returns to the login screen.

## Shared design system

The login and administrator dashboard use the same core styling:

- Font stack: `Inter, "Segoe UI", Arial, sans-serif`
- Dark navy: `#11253d`
- Active navy: `#284768`
- Primary blue: `#2563aa`
- Page background: `#f4f7fb`
- Main text: `#1b2a3e`
- Borders: `#e3eaf1`




## User interface updates

- Only **CFCD** and **Court** sign-in tabs are shown. Use `admin@cfcd.demo` on the CFCD tab for the administrator dashboard.
- The respective court and CFCD photos are displayed translucently behind the sign-in area using files in `src/assets/`.
- **Activate Account** opens a prototype explanation. It does **not** validate invitations or activate accounts; administrator approval, email invitations, MFA and secure sessions need backend implementation.
- Centre-aligned larger CFCD logo appears at the top of each portal sidebar; unnecessary breadcrumbs have been removed. The admin header identifies the Communication Forensics and Cybercrime Division, Jamaica Constabulary Force.
- The shared avatar menu (`ProfileMenu.jsx` and `ProfileMenu.css`) offers Profile and Sign Out. Profile edits update only current React memory state; assigned roles cannot be changed.
- **Register New CFCD Case** contains the requested divisions and an **Other** text field.
- **Court — Submit Urgent Request** contains the requested court options and an **Other** text field.
=======
