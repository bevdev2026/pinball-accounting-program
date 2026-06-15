## Design Source of Truth

The /design folder contains the exported Figma source files for this project. These files define the canonical UI — all components, layout, spacing, color, and typography must match them exactly unless explicitly told otherwise.

- Do not invent UI patterns that are not present in the design files.
- When building any new component, read the relevant design file first.
- If a design file and a verbal instruction conflict, ask before proceeding.

## Tech Stack

- **UI Framework:** React 18 + Vite (SPA, no Next.js)
- **Routing:** React Router v7
- **Styling:** Tailwind CSS + tailwind-merge + tw-animate-css
- **Component Libraries:** shadcn/ui (Radix UI) AND MUI v7 are both present.
  DEFAULT to shadcn/ui for all new components unless I specify MUI.
  Never mix both libraries in the same component.
- **Icons:** lucide-react only. Do not import from MUI icons unless asked.
- **Animation:** Motion (Framer Motion v12)
- **Charts:** Recharts
- **Forms:** react-hook-form
- **Drag & Drop:** react-dnd + react-dnd-html5-backend
- **Backend/DB:** Supabase (@supabase/supabase-js)
- **Theme:** next-themes (already configured — do not reinstall or reconfigure)
- **Package Manager:** pnpm — never use npm or yarn
- **Version Control:** Git / GitHub
  - The project repository is hosted on GitHub.
  - All work is committed to this repository.
  - Remind me to commit after each confirmed feature.

Do not introduce any library, framework, or dependency that is not already present in the project unless I explicitly approve it first.

## Build Discipline

- One feature at a time. Build only what is asked for in the current session. Do not move forward until the current feature is tested and confirmed working.
- No unsolicited refactors. Never refactor, restructure, or "improve" existing code unless I explicitly ask for it.
- Plan before you build. Always present a plan and wait for my approval before making changes. Use Plan Mode (Shift+Tab) for every implementation task.
- Commit checkpoint. Remind me to commit after each feature is confirmed working before starting the next one.
- Minimal scope. Only touch files directly relevant to the current task. State which files you intend to modify before you begin.

## Before Every Session

1. Re-read this file.
2. Re-read the project overview section above (the full feature spec).
3. Confirm your understanding of the current task before writing any code.

## TODO List Management

Maintain a `TODO.md` file in the project root. This is the running record of all work — past, present, and planned. It must be kept current at all times.

The file shall have three sections:

- **Tasks** — Features, implementation steps, and planned work.
- **Bugs** — Known issues, broken behavior, and regressions.
- **Open Questions** — Anything unresolved that requires my input before proceeding.

Rules:

- Use checkboxes (`- [ ]` for open, `- [x]` for done) so progress is scannable at a glance.
- Never remove completed items. Mark them done so there is a running history of all work.
- After each session, update `TODO.md` to reflect what was completed, what is next, and anything unresolved.
- When a new task is assigned, add it to the list before starting work.
- When a bug is discovered during development, log it immediately even if it is not the current task.

# Pinball Accounting Application

This application is designed for pinball machine operators. It tracks machines, revenue, expenses, liabilities, and maintenance. All data across all sections is interconnected. Build the data model with these cross-module relationships in mind from the start.

## Deployment Context

Version 1 of this application is a local desktop application. It is not cloud-hosted and is not accessible via a public URL. It runs on a single local machine. All data is stored locally or via a locally-configured Supabase instance.

Because this is a local desktop app in Version 1, authentication requirements are minimal. A simple single-user login (username and password) is sufficient to protect access to the application. Multi-user access and role-based permissions are not required in this version. Supabase Auth may be used for this purpose if it fits the local setup, but the implementation should remain simple and appropriate for a single-user local environment.

---

# Application Specification

This is Version 1. Unless otherwise noted, all data entry is manual. There are no recurring or scheduled transactions in this version. This version assumes a single venue.

