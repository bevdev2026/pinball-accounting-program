# TODO

## Tasks

### Setup
- [x] Initialize git repository
- [x] Install @supabase/supabase-js
- [x] Create .gitignore
- [x] Create .env with Supabase credentials
- [x] Create src/lib/supabase.ts client
- [x] Create src/lib/database.types.ts TypeScript types
- [x] Create supabase/schema.sql (full database schema)
- [x] Run schema.sql in Supabase SQL Editor
- [x] Install @types/react + @types/react-dom (v18)
- [x] Create tsconfig.json

### Dashboard
- [x] Layout with KPI cards, charts, maintenance alerts, loans summary (mock data)
- [x] Connect KPI cards to live Supabase data (current month + YTD: gross revenue, net revenue, expenses, net profit)
- [x] Connect revenue charts to live data with interactive time range filter (Last 30 Days / Last 3 Months / YTD / Custom date range)
- [x] Connect maintenance alerts to live data (OVERDUE/DUE SOON within 30 days)
- [x] Connect loans summary to live data (amortization-calculated remaining balance + total paid)

### Locations
- [x] Locations management view (list, add, edit — name, address, main contact, contact email, phone number)
- [x] Global "active location" switcher in sidebar (persisted to localStorage)
- [x] "Locations" top-level nav item (CLAUDE.md nav spec updated to 9 items)
- [x] Machines: required Location field on add/edit, machines list scoped to active location
- [x] Revenue (machine & non-machine): scoped to active location; machine revenue location_id derives from the machine's own location
- [x] Expenses: list and machine dropdown scoped to active location
- [x] Rent & Commission: agreements scoped to active location
- [x] "All Locations" option in the sidebar switcher (default selection) — Machines view shows machines from every venue at once with a Location column; Revenue/Expenses/Rent & Commission prompt to select a specific location since those are single-venue-scoped

### Machines
- [x] Machine list view (table) with status filter tabs
- [x] Add machine form
- [x] Edit machine form (inline from list + from detail view)
- [x] Soft delete / archive machine (with confirmation dialog)
- [x] Machine detail view (drill-in from list)
- [x] Maintenance items management (add/edit/delete, interval in days/weeks/months)
- [x] Maintenance log (log entry with date, cost, notes)
- [x] Maintenance dashboard (upcoming dates calculated, OVERDUE/DUE SOON/OK status)
- [x] Auto-create expense from maintenance log cost entry
- [x] Upload Documentation placeholder button

### Revenue
- [x] Machine revenue entry form (machine, collection date, period, coin/bill/card/tap breakdown)
- [x] Machine revenue list/table with totals bar and inline edit/delete
- [x] Non-machine revenue categories management (add/delete, seeded with Tournaments & Merchandising)
- [x] Non-machine revenue entry form (category, date, amount, notes)
- [x] Non-machine revenue list/table with totals bar and inline edit/delete

### Expenses
- [x] Expense categories management (add/delete, 7 defaults pre-seeded)
- [x] Expense entry form (date, category, amount, description, optional machine, optional file URL)
- [x] Expense list/table with category filter, totals bar, category breakdown
- [x] Inline edit/delete with confirmation
- [x] Source badge (wrench icon) for maintenance-log auto-created expenses
- [x] File attachment link indicator on entries that have one
- [x] Auto-create expense from maintenance log cost entry (built in Machines module)

### Rent & Commission
- [x] Agreement configuration form (flat fee / percentage / combination)
- [x] Agreement history view
- [ ] Apply active agreement to gross revenue for net revenue calculation (Dashboard)

### Liabilities
- [x] Loan entry form (with live payment preview)
- [x] Loan list view (cards with progress bar)
- [x] Per-loan amortization calculation (remaining balance, total paid)
- [x] Loan detail view (inline on card — paid off / active status, full term breakdown)

### Reports
- [x] Machine revenue CSV export
- [x] Non-machine revenue CSV export
- [x] Expenses CSV export
- [x] Maintenance log CSV export
- [x] Loan summary CSV export
- [x] Full P&L CSV export
- [x] Date range filter on all exports (presets: This Month, Last Month, Last 3 Months, This Year, All Time, Custom)

### Dropbox
- [x] File upload to Supabase Storage (bucket: "documents" — must be created in Supabase dashboard)
- [x] File list/gallery view (table with name, machine, date, size)
- [x] File download / open link (signed URL, 1-hour expiry)
- [x] Associate file with machine record (optional machine dropdown on upload)

### Desktop Packaging (Electron)
- [x] `electron/main.cjs` main process — loads the live dev server in dev (`ELECTRON_START_URL`) or the built `dist/index.html` in production
- [x] `pnpm electron:dev` — run the desktop shell against the running `pnpm dev` server
- [x] `pnpm electron:build` — builds the app and packages a Windows NSIS installer via electron-builder into `release/`
- [x] Confirmed working end-to-end: installed the built `Setup.exe` and launched the standalone app (no dev server), loaded correctly and connected to Supabase
- [x] Since the app already uses a cloud-hosted Supabase project, installing this on multiple laptops means they all share the same live data automatically — no additional sync work needed

## Bugs

- [x] Sidebar location switcher defaulted to whichever location sorted first alphabetically, not necessarily the one with existing machines/data — made machines appear "missing" when a new location alphabetically preceded the venue holding the data. Fixed by defaulting the switcher to a new "All Locations" option instead of the first location.
- [x] `pnpm electron:build` failed every time with `EPERM: operation not permitted, rename ... win-unpacked.tmp -> win-unpacked` on this Windows machine (electron-builder's default flow downloads Electron, extracts it to a temp folder, then renames it into place — the rename step was reliably blocked). A Windows Defender exclusion and disabling Controlled Folder Access did **not** fix it, so the root cause is still unconfirmed (something else on this machine intercepts directory renames of freshly-written folders containing `.exe`/`.dll` files). Worked around by setting `"electronDist": "node_modules/electron/dist"` in the `build` config in `package.json`, which makes electron-builder copy the already-installed local Electron distribution directly into the output folder instead of downloading/extracting/renaming its own copy. If this machine's actual root cause is ever identified, the `electronDist` override can be removed.

## Open Questions

- [ ] Locations feature added `address`, `main_contact`, `contact_email`, `phone_number` columns to the `locations` table in `supabase/schema.sql`. The live Supabase project already has a `locations` table from before — run this once in the Supabase SQL editor to add the new columns:
  ```sql
  alter table locations
    add column if not exists address text,
    add column if not exists main_contact text,
    add column if not exists contact_email text,
    add column if not exists phone_number text;
  ```
