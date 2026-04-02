import styles from './ResultDisplay.module.css'

export default function ResultDisplay({ result }) {
  if (!result) return null

  const { label, confidence, message } = result

  const isPending = label === 'Pending'
  const isFake = label === 'Fake'

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>
        <ShieldIcon />
        Detection Result
      </h2>

      <div className={`${styles.badge} ${isPending ? styles.pending : isFake ? styles.fake : styles.real}`}>
        <span className={styles.badgeIcon}>
          {isPending ? '⏳' : isFake ? '⚠️' : '✅'}
        </span>
        <span className={styles.badgeLabel}>{label}</span>
      </div>

      {typeof confidence === 'number' && (
        <div className={styles.confidenceWrap}>
          <div className={styles.confidenceBar}>
            <div
              className={`${styles.confidenceFill} ${isFake ? styles.fillFake : styles.fillReal}`}
              style={{ width: `${(confidence * 100).toFixed(1)}%` }}
            />
          </div>
          <p className={styles.confidenceText}>
            Confidence: <strong>{(confidence * 100).toFixed(1)}%</strong>
          </p>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </section>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