Although Version 1 supports only a single venue, multiple locations will be added in a future version. The data model must be built with this in mind from the start. Machines, revenue, expenses, and rent & commission agreements should all be structured so that a location layer can be added later without requiring a significant rebuild. Where appropriate, associate records with a venue/location ID even if only one exists in Version 1.

---

## Version 1 Boundaries

The following features are explicitly out of scope for Version 1. They are planned for future versions. Claude must not build any of these features now, but should ensure the data model and architecture do not preclude them from being added later.

- **CSV Import:** Machine revenue will be entered manually in Version 1. CSV import is a future feature. The data model must support it.
- **Depreciation:** Machine depreciation calculations are a future feature. The required data (Purchase Price, Date Acquired) is captured in Version 1.
- **Multiple Locations:** Version 1 assumes a single venue. Multi-location support is a future feature. The data model must include a location/venue ID from the start.
- **Recurring & Scheduled Transactions:** All entries are manual in Version 1. No automated or scheduled transactions of any kind.
- **Multi-User Access & Roles:** Version 1 is single-user only. Role-based permissions and multi-user support are future features.
- **Cloud Deployment:** Version 1 runs as a local desktop application only. Cloud hosting and public URL access are future features.
- **Machine Depreciation Tracking:** Planned for a future version once the depreciation methodology is decided.

---

## Application Structure & Navigation

The application shall have a persistent sidebar or top-level navigation with the following sections in this order:

1. Dashboard
2. Machines
3. Revenue
4. Expenses
5. Rent & Commission
6. Liabilities
7. Reports
8. Dropbox

These are the only top-level navigation items. All other views (e.g., individual machine detail, maintenance log, loan detail) are accessed by drilling into a record within one of these sections — they do not appear as separate top-level navigation items.

---

## Dashboard

The Dashboard is the home screen of the application. It provides the user with a real-time snapshot of the entire business at a glance. All data displayed on the Dashboard is drawn from the other modules — no separate data entry is required.

### Summary Metrics

The Dashboard shall display the following summary figures, shown for both the current month and year to date:

- Total Gross Revenue (machine + non-machine)
- Net Revenue (after Rent & Commission deduction)
- Total Expenses
- Net Profit (Net Revenue minus Total Expenses)

### Loans

The Dashboard shall display a summary of all active loans including:

- Current remaining balance per loan
- Total amount paid to date across all loans

### Maintenance Alerts

The Dashboard shall display a list of any machines with overdue or upcoming maintenance items, so the user can see at a glance what needs attention without navigating to individual machine records.

### Revenue & Expenses Visualization

The Dashboard shall include time-series charts for:

- Gross Revenue over time (by collection period)
- Expenses over time (by date)
- Net Profit over time

Charts must be filterable by time range (e.g., last 30 days, last 3 months, year to date, custom range). Revenue charts should support breakdown by payment type (coin, bill, card, phone tap) and by machine, enabling the user to identify trends such as seasonal spikes, day-of-week patterns, or shifts in payment method usage over time.

---

## Machine Tracking

Each machine record shall include the following fields:

- Machine Name
- Purchase Price
- Date Acquired
- Status (Active, Out of Service, Retired)

These fields are foundational. Date Acquired and Purchase Price will be used by other modules (e.g., depreciation calculations). Build the data model with this cross-module use in mind.

Machine Status is used throughout the application to filter views. Revenue entry, maintenance reminders, and dashboard displays should reflect only Active machines by default. Out of Service and Retired machines retain their full history but are excluded from active workflows unless explicitly included.

### Machine Deletion & Archiving

Machines are never permanently deleted from the application. When a user deletes a machine, it is soft-deleted — meaning it is flagged as archived in the database and removed from all active views, but all associated data (revenue, expenses, maintenance logs) is fully preserved.

Archived machines shall be stored in Supabase and must remain queryable for historical reporting and export purposes. The user should have a way to view archived machines separately if needed.

This protects the integrity of all financial and maintenance records linked to that machine.

Archived machines must not appear as selectable options when creating new revenue entries, expense entries, or maintenance log entries. Only machines with a Status of Active or Out of Service should be available for new entries.

