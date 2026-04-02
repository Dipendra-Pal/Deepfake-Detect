import { useState } from 'react'
import Header from './components/Header'
import CameraCapture from './components/CameraCapture'
import FrameExtractor from './components/FrameExtractor'
import ResultDisplay from './components/ResultDisplay'
import './App.css'

export default function App() {
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('camera')

  return (
    <div className="app">
      <Header />

      <main className="main">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            📷 Live Camera
          </button>
          <button
            className={`tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            🎬 Video Frames
          </button>
        </div>

        <div className="content">
          <div className="panel">
            {activeTab === 'camera' ? (
              <CameraCapture onResult={setResult} />
            ) : (
              <FrameExtractor onResult={setResult} />
            )}
          </div>

          <div className="panel">
            {result ? (
              <ResultDisplay result={result} />
            ) : (
              <div className="empty-result">
                <EmptyIcon />
                <p>No analysis yet</p>
                <small>
                  {activeTab === 'camera'
                    ? 'Start your camera and capture a frame to analyse it.'
                    : 'Upload a video, extract frames, then click a frame to analyse it.'}
                </small>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Deepfake Detector &mdash; AI-powered media authenticity verification</p>
      </footer>
    </div>
  )
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="48" height="48" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#2d3f55" strokeWidth="2" />
      <path d="M8 12h8M12 8v8" stroke="#2d3f55" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
