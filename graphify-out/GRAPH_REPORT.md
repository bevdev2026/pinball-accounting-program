# Graph Report - .  (2026-06-14)

## Corpus Check
- Corpus is ~44,567 words - fits in a single context window. You may not need a graph.

## Summary
- 784 nodes · 1518 edges · 52 communities (48 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.83)
- Token cost: 472,194 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend Dependency Manifest|Frontend Dependency Manifest]]
- [[_COMMUNITY_Sidebar & Mobile Shell Primitives|Sidebar & Mobile Shell Primitives]]
- [[_COMMUNITY_Machine Management & Maintenance|Machine Management & Maintenance]]
- [[_COMMUNITY_Card, Table & Tabs Primitives|Card, Table & Tabs Primitives]]
- [[_COMMUNITY_LoanRent Form Dialogs|Loan/Rent Form Dialogs]]
- [[_COMMUNITY_Rent & Commission Dashboard Logic|Rent & Commission Dashboard Logic]]
- [[_COMMUNITY_Build Tooling & Scripts Config|Build Tooling & Scripts Config]]
- [[_COMMUNITY_Dashboard Widgets|Dashboard Widgets]]
- [[_COMMUNITY_Machine Revenue & Archival|Machine Revenue & Archival]]
- [[_COMMUNITY_Carousel & Chart Primitives|Carousel & Chart Primitives]]
- [[_COMMUNITY_TypeScript & Vite Build Config|TypeScript & Vite Build Config]]
- [[_COMMUNITY_Loan Amortization Engine|Loan Amortization Engine]]
- [[_COMMUNITY_Non-Machine Revenue & Categories|Non-Machine Revenue & Categories]]
- [[_COMMUNITY_Form Input Primitives|Form Input Primitives]]
- [[_COMMUNITY_Liabilities Module & Loan Export|Liabilities Module & Loan Export]]
- [[_COMMUNITY_Accordion, Alert Dialog & Calendar Primitives|Accordion, Alert Dialog & Calendar Primitives]]
- [[_COMMUNITY_Dropbox & Expense Entry Flow|Dropbox & Expense Entry Flow]]
- [[_COMMUNITY_Expense Management|Expense Management]]
- [[_COMMUNITY_Context Menu Primitive|Context Menu Primitive]]
- [[_COMMUNITY_Menubar Primitive|Menubar Primitive]]
- [[_COMMUNITY_Dropdown Menu Primitive|Dropdown Menu Primitive]]
- [[_COMMUNITY_Form Field & Label Primitives|Form Field & Label Primitives]]
- [[_COMMUNITY_Revenue & Rent SchemaSpec|Revenue & Rent Schema/Spec]]
- [[_COMMUNITY_Select & Radio Group Primitives|Select & Radio Group Primitives]]
- [[_COMMUNITY_App Shell & Routing|App Shell & Routing]]
- [[_COMMUNITY_CSV Export & Maintenance-to-Expense Flow|CSV Export & Maintenance-to-Expense Flow]]
- [[_COMMUNITY_Dropbox & Machine Tracking Spec|Dropbox & Machine Tracking Spec]]
- [[_COMMUNITY_Expenses & Maintenance SchemaSpec|Expenses & Maintenance Schema/Spec]]
- [[_COMMUNITY_Drawer Primitive|Drawer Primitive]]
- [[_COMMUNITY_Navigation Menu Primitive|Navigation Menu Primitive]]
- [[_COMMUNITY_Dashboard Chart & Report Helpers|Dashboard Chart & Report Helpers]]
- [[_COMMUNITY_Dropbox File Storage View|Dropbox File Storage View]]
- [[_COMMUNITY_Pagination Primitive|Pagination Primitive]]
- [[_COMMUNITY_Navigation & Reports Spec Docs|Navigation & Reports Spec Docs]]
- [[_COMMUNITY_Resizable & Scroll Area Primitives|Resizable & Scroll Area Primitives]]
- [[_COMMUNITY_Steampunk Design System & Branding|Steampunk Design System & Branding]]
- [[_COMMUNITY_Input & OTP Primitives|Input & OTP Primitives]]
- [[_COMMUNITY_Toggle Primitives|Toggle Primitives]]
- [[_COMMUNITY_Database Type Enums|Database Type Enums]]
- [[_COMMUNITY_Dashboard Spec & TODOs|Dashboard Spec & TODOs]]
- [[_COMMUNITY_Liabilities Spec & Schema|Liabilities Spec & Schema]]
- [[_COMMUNITY_Alert Primitive|Alert Primitive]]
- [[_COMMUNITY_Tech Stack & Attributions|Tech Stack & Attributions]]
- [[_COMMUNITY_Build Discipline Guidelines|Build Discipline Guidelines]]
- [[_COMMUNITY_Unsplash Attribution|Unsplash Attribution]]
- [[_COMMUNITY_TODO Management Policy|TODO Management Policy]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 225 edges
2. `Button()` - 27 edges
3. `supabase` - 24 edges
4. `DialogContent()` - 17 edges
5. `compilerOptions` - 17 edges
6. `Dialog()` - 16 edges
7. `DialogHeader()` - 16 edges
8. `DialogTitle()` - 16 edges
9. `Database` - 16 edges
10. `Pinball Accounting App Figma Make UI Brief` - 13 edges

## Surprising Connections (you probably didn't know these)
- `machines table` --rationale_for--> `Depreciation (Planned, Not V1)`  [INFERRED]
  supabase/schema.sql → CLAUDE.md
- `formatPeriod()` --semantically_similar_to--> `RentAgreementForm()`  [AMBIGUOUS] [semantically similar]
  Steampunk Pinball Layout/src/app/components/revenue/MachineRevenueTab.tsx → Steampunk Pinball Layout/src/app/components/rent/RentAgreementForm.tsx
- `useIsMobile()` --semantically_similar_to--> `What This App Is NOT (Desktop, Non-Mobile, Data-Dense)`  [INFERRED] [semantically similar]
  Steampunk Pinball Layout/src/app/components/ui/use-mobile.ts → Steampunk Pinball Layout/src/imports/pasted_text/pinball-accounting-brief.md
- `Setup Tasks (Supabase, env, types, schema)` --references--> `supabase`  [EXTRACTED]
  TODO.md → Steampunk Pinball Layout/src/lib/supabase.ts
- `locations table` --rationale_for--> `Version 1 Boundaries (out of scope features)`  [EXTRACTED]
  supabase/schema.sql → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Dashboard KPI & Chart Data Pipeline** — dashboard_fetchkpiandmeta, dashboard_fetchchartdata, dashboard_buildseries, dashboard_computechartdata, dashboard_calcrentdeduction, dashboard_summr, dashboard_sumamt [EXTRACTED 0.95]
- **Loan Amortization Calculation Module** — calcloanstatus_calcpaymentamount, calcloanstatus_calcamortizationschedule, calcloanstatus_calcloanstatus, calcloanstatus_paymentdate, loanform_loanform, liabilitiesview_liabilitiesview, amortizationschedule_amortizationschedule, types_loan [EXTRACTED 0.95]
- **Expense CRUD & Category Management Flow** — expensesview_expensesview, expenseform_expenseform, expensecategorymanager_expensecategorymanager, types_expense, types_expensecategory, expensesview_fetchexpenses, expensesview_fetchcategories [EXTRACTED 0.90]
- **Revenue Entry CRUD Forms (Machine + Non-Machine, Identical Structure by Spec)** — revenue_machinerevenueform_machinerevenueform, revenue_nonmachinerevenueform_nonmachinerevenueform, revenue_categorymanager_categorymanager, revenue_types_revenuecategory [INFERRED 0.85]
- **Machine Maintenance Lifecycle (Item Definition, Logging, Auto-Expense, Dashboard)** — machines_machinedetail_machinedetail, machines_maintenanceitemform_maintenanceitemform, machines_maintenancelogform_maintenancelogform, concept_maintenance_to_expense_autocreation, machines_types_maintenanceitem, machines_types_maintenancelog [EXTRACTED 1.00]
- **Rent & Commission Calculation Logic Duplicated Across Display and Export** — rent_rentview_describeagreement, reports_reportsview_exportpnl, rent_types_agreement, rent_rentagreementform_handlesave [INFERRED 0.85]
- **Shared cn() className-merge utility pattern across primitives** — ui_utils_cn, ui_button_button, ui_card_card, ui_dialog_dialogcontent, ui_dropdown_menu_dropdownmenucontent, ui_carousel_carousel [INFERRED 0.85]
- **Radix Portal + Overlay + Content composition pattern for modal-like surfaces** — ui_dialog_dialogcontent, ui_dialog_dialogoverlay, ui_drawer_drawercontent, ui_drawer_draweroverlay, ui_dropdown_menu_dropdownmenucontent, ui_context_menu_contextmenucontent [INFERRED 0.85]
- **CommandDialog composes Command primitive with Dialog primitives** — ui_command_commanddialog, ui_command_command, ui_dialog_dialog, ui_dialog_dialogcontent, ui_dialog_dialogheader [EXTRACTED 1.00]
- **Sidebar navigation system (context, provider, menu items, and mobile sheet)** — ui_sidebar_sidebarcontext, ui_sidebar_sidebarprovider, ui_sidebar_sidebar, ui_sidebar_sidebarmenubutton, ui_sheet_sheetcontent [INFERRED 0.85]
- **Floating/overlay surface primitives sharing popover-like positioning patterns** — ui_popover_popover, ui_select_select, ui_menubar_menubar, ui_navigation_menu_navigationmenu [INFERRED 0.75]
- **Maintenance Log -> Auto-Created Expense -> Machine Cross-Reference Flow** — schema_maintenance_logs, schema_expenses, schema_machines, claude_md_maintenance_expense_autocreate [INFERRED 0.90]
- **Rent & Commission as Contra-Revenue Across Spec, Schema, and Dashboard** — schema_rent_commission_agreements, claude_md_rent_commission_spec, claude_md_dashboard_spec, todo_rent_commission_pending_dashboard_link [INFERRED 0.85]
- **Steampunk Design Source-of-Truth Assets (Brand Kit, Brief, Favicon)** — design_reference_vuk_brand_kit, pinball_accounting_brief_ui_brief, public_favicon, claude_md_design_source_of_truth [INFERRED 0.80]

## Communities (52 total, 4 thin omitted)

### Community 0 - "Frontend Dependency Manifest"
Cohesion: 0.04
Nodes (57): dependencies, canvas-confetti, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @emotion/react (+49 more)

### Community 1 - "Sidebar & Mobile Shell Primitives"
Cohesion: 0.06
Nodes (41): What This App Is NOT (Desktop, Non-Mobile, Data-Dense), Separator(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+33 more)

### Community 2 - "Machine Management & Maintenance"
Cohesion: 0.09
Nodes (30): cardStyle, fetchAll Function, formatCurrency(), formatDate(), getMaintenanceStatus(), getNextDate(), MachineDetail(), MaintenanceStatus (+22 more)

### Community 3 - "Card, Table & Tabs Primitives"
Cohesion: 0.08
Nodes (35): Avatar(), AvatarFallback(), AvatarImage(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage() (+27 more)

### Community 4 - "Loan/Rent Form Dialogs"
Cohesion: 0.12
Nodes (22): AmortizationSchedule(), colHeader, fmt(), fmtDate(), STATUS_STYLE, formatMoney(), inputStyle, labelStyle (+14 more)

### Community 5 - "Rent & Commission Dashboard Logic"
Cohesion: 0.11
Nodes (24): Maintenance Alert Due/Overdue Calculation, Rent & Commission as Contra Revenue, Agreement interface, buildSeries, calcRentDeduction, computeChartData, fetchChartData, fetchKpiAndMeta (+16 more)

### Community 6 - "Build Tooling & Scripts Config"
Cohesion: 0.08
Nodes (25): devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react, name (+17 more)

### Community 7 - "Dashboard Widgets"
Cohesion: 0.10
Nodes (15): Agreement, ChartPoint, GroupBy, KPICard(), KPICardProps, LoansSummary(), LoanSummaryItem, Props (+7 more)

### Community 8 - "Machine Revenue & Archival"
Cohesion: 0.15
Nodes (19): Machine Soft-Delete / Archival Pattern, supabase, handleArchive Function (soft-delete), AmountField(), MachineRevenueForm handleSave Function, inputStyle, labelStyle, MachineRevenueForm() (+11 more)

### Community 9 - "Carousel & Chart Primitives"
Cohesion: 0.12
Nodes (23): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+15 more)

### Community 10 - "TypeScript & Vite Build Config"
Cohesion: 0.08
Nodes (21): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+13 more)