As an additional safeguard, if the application ever detects an attempt to post a new entry against an archived machine — regardless of how it occurs — it must block the action and display a clear alert to the user explaining that the machine is no longer active and the entry cannot be saved.

### Documentation Upload

Each machine record shall include an "Upload Documentation" button. This is a placeholder for a future Supabase file storage integration. Do not build the upload functionality now — only the button UI element.

---

## Machine Maintenance & Repair

Each machine shall include a maintenance and repair log and a connected maintenance schedule dashboard.

### Maintenance List

The user defines and manages their own list of maintenance items. There are no presets. Each item includes:

- Maintenance item name (e.g., Rubber Replacement)
- Reminder interval (e.g., every 3 months, every 6 months)

The user may add new items and edit existing items including their intervals at any time.

### Maintenance Log

Each time maintenance or a repair is performed it is logged against the specific machine and includes:

- Maintenance item performed
- Date performed
- Cost (optional)
- Any additional notes

If a Cost is entered, the application shall automatically create a corresponding entry in the Expenses section under the Maintenance & Repair category. The user should not have to enter the cost twice. The auto-created expense entry should reference the machine name and maintenance item so the source is traceable. The user may edit or delete the expense entry independently after it is created.

### Maintenance Dashboard

Each machine shall have a maintenance dashboard displaying:

- Past maintenance and repair history
- Upcoming and suggested maintenance dates

Upcoming dates are calculated by the application based on the last logged date for each maintenance item combined with the user defined interval for that item.

---

## Revenue

### Machine Revenue

Each machine tracks revenue broken down by the following payment types:

- Coin
- Bill Drop
- Card
- Phone Tap (NFC/contactless)

### Revenue Entry

In Version 1, machine revenue is entered manually by the user. Each entry must include:

- Machine (selected from active machines)
- Collection Date (the date the collection was made)
- Collection Period (the date range the revenue covers, e.g., June 1–June 15)
- Amount per payment type (Coin, Bill Drop, Card, Phone Tap)

Both Collection Date and Collection Period are required. They are essential for time-based reporting and trend analysis.

All revenue data must be queryable and chartable by date. The application should support time-series views that allow the user to identify patterns such as:

- Seasonal revenue spikes (e.g., holiday periods)
- Day-of-week or end-of-month payment type trends (e.g., higher card usage at month end)
- Performance comparisons across machines over the same period

### CSV Import (Planned — Not Part of Version 1)

CSV import of machine revenue is planned for a future version. Each machine has a built-in cloud export mechanism that produces a CSV broken down by payment type (coin, bill, card, phone tap).

When building the data model, ensure it supports this future import by including a unique identifier per revenue entry composed of the Machine ID and the Collection Timestamp. This combination must be unique and will be used during import to detect duplicates — preventing the same collection from being recorded twice while also ensuring that identical timestamps from different machines are never confused with one another.

Do not build the CSV import functionality now. Only ensure the data model supports it.

### Export

Revenue data must be exportable from the application as CSV for use in external programs. See the Reports & Export section.

### Non-Machine Revenue

The application must support additional revenue categories beyond machine collections. Known categories at launch:

- Tournaments
- Merchandising

This list is not fixed. The user must be able to add new revenue categories at any time. This must be built as an open and flexible system — not a hardcoded list.

Each non-machine revenue entry shall include the following fields:

- Date
- Category (selected from the user-defined category list)
- Amount
- Description / Notes

This structure is intentionally identical to expense entries for consistency across the application.

### Revenue Calculation Note

All revenue figures — machine and non-machine — feed into gross revenue. Rent & Commission is deducted from this figure as contra revenue per the Rent & Commission section.

---

## Expenses

Expense entries are made manually by the user. There are no recurring or scheduled expenses in this version.

Each expense entry shall include the following fields:

- Date
- Category (selected from the expense category list)
- Amount
- Description / Notes
- Machine Association (optional — links the expense to a specific machine)
- File Attachment (optional — links to a file in Supabase Storage, e.g., a receipt, invoice, or utility bill)

