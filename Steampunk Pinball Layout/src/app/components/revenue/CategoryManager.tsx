import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RevenueCategory } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  categories: RevenueCategory[]
  onUpdate: () => void
  onClose: () => void
}

export function CategoryManager({ categories, onUpdate, onClose }: Props) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('revenue_categories').insert({ name: newName.trim() })
    if (error) {
      toast.error(error.code === '23505' ? 'That category already exists.' : 'Failed to add category.')
    } else {
      toast.success(`"${newName.trim()}" added.`)
      setNewName('')
      onUpdate()
    }
    setSaving(false)
  }

  async function handleDelete(cat: RevenueCategory) {
    const { error } = await supabase.from('revenue_categories').delete().eq('id', cat.id)
    if (error) {
      toast.error('Cannot delete — this category has existing revenue entries.')
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
            REVENUE CATEGORIES
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Add new */}
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

          {/* Category list */}
          <div style={{ borderTop: '1px solid var(--copper-dark)', paddingTop: '12px' }}>
            {categories.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px', textAlign: 'center', padding: '8px 0' }}>
                No categories yet.
              </p>
            ) : (
              categories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(107,46,18,0.2)' }}
                >
                  <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {cat.name}
                  </span>
                  <button
                    onClick={() => handleDelete(cat)}
                    title="Delete category"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', opacity: 0.7, padding: '4px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
