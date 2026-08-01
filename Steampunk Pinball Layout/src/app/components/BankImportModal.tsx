import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { Upload, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ExpenseCategory } from './expenses/types'
import type { RevenueCategory } from './revenue/types'
import type { Location } from './locations/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'

interface Props {
  expenseCategories: ExpenseCategory[]
  revenueCategories: RevenueCategory[]
  locations: Location[]
  onSaved: () => void
  onClose: () => void
}

type RowType = 'expense' | 'deposit'

type ParsedRow = {
  key: string
  type: RowType
  include: boolean
  date: string
  description: string
  amount: string
  categoryId: string
  isDuplicate: boolean
  reviewReason: string | null
}

type Summary = { expenses: number; deposits: number; pending: number; unparseable: number; duplicates: number }

const REVIEW_KEYWORDS = ['TRANSFER', 'REFUND', 'REVERSAL', 'CREDIT']

function reviewReasonFor(description: string): string | null {
  const upper = description.toUpperCase()
  const hit = REVIEW_KEYWORDS.find(kw => upper.includes(kw))
  return hit ?? null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--copper-dark)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-muted)',
}

const colHeader: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '10px',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
  padding: '8px',
}

function keyFor(date: string, description: string, amount: number) {
  return `${date}|${description.trim().toLowerCase()}|${amount.toFixed(2)}`
}

function findField(fields: string[], name: string) {
  return fields.find(f => f.trim().toLowerCase() === name.toLowerCase())
}