### Community 11 - "Loan Amortization Engine"
Cohesion: 0.13
Nodes (23): AmortizationSchedule, calcAmortizationSchedule, calcLoanStatus, calcPaymentAmount, paymentDate, ScheduleRow interface, Loan Amortization Schedule (hidden, powers UI), Dashboard (+15 more)

### Community 12 - "Non-Machine Revenue & Categories"
Cohesion: 0.17
Nodes (18): CategoryManager(), CategoryManager handleAdd Function, CategoryManager handleDelete Function, Props, NonMachineRevenueForm handleSave Function, inputStyle, labelStyle, NonMachineRevenueForm() (+10 more)

### Community 13 - "Form Input Primitives"
Cohesion: 0.09
Nodes (9): Badge(), badgeVariants, Checkbox(), HoverCardContent(), PopoverContent(), Progress(), Slider(), Switch() (+1 more)

### Community 14 - "Liabilities Module & Loan Export"
Cohesion: 0.15
Nodes (18): Props, calcAmortizationSchedule(), calcLoanStatus(), calcPaymentAmount(), COMPOUNDING_PER_YEAR, INTERVAL_DAYS, paymentDate(), PAYMENTS_PER_YEAR (+10 more)

### Community 15 - "Accordion, Alert Dialog & Calendar Primitives"
Cohesion: 0.12
Nodes (15): Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+7 more)

