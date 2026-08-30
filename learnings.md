# Knowledge & Engineering Learnings: Tara Solar ERP

This document captures key architecture decisions, troubleshooting solutions, system quirks, and design guidelines for the Tara Solar codebase to accelerate future development and avoid regressions.

---

## 1. Google Drive & File Storage Architecture

### A. Service Account vs. OAuth2 Storage Quotas
* **Problem**: When uploading files via Google Drive API using a Service Account to a personal Google Drive folder, Google rejects the upload with `Service Accounts do not have storage quota`.
* **Root Cause**: Google Service Accounts have zero storage capacity on personal Drives. They can only create zero-byte files unless the drive is a Google Workspace Shared Drive or uploads are authenticated via OAuth2 user credentials.
* **Solution Pattern** ([src/lib/gdrive.ts](file:///c:/Users/aquri/tara-solar/src/lib/gdrive.ts)):
  1. Priority 1: User OAuth2 credentials (`GOOGLE_DRIVE_OAUTH_CLIENT_ID`, `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`).
  2. Fallback: Service Account credentials (`GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`).
  3. Always pass `supportsAllDrives: true` to all Drive API methods (`files.create`, `files.delete`, `files.get`) for forward compatibility with Google Shared Drives.

### B. Security & Credentials in Migration Scripts
* Never hardcode Supabase service role JWTs or API keys inside utility scripts in `scripts/`.
* Scripts should load `.env.local` via `dotenv` and validate environment variables before execution with informative error messages.

---

## 2. Next.js & Local Development on Windows

### A. Turbopack File Locking (`Access is denied. (os error 5)`)
* **Problem**: `next dev` (which defaults to Turbopack in Next.js 16) frequently fails on Windows with `Error [TurbopackInternalError]: Access is denied. (os error 5)` or port locks caused by dangling node processes.
* **Resolution**:
  1. Use Webpack mode in `package.json`: `"dev": "next dev --webpack"`.
  2. If locked: Terminate dangling node processes and remove `.next` folder:
     ```powershell
     Get-Process -Name node | Stop-Process -Force
     Remove-Item -Recurse -Force .next
     ```

### B. PowerShell Route Group Syntax
* **Gotcha**: Next.js route groups use parentheses, e.g., `src/app/(admin)/...`.
* In PowerShell (pwsh), parentheses are treated as expression sub-shells. Always wrap file paths containing `(group)` in double quotes when running CLI commands:
  ```powershell
  git add "src/app/(admin)/documents/industrial-quote/page.tsx"
  ```

---

## 3. Quotation Engine & Commercial Calculations

### A. Industrial Quotation Model
* **Rate Structure**: Split into two distinct components:
  1. **System**: Solar Rooftop Power Generation System (default GST: 12% / 5%).
  2. **Installation**: Installation and Tools (default GST: 18%).
* **GST Modes**:
  * **Included**: Base amounts are derived backwards from subtotal (`subtotal / (1 + rate/100)`), and Grand Total equals `subtotalSystem + subtotalInstallation`.
  * **Excluded**: Base amounts are `capacity * rate`. GST is added on top.
    - Subtotal row: `Total (A + B) (GST Exclusive)`
    - Excluded GST on System
    - Excluded GST on Installation
    - Highlighted Grand Total row: `Total with GST (GST Included)`
* **Database Snapshot**: Always persist the complete `grandTotal` (including GST) in `quotations.amount` for accurate reporting and documents table view.

### B. Residential Quotation Model
* Single blended rate per Watt.
* Includes dynamic subsidy deduction (PM Surya Ghar DBT).
* Displays Net Payable after subsidy.

---

## 4. Brand Colors & UI Guidelines

* **Primary Brand Green**: `#65A30D` (used for `TARA`, primary highlights, subtotal amounts, positive badges).
* **Solar Amber / Gold**: `#F59E0B` / `#D97706` (used for `SOLAR`, warning badges, grand total with GST highlights).
* **Corporate Blue**: `#1E3A8A` / `blue-900` (used for document headers, section titles, table header bars).
* **Print Styling**:
  - Use `@media print` with explicit `@page { size: A4; margin: 0mm; }`.
  - Use `break-before: page-break-before: always;` and `break-inside-avoid: page-break-inside: avoid;`.
  - Avoid row splitting across pages with `tr, td, th, li { page-break-inside: avoid; }`.
