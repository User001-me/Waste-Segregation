import React, { useState } from 'react';
import { Scan, Camera, Recycle, Zap, Brain, RefreshCw } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import WebcamDetector from '../components/WebcamDetector';
import DetectionResult from '../components/DetectionResult';
import { predictImage } from '../api';

const s = {
  page: { paddingTop: '80px', minHeight: '100vh' },
  hero: {
    padding: '60px 24px 48px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600, height: 300,
    background: 'radial-gradient(ellipse, rgba(74,222,128,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 99, padding: '4px 14px',
    fontSize: '12px', color: 'var(--green)',
    fontFamily: 'var(--font-mono)',
    marginBottom: '20px',
    letterSpacing: '0.05em',
  },
  h1: {
    fontFamily: 'var(--font-head)', fontWeight: 800,
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    color: 'var(--text)', lineHeight: 1.1,
    marginBottom: '16px',
    letterSpacing: '-0.03em',
  },
  accent: { color: 'var(--green)' },
  sub: {
    fontSize: '15px', color: 'var(--text2)',
    maxWidth: 520, margin: '0 auto 32px',
    lineHeight: 1.7,
  },
  stats: {
    display: 'flex', gap: '24px', justifyContent: 'center',
    flexWrap: 'wrap', marginBottom: '0',
  },
  stat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '2px',
  },
  statNum: {
    fontFamily: 'var(--font-mono)', fontSize: '1.4rem',
    fontWeight: 500, color: 'var(--green)',
  },
  statLabel: { fontSize: '11px', color: 'var(--text3)' },

  main: { maxWidth: 900, margin: '0 auto', padding: '0 20px 80px' },

  tabs: {
    display: 'flex', gap: '8px', marginBottom: '24px',
    background: 'var(--surface)', padding: '6px',
    borderRadius: 'var(--radius)', border: '1px solid var(--border)',
    width: 'fit-content',
  },
  tab: (active) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 18px', borderRadius: 8,
    fontSize: '13px', fontWeight: 600,
    background: active ? 'var(--green3)' : 'transparent',
    color: active ? '#fff' : 'var(--text3)',
    border: 'none', cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
  }),

  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
    gap: '24px',
  },
  panel: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
  },
  panelTitle: {
    fontFamily: 'var(--font-head)', fontWeight: 700,
    fontSize: '0.95rem', color: 'var(--text2)',
    marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
    textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px',
  },

  detectBtn: {
    width: '100%', marginTop: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '13px', borderRadius: 12,
    background: 'var(--green3)', color: '#fff',
    fontSize: '14px', fontWeight: 700,
    border: 'none', cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'var(--font-body)',
    letterSpacing: '0.02em',
  },
  resetBtn: {
    width: '100%', marginTop: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '10px', borderRadius: 10,
    background: 'transparent', color: 'var(--text3)',
    fontSize: '13px',
    border: '1px solid var(--border)', cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
  },

  features: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px',
    margin: '40px 0 0', paddingTop: '40px',
    borderTop: '1px solid var(--border)',
  },
  feat: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '18px',
  },
  featIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '10px',
  },
  featTitle: {
    fontFamily: 'var(--font-head)', fontWeight: 700,
    fontSize: '0.9rem', color: 'var(--text)', marginBottom: '4px',
  },
  featDesc: { fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5 },
};

export default function Home() {
  const [tab, setTab] = useState('upload');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDetect = async () => {
    if (!imageFile) return;
    setLoading(true);
    try {
      const res = await predictImage(imageFile);
      setResult(res);
    } catch (e) {
      console.error('Detection failed:', e);
      alert('Detection failed. Make sure the backend is running.');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setImageFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroGlow} />
        <div style={s.eyebrow}>
          <Recycle size={11} />
          YOLOv8m · 23 Classes · 132K Training Images
        </div>
        <h1 style={s.h1}>
          Identify waste.<br />
          <span style={s.accent}>Dispose right.</span>
        </h1>
        <p style={s.sub}>
          AI-powered waste detection trained on real-world data across 6 official
          solid waste categories per India's SWM Rules 2016.
        </p>
        <div style={s.stats}>
          {[['23', 'waste classes'], ['132K', 'training images'], ['78%+', 'mAP50'], ['6', 'waste groups']].map(([n, l]) => (
            <div key={l} style={s.stat}>
              <div style={s.statNum}>{n}</div>
              <div style={s.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'upload')} onClick={() => { setTab('upload'); handleReset(); }}>
            <Scan size={14} />
            Upload Image
          </button>
          <button style={s.tab(tab === 'webcam')} onClick={() => setTab('webcam')}>
            <Camera size={14} />
            Live Camera
          </button>
        </div>

        {tab === 'upload' ? (
          <div style={{ ...s.grid, gridTemplateColumns: result ? '1fr 1fr' : '1fr' }}>
            <div style={s.panel}>
              <div style={s.panelTitle}>
                <Scan size={12} />
                Image Input
              </div>
              <ImageUpload onImage={handleImage} preview={preview} onClear={handleReset} />
              {imageFile && !result && (
                <>
                  <button
                    style={{ ...s.detectBtn, opacity: loading ? 0.7 : 1 }}
                    onClick={handleDetect}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} />
                        Analysing...
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        Detect Waste
                      </>
                    )}
                  </button>
                  <button style={s.resetBtn} onClick={handleReset}>
                    <RefreshCw size={12} />
                    Clear
                  </button>
                </>
              )}
              {result && (
                <button style={s.resetBtn} onClick={handleReset}>
                  <RefreshCw size={12} />
                  New Image
                </button>
              )}
            </div>

            {result && (
              <div style={s.panel}>
                <div style={s.panelTitle}>
                  <Brain size={12} />
                  Detection Results
                </div>
                <DetectionResult result={result} />
              </div>
            )}
          </div>
        ) : (
          <div style={s.panel}>
            <div style={s.panelTitle}>
              <Camera size={12} />
              Live Detection
            </div>
            <WebcamDetector />
          </div>
        )}

        {/* Features */}
        <div style={s.features}>
          {[
            { icon: <Brain size={16} color="var(--green)" />, title: 'Active Learning', desc: 'Wrong detection? Correct it and help the model improve automatically.' },
            { icon: <Zap size={16} color="var(--green)" />, title: 'Real-time Speed', desc: 'YOLOv8m delivers fast inference suitable for live camera feeds.' },
            { icon: <Recycle size={16} color="var(--green)" />, title: 'Disposal Guidance', desc: 'Every detection comes with official disposal instructions per SWM Rules 2016.' },
          ].map(f => (
            <div key={f.title} style={s.feat}>
              <div style={s.featIcon}>{f.icon}</div>
              <div style={s.featTitle}>{f.title}</div>
              <div style={s.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