### Community 16 - "Dropbox & Expense Entry Flow"
Cohesion: 0.13
Nodes (19): documents storage bucket, DropboxView, fetchFiles (DropboxView), getDownloadUrl, handleDelete (DropboxView), handleUpload, StoredFile interface, ExpenseCategoryManager (+11 more)

### Community 17 - "Expense Management"
Cohesion: 0.26
Nodes (11): ExpenseCategoryManager(), Props, ExpenseForm(), inputStyle, labelStyle, Props, colHeader, ActiveMachine (+3 more)

### Community 18 - "Context Menu Primitive"
Cohesion: 0.12
Nodes (11): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSub() (+3 more)

### Community 19 - "Menubar Primitive"
Cohesion: 0.12
Nodes (10): MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut(), MenubarSubContent() (+2 more)

### Community 20 - "Dropdown Menu Primitive"
Cohesion: 0.13
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSub(), DropdownMenuSubContent() (+1 more)

### Community 21 - "Form Field & Label Primitives"
Cohesion: 0.21
Nodes (12): Form / FormField / useFormField, FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue (+4 more)

### Community 22 - "Revenue & Rent Schema/Spec"
Cohesion: 0.22
Nodes (14): CSV Import (Planned, Not V1), Rent & Commission Spec (Contra Revenue), Revenue Spec (Machine + Non-Machine), Version 1 Boundaries (out of scope features), Database, locations table, machine_revenue table, non_machine_revenue table (+6 more)

