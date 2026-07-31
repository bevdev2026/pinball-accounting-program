import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Settings, Wrench, Paperclip, Landmark } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseCategory, ActiveMachine } from './types'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseCategoryManager } from './ExpenseCategoryManager'
import { Button } from '../ui/button'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

const colHeader: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: 'var(--text-muted)',
  padding: '10px 12px',
}

export function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [machines, setMachines] = useState<ActiveMachine[]>([])
  const [loading, setLoading] = useState(true)

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [showCatManager, setShowCatManager] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('expense_categories').select('*').order('name')
    if (data) setCategories(data)
  }, [])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*, expense_categories(name), machines(name), locations(name)')
      .order('date', { ascending: false })
    if (data) setExpenses(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const { data: m } = await supabase
        .from('machines')
        .select('id, name, status')
        .eq('is_archived', false)
        .neq('status', 'Retired')
        .order('name')
      if (m) setMachines(m)
    }
    init()
    fetchCategories()
    fetchExpenses()
  }, [fetchCategories, fetchExpenses])

  async function handleDelete(id: string) {
    setDeleting(true)
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { toast.error('Failed to delete expense.') } else { toast.success('Expense deleted.'); fetchExpenses() }
    setConfirmDelete(null)
    setDeleting(false)
  }

  const filtered = categoryFilter === 'all'
    ? expenses
    : expenses.filter(e => e.category_id === categoryFilter)

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  // Category breakdown for totals bar (top 4 by amount)
  const byCategory = categories
    .map(cat => ({
      name: cat.name,
      total: filtered.filter(e => e.category_id === cat.id).reduce((s, e) => s + e.amount, 0),
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
            Expenses
          </h2>
          <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
            OPERATING EXPENSES & COSTS
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCatManager(true)}
            style={{ borderColor: 'var(--copper-dark)', color: 'var(--text-muted)' }}
          >
            <Settings size={13} />
            Categories
          </Button>
          <Button
            onClick={() => { setEditExpense(null); setShowForm(true) }}
            style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
          >
            <Plus size={15} />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Totals bar */}
      {expenses.length > 0 && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)' }}
        >
          <div className="flex items-start gap-8">
            <div style={{ minWidth: '140px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
                {categoryFilter === 'all' ? 'TOTAL EXPENSES' : 'FILTERED TOTAL'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--destructive)', marginTop: '4px', fontWeight: 'bold' }}>
                {formatMoney(total)}
              </div>
            </div>
            {byCategory.length > 0 && categoryFilter === 'all' && (
              <div className="flex gap-6 flex-wrap" style={{ borderLeft: '1px solid var(--copper-dark)', paddingLeft: '24px' }}>
                {byCategory.map(cat => (
                  <div key={cat.name}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                      {cat.name.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {formatMoney(cat.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap" style={{ backgroundColor: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--copper-dark)', display: 'inline-flex' }}>
        <button
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            cursor: 'pointer',
            border: 'none',
            backgroundColor: categoryFilter === 'all' ? 'var(--copper-dark)' : 'transparent',
            color: categoryFilter === 'all' ? 'var(--copper-bright)' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
          onClick={() => setCategoryFilter('all')}
        >
          ALL
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: categoryFilter === cat.id ? 'var(--copper-dark)' : 'transparent',
              color: categoryFilter === cat.id ? 'var(--copper-bright)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div className="grid" style={{ gridTemplateColumns: '120px 130px 160px 110px 1fr 160px 40px 72px', borderBottom: '1px solid var(--copper-dark)' }}>
          <div style={colHeader}>DATE</div>
          <div style={colHeader}>LOCATION</div>
          <div style={colHeader}>CATEGORY</div>
          <div style={colHeader}>AMOUNT</div>
          <div style={colHeader}>DESCRIPTION</div>
          <div style={colHeader}>MACHINE</div>
          <div style={colHeader} />
          <div style={colHeader} />
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            {categoryFilter === 'all' ? 'No expenses yet. Add your first expense.' : 'No expenses in this category.'}
          </div>
        ) : (
          filtered.map((expense, i) => {
            const isLast = i === filtered.length - 1
            return (
              <div
                key={expense.id}
                className="grid items-center"
                style={{ gridTemplateColumns: '120px 130px 160px 110px 1fr 160px 40px 72px', borderBottom: isLast ? 'none' : '1px solid rgba(107,46,18,0.25)' }}
              >
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {formatDate(expense.date)}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {expense.locations?.name ?? '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}>
                  {expense.expense_categories?.name ?? '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontSize: '14px', fontWeight: 'bold' }}>
                  {formatMoney(expense.amount)}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {expense.description ?? '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {expense.machines?.name ?? '—'}
                </div>
                {/* Source + file indicators */}
                <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  {expense.source === 'maintenance_log' && (
                    <span title="Auto-created from maintenance log">
                      <Wrench size={12} style={{ color: 'var(--patina-light)', opacity: 0.8 }} />
                    </span>
                  )}
                  {expense.source === 'bank_import' && (
                    <span title="Imported from bank CSV">
                      <Landmark size={12} style={{ color: 'var(--steel-light)', opacity: 0.8 }} />
                    </span>
                  )}
                  {expense.file_url && (
                    <a href={expense.file_url} target="_blank" rel="noopener noreferrer" title="View attachment">
                      <Paperclip size={12} style={{ color: 'var(--steel-light)', opacity: 0.8 }} />
                    </a>
                  )}
                </div>
                {/* Actions */}
                <div style={{ padding: '12px' }} className="flex gap-1 items-center justify-end">
                  {confirmDelete === expense.id ? (
                    <div className="flex items-center gap-1">
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', color: 'var(--destructive)', letterSpacing: '0.05em' }}>DEL?</span>
                      <button onClick={() => handleDelete(expense.id)} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 3px' }}>Y</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 3px' }}>N</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => { setEditExpense(expense); setShowForm(true) }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(expense.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', opacity: 0.7, padding: '4px' }}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Entry count */}
      {!loading && filtered.length > 0 && (
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'EXPENSE' : 'EXPENSES'}
        </div>
      )}

      {showForm && (
        <ExpenseForm
          expense={editExpense}
          categories={categories}
          machines={machines}
          onSave={fetchExpenses}
          onClose={() => { setShowForm(false); setEditExpense(null) }}
        />
      )}

      {showCatManager && (
        <ExpenseCategoryManager
          categories={categories}
          onUpdate={fetchCategories}
          onClose={() => setShowCatManager(false)}
        />
      )}
    </div>
  )
}
