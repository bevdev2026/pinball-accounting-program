import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Location } from './types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  location: Location | null
  onSave: () => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--copper-dark)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
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

export function LocationForm({ location, onSave, onClose }: Props) {
  const isEdit = location !== null
  const [name, setName] = useState(location?.name ?? '')
  const [address, setAddress] = useState(location?.address ?? '')
  const [mainContact, setMainContact] = useState(location?.main_contact ?? '')
  const [contactEmail, setContactEmail] = useState(location?.contact_email ?? '')
  const [phoneNumber, setPhoneNumber] = useState(location?.phone_number ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(location?.name ?? '')
    setAddress(location?.address ?? '')
    setMainContact(location?.main_contact ?? '')
    setContactEmail(location?.contact_email ?? '')
    setPhoneNumber(location?.phone_number ?? '')
  }, [location])

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Location name is required.')
      return
    }
    setSaving(true)

    const payload = {
      name: name.trim(),
      address: address.trim() || null,
      main_contact: mainContact.trim() || null,
      contact_email: contactEmail.trim() || null,
      phone_number: phoneNumber.trim() || null,
    }

    if (isEdit) {
      const { error } = await supabase
        .from('locations')
        .update(payload)
        .eq('id', location!.id)
      if (error) { toast.error('Failed to update location.'); setSaving(false); return }
      toast.success('Location updated.')
    } else {
      const { error } = await supabase.from('locations').insert(payload)
      if (error) { toast.error(`Failed to add location: ${error.message}`); setSaving(false); return }
      toast.success('Location added.')
    }

    onSave()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            {isEdit ? 'EDIT LOCATION' : 'ADD LOCATION'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label style={labelStyle}>Location Name *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Downtown Arcade"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Address</label>
            <input
              style={inputStyle}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St, Anytown USA"
            />
          </div>

          <div>
            <label style={labelStyle}>Main Contact</label>
            <input
              style={inputStyle}
              value={mainContact}
              onChange={e => setMainContact(e.target.value)}
              placeholder="Contact name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input
                style={inputStyle}
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                style={inputStyle}
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