### Community 23 - "Select & Radio Group Primitives"
Cohesion: 0.14
Nodes (10): RadioGroup(), RadioGroupItem(), Select(), SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton() (+2 more)

### Community 24 - "App Shell & Routing"
Cohesion: 0.19
Nodes (10): App(), renderView, toggleTheme, Dashboard(), navigationItems, Sidebar(), SidebarProps, ExpensesView() (+2 more)

### Community 25 - "CSV Export & Maintenance-to-Expense Flow"
Cohesion: 0.27
Nodes (12): Universal CSV Export with Date Range Filtering, Maintenance Log Auto-Creates Expense Entry (Spec Requirement), MaintenanceLogForm handleSave Function (auto-creates expense), applyDateFilter Function, buildCsv(), downloadCsv(), exportExpenses Function, exportMachineRevenue Function (+4 more)

### Community 26 - "Dropbox & Machine Tracking Spec"
Cohesion: 0.27
Nodes (11): V1 Local Desktop Deployment Context, File Storage (Dropbox) Spec, Machine Tracking Spec, Machine Maintenance & Repair Spec, Pinball Accounting Application (Spec), files table (Dropbox), Row Level Security allow_all policies, Dropbox Tasks (file upload, list, download, association) (+3 more)

### Community 27 - "Expenses & Maintenance Schema/Spec"
Cohesion: 0.24
Nodes (11): Depreciation (Planned, Not V1), Expenses Spec, Machine Soft-Delete / Archiving Policy, Auto-create Expense from Maintenance Log Cost, expense_categories table, expenses table, machines table, maintenance_items table (+3 more)

### Community 28 - "Drawer Primitive"
Cohesion: 0.20
Nodes (7): Drawer(), DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 29 - "Navigation Menu Primitive"
Cohesion: 0.22
Nodes (10): Menubar(), NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger() (+2 more)

### Community 30 - "Dashboard Chart & Report Helpers"
Cohesion: 0.20
Nodes (6): buildSeries(), pad(), getPresetRange(), inputStyle, Preset, PRESETS

### Community 31 - "Dropbox File Storage View"
Cohesion: 0.22
Nodes (7): colHeader, DropboxView(), formatBytes(), inputStyle, labelStyle, Machine, StoredFile

