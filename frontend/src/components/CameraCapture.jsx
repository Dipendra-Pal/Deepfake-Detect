import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './CameraCapture.module.css'

export default function CameraCapture({ onResult }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [snapshot, setSnapshot] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')

  // Enumerate camera devices on mount
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    navigator.mediaDevices
      .enumerateDevices()
      .then((devs) => {
        const cams = devs.filter((d) => d.kind === 'videoinput')
        setDevices(cams)
        if (cams.length > 0) setSelectedDevice(cams[0].deviceId)
      })
      .catch(() => setError('Could not enumerate camera devices.'))
  }, [])

  // Stop camera stream on unmount
  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser or context (HTTPS required).')
      return
    }
    try {
      const constraints = {
        video: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
        audio: false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      setSnapshot(null)
    } catch (err) {
      setError(`Camera access denied or unavailable: ${err.message}`)
    }
  }, [selectedDevice])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  const captureSnapshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setSnapshot(dataUrl)
    setAnalyzing(true)

    try {
      // Strip the prefix to send only base64 data
      const base64 = dataUrl.split(',')[1]
      const res = await fetch('/api/analyze-camera-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })
      const data = await res.json()
      if (onResult) onResult(data.prediction)
    } catch (err) {
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }, [onResult])

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>
        <CameraIcon />
        Live Camera
      </h2>

      {devices.length > 1 && (
        <div className={styles.row}>
          <label htmlFor="cam-select" className={styles.label}>Camera:</label>
          <select
            id="cam-select"
            className={styles.select}
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            disabled={cameraActive}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.preview}>
        <video ref={videoRef} className={styles.video} muted playsInline />
        <canvas ref={canvasRef} className={styles.hidden} />
        {!cameraActive && (
          <div className={styles.placeholder}>
            <CameraIcon size={48} />
            <p>Camera is off</p>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        {!cameraActive ? (
          <button className={styles.btnPrimary} onClick={startCamera}>
            Start Camera
          </button>
        ) : (
          <>
            <button className={styles.btnSecondary} onClick={stopCamera}>
              Stop Camera
            </button>
            <button
              className={styles.btnCapture}
              onClick={captureSnapshot}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing…' : 'Capture & Analyze'}
            </button>
          </>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {snapshot && (
        <div className={styles.snapshotWrap}>
          <p className={styles.snapshotLabel}>Captured Frame</p>
          <img src={snapshot} alt="Captured frame" className={styles.snapshotImg} />
        </div>
      )}
    </section>
  )
}

function CameraIcon({ size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