The Machine Association field is optional because some expenses are business-wide (e.g., Legal Costs, Office Equipment) while others are machine-specific (e.g., a replacement part). When a machine is associated, the expense should be visible from that machine's record, enabling a true cost-per-machine view over time. This also supports future reporting on which machines are most costly to operate.

Note: Expenses auto-created from the Maintenance Log will have their Machine Association and Category pre-filled automatically.

The Maintenance & Repair category is also available for direct manual expense entry. Not every repair or parts purchase will originate from a maintenance log entry. A user may create a Maintenance & Repair expense directly with just a Date, Amount, and Description — no maintenance log entry or machine association is required.

Expense categories include:

- Utilities
- Legal Costs
- Maintenance & Repair
- Consumables
- Travel & Food
- Office Equipment
- Payments & Capital Expenditures

This list is not fixed. The user must be able to add new expense categories at any time.

Note: Rent & Commission is handled in its own separate section and is NOT included here.

---

## Rent & Commission

Rent & Commission is treated as contra revenue. It is deducted from gross revenue at the top line and is never grouped with operating expenses. Gross revenue figures displayed throughout the application must always reflect this deduction.

This version assumes a single venue. The agreement structure for that venue must support the following arrangements:

- Flat fee
- Percentage of gross revenue
- A combination of both, including a revenue threshold after which the percentage applies

The user configures their agreement structure and may update it at any time as terms change. There is only one active agreement at a time (single venue). Any changes to the agreement apply to revenue going forward only — they do not retroactively affect previously recorded collections. The application must retain a history of past agreement configurations so that historical revenue calculations remain accurate.

---

## Liabilities

Liabilities tracks startup loans. Multiple loans are supported, each with its own independent structure.

Each loan record shall include:

- Loan Name or Description
- Principal Amount
- Interest Rate (annual percentage)
- Compounding Interval (daily, weekly, or monthly)
- Loan Term (total duration, e.g., 36 months, 5 years)
- Payment Frequency (weekly, bi-weekly, or monthly)

Unlike other sections, payment amounts are NOT manually entered. The application calculates them based on the loan structure. This is the only section in Version 1 where the application performs automated calculation rather than accepting manual input.

Behind the scenes, the application should generate a full amortization schedule to power these calculations. This schedule does not need to be visible to the user. What the user sees is:

- Current amount owed
- Total amount paid to date
- Current remaining balance

Each loan is calculated and displayed independently.

---

## Depreciation (Planned — Not Part of Version 1)

Depreciation tracking will be added in a future version. It will calculate the declining value of each machine over time.

The data it requires — Purchase Price and Date Acquired — is already captured in the Machine Tracking section. When building Machine Tracking, ensure these fields remain accessible for future depreciation calculations.

Do not build this feature now. Only ensure the data model supports it.

---

## Reports & Export

All data in the application must be exportable as CSV. This applies universally across every module — not just machine revenue. The user must be able to export any of the following at any time:

- Machine revenue (by machine, by payment type, by date range)
- Non-machine revenue (by category, by date range)
- Expenses (by category, by machine, by date range)
- Maintenance log (by machine, by date range)
- Loan summaries (current balances, payment history)
- Full P&L summary (gross revenue, net revenue, total expenses, net profit)

All exports should support filtering by date range before exporting so the user can produce period-specific reports (e.g., monthly, quarterly, annual) suitable for use by a bookkeeper or accountant.

---

## File Storage (Dropbox)

The application shall include a Supabase Storage Bucket for general file storage. This is referred to throughout the application as the "Dropbox."

Supported file types include but are not limited to:

- PDF
- Word documents (.doc, .docx)
- Images (e.g., receipts, photos)
- Any other general document type

The application does NOT parse or read the contents of these files. It stores them and provides the user with a link to access them.

Files may be associated with specific records — for example, a machine contract or operating manual linked to a machine record via the Upload Documentation button established in the Machine Tracking section.

Files may also be stored generally, without being tied to a specific record.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