### Community 32 - "Pagination Primitive"
Cohesion: 0.25
Nodes (7): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 33 - "Navigation & Reports Spec Docs"
Cohesion: 0.25
Nodes (8): Application Navigation Structure (8 sections), Reports & Export Spec, Pinball Accounting App Figma Make UI Brief, Steampunk Pinball Layout README (Figma Make bundle), Reports Tasks (CSV exports + date range filters), Component Patterns (Tables, Modals, Badges, Empty States), Reports Screen Layout (Export Hub), Left Sidebar Navigation (8 items)

### Community 34 - "Resizable & Scroll Area Primitives"
Cohesion: 0.25
Nodes (5): ResizableHandle(), ResizablePanelGroup(), ScrollArea(), ScrollBar(), SidebarInset()

### Community 35 - "Steampunk Design System & Branding"
Cohesion: 0.29
Nodes (7): Design Source of Truth (Figma exports), Steampunk Color Palette (Copper, Gold, Verdigris, Patina, Mahogany), VUK Pinball Parlor Brand Kit (Design Reference), App Favicon (Pinball/Compass-style Emblem Icon), index.html entry document, main.tsx entry point, Dark Industrial Steampunk Visual Direction

### Community 36 - "Input & OTP Primitives"
Cohesion: 0.29
Nodes (4): Input(), InputOTP(), InputOTPGroup(), InputOTPSlot()

### Community 37 - "Toggle Primitives"
Cohesion: 0.57
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 38 - "Database Type Enums"
Cohesion: 0.33
Nodes (5): CompoundingInterval, ExpenseSource, MachineStatus, PaymentFrequency, RentCommissionType

### Community 39 - "Dashboard Spec & TODOs"
Cohesion: 0.40
Nodes (5): Dashboard Spec, Dashboard Tasks (KPI cards, charts, alerts, loans), Pending: Apply Agreement to Gross Revenue for Net Revenue (Dashboard), Rent & Commission Tasks (agreement config, history), Dashboard Screen Layout

### Community 40 - "Liabilities Spec & Schema"
Cohesion: 0.50
Nodes (5): Liabilities / Loans Spec, loans table, set_updated_at trigger function, Liabilities Tasks (loan forms, amortization, detail), Liabilities Screen Layout (Loan List + Detail)

### Community 41 - "Alert Primitive"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

## Ambiguous Edges - Review These
- `RentAgreementForm()` → `formatPeriod()`  [AMBIGUOUS]
  Steampunk Pinball Layout/src/app/components/revenue/MachineRevenueTab.tsx · relation: semantically_similar_to
- `Build Discipline (one feature at a time, plan before build)` → `Guidelines.md (empty template)`  [AMBIGUOUS]
  Steampunk Pinball Layout/guidelines/Guidelines.md · relation: conceptually_related_to

## Knowledge Gaps
- **209 isolated node(s):** `name`, `private`, `version`, `type`, `build` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `RentAgreementForm()` and `formatPeriod()`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Build Discipline (one feature at a time, plan before build)` and `Guidelines.md (empty template)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `Card, Table & Tabs Primitives` to `Sidebar & Mobile Shell Primitives`, `Machine Management & Maintenance`, `Loan/Rent Form Dialogs`, `Carousel & Chart Primitives`, `Form Input Primitives`, `Accordion, Alert Dialog & Calendar Primitives`, `Expense Management`, `Context Menu Primitive`, `Menubar Primitive`, `Dropdown Menu Primitive`, `Form Field & Label Primitives`, `Select & Radio Group Primitives`, `Drawer Primitive`, `Navigation Menu Primitive`, `Pagination Primitive`, `Resizable & Scroll Area Primitives`, `Input & OTP Primitives`, `Toggle Primitives`, `Alert Primitive`?**
  _High betweenness centrality (0.382) - this node is a cross-community bridge._
- **Why does `Button()` connect `Expense Management` to `Pagination Primitive`, `Sidebar & Mobile Shell Primitives`, `Machine Management & Maintenance`, `Card, Table & Tabs Primitives`, `Loan/Rent Form Dialogs`, `Rent & Commission Dashboard Logic`, `Machine Revenue & Archival`, `Carousel & Chart Primitives`, `Non-Machine Revenue & Categories`, `Liabilities Module & Loan Export`, `Accordion, Alert Dialog & Calendar Primitives`, `Dashboard Chart & Report Helpers`, `Dropbox File Storage View`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `Database` connect `Revenue & Rent Schema/Spec` to `Database Type Enums`, `Liabilities Spec & Schema`, `Machine Revenue & Archival`, `Dropbox & Machine Tracking Spec`, `Expenses & Maintenance Schema/Spec`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _214 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Dependency Manifest` be split into smaller, more focused modules?**
  _Cohesion score 0.03508771929824561 - nodes in this community are weakly interconnected._