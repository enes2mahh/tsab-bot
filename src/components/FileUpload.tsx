'use client'

import { useState, useRef } from 'react'
import NextImage from 'next/image'
import { Upload, Link2, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  value: string                  // current URL
  onChange: (url: string) => void
  folder?: string                // subfolder e.g. 'logos', 'stories', 'avatars'
  accept?: string                // file accept (e.g. "image/*")
  maxSizeMB?: number
  preview?: boolean              // show image preview
  placeholder?: string
  label?: string
  hint?: React.ReactNode
}

export function FileUpload({
  value,
  onChange,
  folder = 'general',
  accept = 'image/*',
  maxSizeMB = 10,
  preview = true,
  placeholder = 'https://... أو ارفع ملف',
  label,
  hint,
}: FileUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(value && value.startsWith('http') ? 'url' : 'upload')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`الملف كبير جداً. الحد الأقصى ${maxSizeMB} MB`)
      return
    }

    setUploading(true)
    setProgress(10)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('يجب تسجيل الدخول')
        setUploading(false)
        return
      }

      // Build path: {userId}/{folder}/{timestamp}-{filename}
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
      const path = `${user.id}/${folder}/${Date.now()}-${cleanName}`

      setProgress(40)

      const { error: upErr } = await supabase.storage
        .from('media')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (upErr) {
        setError(upErr.message || 'فشل رفع الملف')
        setUploading(false)
        return
      }

      setProgress(80)

      // Get public URL
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
      onChange(pub.publicUrl)
      setProgress(100)
      setTimeout(() => setUploading(false), 300)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
      setError(msg)
      setUploading(false)
    }
  }

  const clearValue = () => {
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isImage = value && /\.(png|jpe?g|gif|webp|svg)$|^https?:\/\/.*image/i.test(value)

  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>}

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', padding: '3px', background: 'var(--bg-secondary)', borderRadius: '8px', width: 'fit-content' }}>
        <button type="button" onClick={() => setMode('upload')} style={{
          padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
          background: mode === 'upload' ? 'var(--accent-violet)' : 'transparent',
          color: mode === 'upload' ? 'white' : 'var(--text-muted)',
          fontSize: '12px', fontFamily: 'Tajawal, sans-serif', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <Upload size={12} /> رفع
        </button>
        <button type="button" onClick={() => setMode('url')} style={{
          padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
          background: mode === 'url' ? 'var(--accent-violet)' : 'transparent',
          color: mode === 'url' ? 'white' : 'var(--text-muted)',
          fontSize: '12px', fontFamily: 'Tajawal, sans-serif', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <Link2 size={12} /> رابط
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
            id={`file-${folder}`}
          />
          <label htmlFor={`file-${folder}`} style={{
            display: 'block', padding: '20px', textAlign: 'center',
            border: '2px dashed var(--border)', borderRadius: '12px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: uploading ? 'rgba(124,58,237,0.05)' : 'var(--bg-secondary)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = 'var(--accent-violet)' }}
            onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.borderColor = 'var(--border)' }}>
            {uploading ? (
              <>
                <Loader2 size={28} className="spin" style={{ color: 'var(--accent-violet-light)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>جاري الرفع... {progress}%</div>
                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', maxWidth: '200px', margin: '0 auto' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient)', transition: 'width 0.3s' }} />
                </div>
              </>
            ) : (
              <>
                <Upload size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>اضغط لرفع ملف</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>أو اسحب وأفلت الملف هنا</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>الحد الأقصى {maxSizeMB} MB</div>
              </>
            )}
          </label>
        </>
      ) : (
        <input
          type="url"
          className="input-cosmic"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ direction: 'ltr' }}
        />
      )}

      {/* Preview */}
      {value && preview && (
        <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isImage ? (
            <NextImage src={value} alt="preview" width={48} height={48} style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} unoptimized onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <ImageIcon size={32} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الملف الحالي:</div>
            <a href={value} target="_blank" rel="noopener" style={{ fontSize: '12px', color: 'var(--accent-violet-light)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', direction: 'ltr' }}>
              {value}
            </a>
          </div>
          <button type="button" onClick={clearValue} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#EF4444' }} title="إزالة">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#EF4444', fontSize: '12px' }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{hint}</p>}

      <style jsx>{`
        :global(.spin) { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
