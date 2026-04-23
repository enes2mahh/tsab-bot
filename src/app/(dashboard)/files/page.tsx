'use client'

import { useState, useEffect } from 'react'
import { Upload, FolderOpen, Copy, Trash2, Image, FileText, Film, File, Search, Grid, List } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileItem {
  id: string; name: string; original_name: string; public_url: string
  size: number; mime_type: string; folder: string; storage_path: string; created_at: string
}

function formatSize(bytes: number) {
  if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes > 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

function FileIcon({ mime }: { mime: string }) {
  if (mime?.startsWith('image')) return <Image size={20} color="#10B981" />
  if (mime?.startsWith('video')) return <Film size={20} color="#A78BFA" />
  if (mime?.includes('pdf')) return <FileText size={20} color="#EF4444" />
  return <File size={20} color="#94A3B8" />
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchFiles = async () => {
    const { data } = await createClient().from('files').select('*').order('created_at', { ascending: false })
    setFiles(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchFiles() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { data: uploadData, error } = await supabase.storage.from('media').upload(path, file)

    if (!error && uploadData) {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
      await supabase.from('files').insert({
        user_id: user.id,
        name: file.name,
        original_name: file.name,
        storage_path: path,
        public_url: urlData.publicUrl,
        size: file.size,
        mime_type: file.type,
      })
      fetchFiles()
    }
    setUploading(false)
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm('حذف هذا الملف؟')) return
    const supabase = createClient()
    await supabase.storage.from('media').remove([file.storage_path])
    await supabase.from('files').delete().eq('id', file.id)
    fetchFiles()
  }

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>مدير الملفات</h2><p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{files.length} ملف</p></div>
        <label className="btn-primary" style={{ cursor: 'pointer' }}>
          <Upload size={16} /> {uploading ? 'جاري الرفع...' : 'رفع ملف'}
          <input type="file" hidden onChange={handleUpload} accept="image/*,video/*,application/pdf,.doc,.docx" />
        </label>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <input className="input-cosmic" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الملفات..." style={{ paddingRight: '40px' }} />
          <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          {[{ v: 'grid', icon: <Grid size={16} /> }, { v: 'list', icon: <List size={16} /> }].map(m => (
            <button key={m.v} onClick={() => setViewMode(m.v as any)} style={{ padding: '8px 14px', background: viewMode === m.v ? 'rgba(124,58,237,0.15)' : 'transparent', border: 'none', color: viewMode === m.v ? '#A78BFA' : 'var(--text-muted)', cursor: 'pointer' }}>{m.icon}</button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: '14px', padding: '32px', textAlign: 'center', marginBottom: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-violet)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
        <input type="file" hidden onChange={handleUpload} accept="image/*,video/*,application/pdf" />
        <Upload size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>اسحب وأفلت الملفات هنا أو اضغط للاختيار</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>صور، فيديو، PDF (حتى 50MB)</p>
      </label>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <FolderOpen size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>{search ? 'لا توجد نتائج' : 'لا توجد ملفات بعد. ارفع ملفاً!'}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {filtered.map(file => (
            <div key={file.id} className="card" style={{ padding: '12px', position: 'relative' }}>
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                {file.mime_type?.startsWith('image') ? (
                  <img src={file.public_url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : <FileIcon mime={file.mime_type} />}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{file.original_name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{formatSize(file.size)}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => copyUrl(file.public_url, file.id)} style={{ flex: 1, padding: '4px', background: copied === file.id ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: copied === file.id ? '#10B981' : 'var(--text-muted)', fontSize: '11px' }}>
                  <Copy size={11} />
                </button>
                <button onClick={() => handleDelete(file)} style={{ flex: 1, padding: '4px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table-cosmic">
            <thead><tr><th>الاسم</th><th>الحجم</th><th>النوع</th><th>التاريخ</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {filtered.map(file => (
                <tr key={file.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileIcon mime={file.mime_type} /><span style={{ fontSize: '13px' }}>{file.original_name}</span></div></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatSize(file.size)}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{file.mime_type}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(file.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => copyUrl(file.public_url, file.id)} style={{ padding: '5px 8px', background: copied === file.id ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: copied === file.id ? '#10B981' : '#A78BFA', fontSize: '12px' }}>
                        {copied === file.id ? '✓ نسخ' : <Copy size={13} />}
                      </button>
                      <button onClick={() => handleDelete(file)} style={{ padding: '5px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
