import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ExpenseCategory } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  categories: ExpenseCategory[]
  onUpdate: () => void
  onClose: () => void
}

export function ExpenseCategoryManager({ categories, onUpdate, onClose }: Props) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('expense_categories').insert({ name: newName.trim() })
    if (error) {
      toast.error(error.code === '23505' ? 'That category already exists.' : 'Failed to add category.')
    } else {
      toast.success(`"${newName.trim()}" added.`)
      setNewName('')
      onUpdate()
    }
    setSaving(false)
  }

  async function handleDelete(cat: ExpenseCategory) {
    const { error } = await supabase.from('expense_categories').delete().eq('id', cat.id)
    if (error) {
      toast.error('Cannot delete — this category has existing expense entries.')
    } else {
      toast.success(`"${cat.name}" removed.`)
      onUpdate()
    }
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--copper-dark)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    outline: 'none',
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }} className="max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            EXPENSE CATEGORIES
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex gap-2">
            <input
              style={inputStyle}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="New category name…"
              autoFocus
            />
            <Button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              size="sm"
              style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)', flexShrink: 0 }}
            >
              <Plus size={14} />
              Add
            </Button>
          </div>

          <div style={{ borderTop: '1px solid var(--copper-dark)', paddingTop: '12px' }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid rgba(107,46,18,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {cat.name}
                  </span>
                  {cat.is_default && (
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '999px' }}>
                      DEFAULT
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(cat)}
                  title="Delete category"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', opacity: 0.7, padding: '4px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