export function BankImportModal({ expenseCategories, revenueCategories, locations, onSaved, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [locationId, setLocationId] = useState(locations.length === 1 ? locations[0].id : '')
  const [fileName, setFileName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setParsing(true)
    setRows([])
    setSummary(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const fields = results.meta.fields ?? []
        if (!fields.includes('Transaction Date') || !fields.includes('Transaction Description') || !fields.includes('Amount')) {
          toast.error('This doesn\'t look like a supported bank export. Expected columns: Transaction Date, Transaction Description, Amount.')
          setParsing(false)
          return
        }

        const statusField = findField(fields, 'Status') ?? findField(fields, 'Type')

        let pending = 0
        let unparseable = 0
        const expenseCandidates: { date: string; description: string; amount: number }[] = []
        const depositCandidates: { date: string; description: string; amount: number }[] = []

        for (const raw of results.data) {
          const rawDate = (raw['Transaction Date'] ?? '').trim()
          const rawDesc = (raw['Transaction Description'] ?? '').trim()
          const rawAmount = (raw['Amount'] ?? '').trim()
          const rawBalance = (raw['Balance'] ?? '').trim()
          const rawStatus = statusField ? (raw[statusField] ?? '').trim() : ''
          if (!rawDate && !rawDesc && !rawAmount) continue

          const isPending = rawStatus.toUpperCase().includes('PENDING')
            || rawDate.toUpperCase().startsWith('PENDING')
            || rawBalance.toUpperCase() === 'PENDING'
          if (isPending) { pending++; continue }

          const isDeposit = rawAmount.startsWith('+')
          const isExpense = rawAmount.startsWith('-')
          if (!isDeposit && !isExpense) { unparseable++; continue }

          const numeric = parseFloat(rawAmount.replace(/[^0-9.]/g, ''))
          if (isNaN(numeric) || numeric <= 0) { unparseable++; continue }

          if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) { unparseable++; continue }

          const candidate = { date: rawDate, description: rawDesc, amount: numeric }
          if (isDeposit) depositCandidates.push(candidate)
          else expenseCandidates.push(candidate)
        }

        if (expenseCandidates.length === 0 && depositCandidates.length === 0) {
          setSummary({ expenses: 0, deposits: 0, pending, unparseable, duplicates: 0 })
          setParsing(false)
          return
        }

        const allCandidates = [...expenseCandidates, ...depositCandidates]
        const minDate = allCandidates.reduce((m, c) => (c.date < m ? c.date : m), allCandidates[0].date)
        const maxDate = allCandidates.reduce((m, c) => (c.date > m ? c.date : m), allCandidates[0].date)

        const [existingExpenses, existingDeposits] = await Promise.all([
          supabase.from('expenses').select('date, description, amount').gte('date', minDate).lte('date', maxDate),
          supabase.from('non_machine_revenue').select('date, notes, amount').gte('date', minDate).lte('date', maxDate),
        ])

        // existingCounts: how many times each (date, description, amount) key already
        // exists in the DB. batchCounts: how many times we've seen that key so far while
        // walking this file. A row is only a duplicate once the batch count exceeds what
        // already exists — repeats that go beyond that are new, distinct transactions
        // that just happen to look alike (e.g. several identical vending collections).
        const existingExpenseCounts = new Map<string, number>()
        for (const e of existingExpenses.data ?? []) {
          const k = keyFor(e.date, e.description ?? '', e.amount)
          existingExpenseCounts.set(k, (existingExpenseCounts.get(k) ?? 0) + 1)
        }
        const existingDepositCounts = new Map<string, number>()
        for (const d of existingDeposits.data ?? []) {
          const k = keyFor(d.date, d.notes ?? '', d.amount)
          existingDepositCounts.set(k, (existingDepositCounts.get(k) ?? 0) + 1)
        }

        let duplicates = 0
        let keyCounter = 0
        const batchExpenseCounts = new Map<string, number>()
        const batchDepositCounts = new Map<string, number>()

        const built: ParsedRow[] = []
        for (const c of expenseCandidates) {
          const k = keyFor(c.date, c.description, c.amount)
          const seenSoFar = (batchExpenseCounts.get(k) ?? 0) + 1
          batchExpenseCounts.set(k, seenSoFar)
          const isDuplicate = seenSoFar <= (existingExpenseCounts.get(k) ?? 0)
          if (isDuplicate) duplicates++
          built.push({
            key: String(keyCounter++),
            type: 'expense',
            include: !isDuplicate,
            date: c.date,
            description: c.description,
            amount: c.amount.toFixed(2),
            categoryId: '',
            isDuplicate,
            reviewReason: null,
          })
        }
        for (const c of depositCandidates) {
          const k = keyFor(c.date, c.description, c.amount)
          const seenSoFar = (batchDepositCounts.get(k) ?? 0) + 1
          batchDepositCounts.set(k, seenSoFar)
          const isDuplicate = seenSoFar <= (existingDepositCounts.get(k) ?? 0)
          if (isDuplicate) duplicates++
          built.push({
            key: String(keyCounter++),
            type: 'deposit',
            include: !isDuplicate,
            date: c.date,
            description: c.description,
            amount: c.amount.toFixed(2),
            categoryId: '',
            isDuplicate,
            reviewReason: reviewReasonFor(c.description),
          })
        }

        setRows(built)
        setSummary({ expenses: expenseCandidates.length, deposits: depositCandidates.length, pending, unparseable, duplicates })
        setParsing(false)
      },
      error: () => {
        toast.error('Failed to read the file.')
        setParsing(false)
      },
    })
  }

  function updateRow(key: string, patch: Partial<ParsedRow>) {
    setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows(rs => rs.filter(r => r.key !== key))
  }

  async function handleSave() {
    const included = rows.filter(r => r.include)
    if (included.length === 0) { toast.error('No rows selected to import.'); return }
    if (included.some(r => !r.categoryId)) { toast.error('Select a category for every included row.'); return }
    if (included.some(r => !r.date || !r.description.trim() || !r.amount || isNaN(parseFloat(r.amount)) || parseFloat(r.amount) <= 0)) {
      toast.error('Every included row needs a valid date, description, and amount.')
      return
    }

    setSaving(true)

    const expenseRows = included.filter(r => r.type === 'expense')
    const depositRows = included.filter(r => r.type === 'deposit')

    if (expenseRows.length > 0) {
      const payload = expenseRows.map(r => ({
        location_id: locationId || null,
        date: r.date,
        category_id: r.categoryId,
        amount: parseFloat(r.amount),
        description: r.description.trim(),
        machine_id: null,
        file_url: null,
        source: 'bank_import' as const,
      }))
      const { error } = await supabase.from('expenses').insert(payload)
      if (error) {
        console.error('Failed to import expenses:', error)
        toast.error(`Failed to import expenses: ${error.message}`)
        setSaving(false)
        return
      }
    }

    if (depositRows.length > 0) {
      const payload = depositRows.map(r => ({
        location_id: locationId || null,
        date: r.date,
        category_id: r.categoryId,
        amount: parseFloat(r.amount),
        notes: r.description.trim(),
        source: 'bank_import' as const,
      }))
      const { error } = await supabase.from('non_machine_revenue').insert(payload)
      if (error) {
        console.error('Failed to import deposits:', error)
        toast.error(`Failed to import deposits: ${error.message}`)
        setSaving(false)
        return
      }
    }

    const parts: string[] = []
    if (expenseRows.length > 0) parts.push(`${expenseRows.length} expense${expenseRows.length === 1 ? '' : 's'}`)
    if (depositRows.length > 0) parts.push(`${depositRows.length} deposit${depositRows.length === 1 ? '' : 's'}`)
    toast.success(`Imported ${parts.join(' and ')}.`)
    onSaved()
    onClose()
  }

  const includedCount = rows.filter(r => r.include).length

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)', maxWidth: '1200px', width: '95vw' }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            IMPORT BANK TRANSACTIONS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label style={labelStyle}>Location</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={locationId} onChange={e => setLocationId(e.target.value)}>
              <option value="">— Business-Wide (All Locations) —</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>CSV File</label>
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ ...inputStyle, width: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}
              >
                <Upload size={14} />
                Choose File
              </button>
              {fileName && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)' }}>{fileName}</span>
              )}
            </div>
          </div>

          {parsing && (
            <div className="p-6 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.1em' }}>
              PARSING…
            </div>
          )}

          {!parsing && summary && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
              {summary.expenses} expense{summary.expenses === 1 ? '' : 's'} and {summary.deposits} deposit{summary.deposits === 1 ? '' : 's'} found
              {summary.pending > 0 && `, ${summary.pending} pending skipped`}
              {summary.unparseable > 0 && `, ${summary.unparseable} unreadable row${summary.unparseable === 1 ? '' : 's'} skipped`}
              {summary.duplicates > 0 && `, ${summary.duplicates} possible duplicate${summary.duplicates === 1 ? '' : 's'} flagged`}
              .
            </div>
          )}

          {!parsing && rows.length > 0 && (
            <div style={{ border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div className="grid" style={{ gridTemplateColumns: '28px 64px 110px 1fr 90px 160px 32px', borderBottom: '1px solid var(--copper-dark)' }}>
                <div style={colHeader} />
                <div style={colHeader}>TYPE</div>
                <div style={colHeader}>DATE</div>
                <div style={colHeader}>DESCRIPTION</div>
                <div style={colHeader}>AMOUNT</div>
                <div style={colHeader}>CATEGORY *</div>
                <div style={colHeader} />
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {rows.map((row, i) => {
                  const categoryOptions = row.type === 'expense' ? expenseCategories : revenueCategories
                  return (
                    <div
                      key={row.key}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: '28px 64px 110px 1fr 90px 160px 32px',
                        borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(107,46,18,0.25)',
                        backgroundColor: row.isDuplicate ? 'rgba(107,46,18,0.12)' : 'transparent',
                      }}
                    >
                      <div style={{ padding: '8px' }}>
                        <input type="checkbox" checked={row.include} onChange={e => updateRow(row.key, { include: e.target.checked })} />
                      </div>
                      <div style={{ padding: '4px 8px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '9px',
                            letterSpacing: '0.08em',
                            padding: '3px 6px',
                            borderRadius: 'var(--radius-sm)',
                            color: row.type === 'deposit' ? 'var(--patina-base)' : 'var(--steel-light)',
                            border: `1px solid ${row.type === 'deposit' ? 'var(--patina-base)' : 'var(--steel-light)'}`,
                          }}
                        >
                          {row.type === 'deposit' ? 'DEPOSIT' : 'EXPENSE'}
                        </span>
                      </div>
                      <div style={{ padding: '4px 8px' }}>
                        <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={row.date} onChange={e => updateRow(row.key, { date: e.target.value })} />
                      </div>
                      <div style={{ padding: '4px 8px' }}>
                        <input style={inputStyle} value={row.description} onChange={e => updateRow(row.key, { description: e.target.value })} />
                        {row.isDuplicate && (
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--destructive)', marginTop: '3px' }}>
                            POSSIBLE DUPLICATE
                          </div>
                        )}
                        {row.reviewReason && (
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--gold-base)', marginTop: '3px' }}>
                            REVIEW: {row.reviewReason}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '4px 8px' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                          value={row.amount}
                          onChange={e => updateRow(row.key, { amount: e.target.value })}
                        />
                      </div>
                      <div style={{ padding: '4px 8px' }}>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={row.categoryId} onChange={e => updateRow(row.key, { categoryId: e.target.value })}>
                          <option value="">— Select —</option>
                          {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div style={{ padding: '4px 8px', display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => removeRow(row.key)}
                          title="Remove this row from the import"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', opacity: 0.7, padding: '4px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} style={{ color: 'var(--text-muted)' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || includedCount === 0} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
            {saving ? 'Importing…' : `Import ${includedCount || ''} Row${includedCount === 1 ? '' : 's'}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
