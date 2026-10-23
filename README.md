# CFCD Case Tracking System

React + Vite capstone prototype for the Communication Forensics and Cybercrime Division (CFCD).

## Included portals

The project starts at a single sign-in screen and routes each demo account to its portal:

| Demo account | Portal | Username | Password |
| --- | --- | --- | --- |
| CFCD Analyst | CFCD Analyst interface | `analyst@cfcd.demo` | `AnalystDemo123!` |
| CFCD Supervisor | CFCD Supervisor interface | `supervisor@cfcd.demo` | `SupervisorDemo123!` |
| Court User | Court interface | `court@cfcd.demo` | `CourtDemo123!` |
| Administrator | Administrator dashboard | `admin@cfcd.demo` | `AdminDemo123!` |

These credentials are hard-coded for prototype demonstrations only.

## Project structure

```text
cfcd-case-tracking-system/
├── .vscode/
│   └── settings.json
├── src/
│   ├── assets/
│   │   └── CFCD-logo.jpg
│   ├── components/
│   │   ├── Login.jsx
│   │   └── Login.css
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

`src/App.jsx` acts as the front-end authentication router.

- CFCD Analyst -> `CaseManagementPortal` with the Analyst role.
- CFCD Supervisor -> `CaseManagementPortal` with the Supervisor role.
- Court User -> `CaseManagementPortal` with the Court role.
- Administrator -> `CFCDAdministratorDashboard`.

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
