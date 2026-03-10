import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadResume } from '../api/resume.js'

const MAX_SIZE = 5 * 1024 * 1024
const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

export default function UploadZone({ onSuccess }) {
  const [status, setStatus] = useState('idle')   // idle | uploading | success | error
  const [error,  setError]  = useState(null)
  const [result, setResult] = useState(null)

  const onDrop = useCallback(async (accepted, rejected) => {
    setError(null)
    if (rejected.length > 0) {
      const r = rejected[0]
      if (r.errors.some(e => e.code === 'file-too-large'))
        setError('File too large — max 5MB')
      else
        setError('Unsupported file type — PDF or DOCX only')
      return
    }
    if (!accepted.length) return

    const file = accepted[0]
    setStatus('uploading')
    try {
      const data = await uploadResume(file)
      setResult(data)
      setStatus('success')
      onSuccess(data)
    } catch (err) {
      if (err.response?.status === 413)       setError('File too large — max 5MB')
      else if (err.response?.status === 400)  setError(err.response.data?.detail || 'Unsupported file type — PDF or DOCX only')
      else                                    setError('Upload failed — please try again')
      setStatus('error')
    }
  }, [onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxSize: MAX_SIZE, multiple: false,
  })

  if (status === 'success' && result) {
    return (
      <div className="card animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ color: 'var(--green)', fontSize: 20 }}>✓</span>
          <span style={{ fontWeight: 600, color: 'var(--green)' }}>{result.file_name}</span>
          <span className="badge badge-green">{result.char_count?.toLocaleString()} chars</span>
        </div>
        {result.preview && (
          <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            Preview: {result.preview}...
          </p>
        )}
        <button
          className="btn btn-ghost"
          style={{ marginTop: 12, fontSize: 11, padding: '4px 10px' }}
          onClick={() => { setStatus('idle'); setResult(null); setError(null) }}
        >
          ↩ Upload different file
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className="card"
        style={{
          border: `2px dashed ${isDragActive ? 'var(--green)' : 'var(--border)'}`,
          background: isDragActive ? 'var(--green-muted)' : 'var(--surface)',
          cursor: 'pointer', textAlign: 'center', padding: '48px 24px',
          transition: 'all 0.2s ease',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: 32, marginBottom: 12 }}>
          {status === 'uploading' ? <span className="spinner" style={{ width: 32, height: 32 }} /> : '📄'}
        </div>
        <p style={{ fontWeight: 600, marginBottom: 6 }}>
          {status === 'uploading' ? 'Uploading...' : isDragActive ? 'Drop your resume here' : 'Drop resume here or click to browse'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>PDF or DOCX · Max 5MB</p>
      </div>
      {error && (
        <div className="banner banner-error" style={{ marginTop: 8 }}>
          <span>⚠</span><span>{error}</span>
        </div>
      )}
    </div>
  )
}