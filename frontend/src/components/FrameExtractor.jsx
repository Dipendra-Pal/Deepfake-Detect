import { useState, useCallback } from 'react'
import styles from './FrameExtractor.module.css'

const MAX_FRAMES_LIMIT = 30

export default function FrameExtractor({ onResult }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [maxFrames, setMaxFrames] = useState(10)
  const [frames, setFrames] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFrame, setSelectedFrame] = useState(null)

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setFrames([])
    setSelectedFrame(null)
    setError(null)
  }, [])

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return
    setError(null)
    setLoading(true)
    setFrames([])
    setSelectedFrame(null)

    const formData = new FormData()
    formData.append('video', selectedFile)
    formData.append('max_frames', String(maxFrames))

    try {
      const res = await fetch('/api/extract-frames', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction failed.')
      setFrames(data.frames)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedFile, maxFrames])

  const handleAnalyzeFrame = useCallback(
    async (frame) => {
      setSelectedFrame(frame)
      setAnalyzing(true)
      setError(null)

      try {
        // Convert data URL to Blob → File for upload
        const res = await fetch(frame.data_url)
        const blob = await res.blob()
        const file = new File([blob], `frame_${frame.index}.jpg`, { type: 'image/jpeg' })

        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/analyze-frame', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Analysis failed.')
        if (onResult) onResult(data.prediction)
      } catch (err) {
        setError(`Analysis failed: ${err.message}`)
      } finally {
        setAnalyzing(false)
      }
    },
    [onResult],
  )

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>
        <FilmIcon />
        Frame Extractor
      </h2>

      <div className={styles.uploadArea}>
        <label className={styles.uploadLabel} htmlFor="video-upload">
          <UploadIcon />
          <span>
            {selectedFile ? selectedFile.name : 'Click to upload a video file'}
          </span>
          <small>{selectedFile ? formatFileSize(selectedFile.size) : 'MP4, AVI, MOV, MKV, WebM'}</small>
        </label>
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          className={styles.fileInput}
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="max-frames" className={styles.label}>
          Frames to extract:
        </label>
        <input
          id="max-frames"
          type="range"
          min={1}
          max={MAX_FRAMES_LIMIT}
          value={maxFrames}
          onChange={(e) => setMaxFrames(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.frameCount}>{maxFrames}</span>
      </div>

      <button
        className={styles.btnExtract}
        onClick={handleExtract}
        disabled={!selectedFile || loading}
      >
        {loading ? 'Extracting…' : 'Extract Frames'}
      </button>

      {error && <p className={styles.error}>{error}</p>}

      {frames.length > 0 && (
        <div className={styles.framesSection}>
          <p className={styles.framesInfo}>
            {frames.length} frame{frames.length !== 1 ? 's' : ''} extracted — click a frame to analyze it
          </p>
          <div className={styles.grid}>
            {frames.map((frame) => (
              <button
                key={frame.index}
                className={`${styles.frameBtn} ${selectedFrame?.index === frame.index ? styles.selected : ''}`}
                onClick={() => handleAnalyzeFrame(frame)}
                disabled={analyzing}
                title={`Frame #${frame.index} @ ${formatTime(frame.timestamp_ms)}`}
              >
                <img
                  src={frame.data_url}
                  alt={`Frame at ${formatTime(frame.timestamp_ms)}`}
                  className={styles.frameImg}
                />
                <span className={styles.frameTime}>{formatTime(frame.timestamp_ms)}</span>
                {analyzing && selectedFrame?.index === frame.index && (
                  <span className={styles.analyzingOverlay}>Analyzing…</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="32" height="32" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
