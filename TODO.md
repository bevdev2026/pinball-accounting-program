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

## Bugs

*(none yet)*

## Open Questions

*(none currently)*
