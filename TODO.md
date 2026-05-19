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
- [ ] Connect KPI cards to live Supabase data
- [ ] Connect revenue charts to live data
- [ ] Connect maintenance alerts to live data
- [ ] Connect loans summary to live data

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
- [ ] Machine revenue entry form
- [ ] Machine revenue list/table view
- [ ] Non-machine revenue categories management
- [ ] Non-machine revenue entry form
- [ ] Non-machine revenue list/table view

### Expenses
- [ ] Expense categories management
- [ ] Expense entry form (with optional machine link + file attachment field)
- [ ] Expense list/table view
- [ ] Auto-create expense from maintenance log cost entry

### Rent & Commission
- [ ] Agreement configuration form (flat fee / percentage / combination)
- [ ] Agreement history view
- [ ] Apply active agreement to gross revenue for net revenue calculation

### Liabilities
- [ ] Loan entry form
- [ ] Loan list view
- [ ] Per-loan amortization calculation (remaining balance, total paid)
- [ ] Loan detail view

### Reports
- [ ] Machine revenue CSV export
- [ ] Non-machine revenue CSV export
- [ ] Expenses CSV export
- [ ] Maintenance log CSV export
- [ ] Loan summary CSV export
- [ ] Full P&L CSV export
- [ ] Date range filter on all exports

### Dropbox
- [ ] File upload to Supabase Storage
- [ ] File list/gallery view
- [ ] File download / open link
- [ ] Associate file with machine record

## Bugs

*(none yet)*

## Open Questions

*(none currently)*
