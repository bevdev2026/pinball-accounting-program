import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Download, Trash2, FileText, Image, File, Link } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'

interface StoredFile {
  id: string
  name: string
  storage_path: string
  file_type: string | null
  size_bytes: number | null
  machine_id: string | null
  description: string | null
  created_at: string
  machine_name?: string
}

interface Machine {
  id: string
  name: string
}

const BUCKET = 'documents'

function formatBytes(b: number | null) {
  if (b == null) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function FileIcon({ type }: { type: string | null }) {
  if (!type) return <File size={14} />
  if (type.startsWith('image/')) return <Image size={14} />
  if (type === 'application/pdf' || type.includes('text')) return <FileText size={14} />
  return <File size={14} />
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--copper-dark)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontSize: '10px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-muted)',
}

const colHeader: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: 'var(--text-muted)',
  padding: '10px 12px',
}

export function DropboxView() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [machineId, setMachineId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('files')
      .select('*, machines(name)')
      .order('created_at', { ascending: false })
    if (data) {
      setFiles(data.map((f: any) => ({ ...f, machine_name: f.machines?.name ?? null })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const { data: m } = await supabase
        .from('machines')
        .select('id, name')
        .eq('is_archived', false)
        .neq('status', 'Retired')
        .order('name')
      if (m) setMachines(m)
    }
    init()
    fetchFiles()
  }, [fetchFiles])

  async function handleUpload() {
    if (!selectedFile) { toast.error('Select a file first.'); return }
    setUploading(true)
    try {
      const ext = selectedFile.name.split('.').pop() ?? ''
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, selectedFile, { cacheControl: '3600', upsert: false })

      if (uploadErr) {
        if (uploadErr.message.includes('Bucket not found') || uploadErr.message.includes('does not exist')) {
          toast.error('Storage bucket "documents" not found. Please create it in your Supabase dashboard → Storage → New Bucket → name: "documents" → Public: off.')
        } else {
          toast.error(`Upload failed: ${uploadErr.message}`)
        }
        return
      }

      const { error: dbErr } = await supabase.from('files').insert({
        name: selectedFile.name,
        storage_path: path,
        file_type: selectedFile.type || null,
        size_bytes: selectedFile.size,
        machine_id: machineId || null,
        description: description.trim() || null,
      })

      if (dbErr) {
        toast.error('File uploaded but failed to save record.')
        return
      }

      toast.success(`"${selectedFile.name}" uploaded.`)
      setSelectedFile(null)
      setDescription('')
      setMachineId('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchFiles()
    } finally {
      setUploading(false)
    }
  }

  async function getDownloadUrl(file: StoredFile) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 3600)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      toast.error('Could not generate download link.')
    }
  }

  async function handleDelete(file: StoredFile) {
    setDeleting(true)
    const { error: storageErr } = await supabase.storage.from(BUCKET).remove([file.storage_path])
    if (storageErr) { toast.error('Failed to delete file from storage.'); setDeleting(false); setConfirmDelete(null); return }
    const { error: dbErr } = await supabase.from('files').delete().eq('id', file.id)
    if (dbErr) { toast.error('File removed from storage but record deletion failed.') }
    else { toast.success(`"${file.name}" deleted.`) }
    fetchFiles()
    setConfirmDelete(null)
    setDeleting(false)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
          Documents
        </h2>
        <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
          FILE STORAGE — RECEIPTS, CONTRACTS & DOCUMENTS
        </p>
      </div>

      {/* Upload panel */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--copper-dark)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '14px' }}>
          UPLOAD FILE
        </div>
        <div className="space-y-3">
          {/* File picker */}
          <div>
            <label style={labelStyle}>File *</label>
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  ...inputStyle,
                  width: 'auto',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                <Upload size={14} />
                Choose File
              </button>
              {selectedFile && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {selectedFile.name} <span style={{ color: 'var(--text-muted)' }}>({formatBytes(selectedFile.size)})</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Description (optional)</label>
              <input
                style={inputStyle}
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this file?"
              />
            </div>
            <div>
              <label style={labelStyle}>Associate with Machine (optional)</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={machineId}
                onChange={e => setMachineId(e.target.value)}
              >
                <option value="">— No machine —</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
            >
              <Upload size={14} />
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>

      {/* File list */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 140px 120px 110px 76px', borderBottom: '1px solid var(--copper-dark)' }}>
          <div style={colHeader}>NAME / DESCRIPTION</div>
          <div style={colHeader}>MACHINE</div>
          <div style={colHeader}>UPLOADED</div>
          <div style={colHeader}>SIZE</div>
          <div style={colHeader} />
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING…</div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            No files uploaded yet.
          </div>
        ) : (
          files.map((file, i) => {
            const isLast = i === files.length - 1
            const isDel = confirmDelete === file.id
            return (
              <div
                key={file.id}
                className="grid items-center"
                style={{ gridTemplateColumns: '1fr 140px 120px 110px 76px', borderBottom: isLast ? 'none' : '1px solid rgba(107,46,18,0.25)' }}
              >
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    <FileIcon type={file.file_type} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    {file.description && (
                      <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.description}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.machine_name ?? '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {formatDate(file.created_at)}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {formatBytes(file.size_bytes)}
                </div>
                <div style={{ padding: '12px' }} className="flex gap-1 items-center justify-end">
                  {isDel ? (
                    <div className="flex items-center gap-1">
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', color: 'var(--destructive)', letterSpacing: '0.05em' }}>DEL?</span>
                      <button onClick={() => handleDelete(file)} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 3px' }}>Y</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 3px' }}>N</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => getDownloadUrl(file)} title="Open / Download" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                        <Link size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(file.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', opacity: 0.7, padding: '4px' }}>
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

      {!loading && files.length > 0 && (
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {files.length} {files.length === 1 ? 'FILE' : 'FILES'}
        </div>
      )}
    </div>
  )
}
