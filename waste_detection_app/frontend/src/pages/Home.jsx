import React, { useEffect, useMemo, useState } from 'react';
import { Scan, Camera, Recycle, Zap, Brain, RefreshCw, History, ChevronDown, Trash2, Square, Sparkles } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import WebcamDetector from '../components/WebcamDetector';
import DetectionResult from '../components/DetectionResult';
import DrawCanvas from '../components/DrawCanvas';
import { predictImage } from '../api';
import { formatClassName } from '../constants/waste';

const HISTORY_KEY = 'wasteai_history';

const s = {
  page: { paddingTop: '80px', minHeight: '100vh' },
  hero: {
    padding: '60px 24px 48px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    isolation: 'isolate',
  },
  heroGlow: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600, height: 300,
    background: 'radial-gradient(ellipse, rgba(74,222,128,0.11) 0%, rgba(96,165,250,0.04) 35%, transparent 72%)',
    pointerEvents: 'none',
  },
  heroGlow2: {
    position: 'absolute',
    top: 18,
    right: '12%',
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    filter: 'blur(12px)',
    pointerEvents: 'none',
  },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 99, padding: '4px 14px',
    fontSize: '12px', color: 'var(--text2)',
    fontFamily: 'var(--font-mono)',
    marginBottom: '20px',
    letterSpacing: '0.05em',
    backdropFilter: 'blur(12px)',
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
  main: { maxWidth: 980, margin: '0 auto', padding: '0 20px 80px' },
  tabs: {
    display: 'flex', gap: '8px', marginBottom: '24px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
    padding: '6px',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(255,255,255,0.08)',
    width: 'fit-content',
    flexWrap: 'wrap',
    boxShadow: '0 18px 40px rgba(0,0,0,0.16)',
  },
  tab: (active) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 18px', borderRadius: 8,
    fontSize: '13px', fontWeight: 600,
    background: active ? 'linear-gradient(135deg, var(--green2), var(--green3))' : 'transparent',
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
    background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: '0 20px 44px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(14px)',
  },
  panelTitle: {
    fontFamily: 'var(--font-head)', fontWeight: 700,
    color: 'var(--text2)',
    marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
    textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px',
  },
  detectBtn: {
    width: '100%', marginTop: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '13px', borderRadius: 12,
    background: 'linear-gradient(135deg, var(--green2), var(--green3))', color: '#fff',
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
    border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
  },
  annotateBtn: (active) => ({
    width: '100%', marginTop: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '10px', borderRadius: 10,
    background: active ? 'rgba(96,165,250,0.14)' : 'rgba(255,255,255,0.01)',
    color: active ? '#93c5fd' : 'var(--text3)',
    fontSize: '13px',
    border: `1px solid ${active ? 'rgba(96,165,250,0.26)' : 'rgba(255,255,255,0.08)'}`,
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
  }),
  note: { fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5, marginTop: '10px' },
  helperCard: {
    marginTop: '16px',
    padding: '14px 16px',
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(96,165,250,0.06))',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text2)',
  },
  historyPanel: {
    marginTop: '24px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: '0 18px 36px rgba(0,0,0,0.14)',
  },
  historyHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    padding: '18px',
  },
  historyCard: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '10px',
    cursor: 'pointer',
  },
  historyThumb: {
    width: '100%', height: 120, objectFit: 'cover', borderRadius: 10,
    background: 'var(--surface2)', marginBottom: '10px',
  },
  historyMeta: { fontSize: '12px', color: 'var(--text3)' },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px',
    margin: '40px 0 0', paddingTop: '40px',
    borderTop: '1px solid var(--border)',
  },
  feat: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    border: '1px solid rgba(255,255,255,0.08)',
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

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [tab, setTab] = useState('upload');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [history, setHistory] = useState(() => getStoredHistory());
  const [annotateUpload, setAnnotateUpload] = useState(false);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!result?.annotated_image) return;
    const topClass = [...(result.detections || [])].sort((a, b) => b.confidence - a.confidence)[0]?.class || 'unknown';
    const entry = {
      id: `${Date.now()}`,
      thumbnail: result.annotated_image,
      topClass,
      timestamp: new Date().toISOString(),
      result,
    };
    setHistory((prev) => [entry, ...prev.filter((item) => item.thumbnail !== entry.thumbnail)].slice(0, 5));
  }, [result]);

  const historyItems = useMemo(() => history, [history]);

  const handleImage = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setAnnotateUpload(false);
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
    setAnnotateUpload(false);
  };

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={s.heroGlow} />
        <div style={s.heroGlow2} />
        <div style={s.eyebrow}>
          <Sparkles size={11} />
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

      <div style={s.main}>
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
          annotateUpload && preview ? (
            <div style={s.panel}>
              <div style={s.panelTitle}>
                <Square size={12} />
                Annotate Uploaded Image
              </div>
              <DrawCanvas
                backgroundImage={preview}
                defaultMode="annotation"
                allowFreeDraw={false}
                onResultChange={setResult}
              />
              <button style={s.resetBtn} onClick={() => setAnnotateUpload(false)}>
                <RefreshCw size={12} />
                Back to Upload View
              </button>
            </div>
          ) : (
            <div style={{ ...s.grid, gridTemplateColumns: result ? '1fr 1fr' : '1fr' }}>
              <div style={s.panel}>
                <div style={s.panelTitle}>
                  <Scan size={12} />
                  Image Input
                </div>
                <ImageUpload onImage={handleImage} preview={preview} onClear={handleReset} />
                {!imageFile && !result && (
                  <div style={s.helperCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700, color: 'var(--text)' }}>
                      <Square size={14} color="#93c5fd" />
                      Calm annotation workflow
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
                      Upload an image, run detection, then open annotation mode to mark any missed objects with bounding boxes and class labels for your dataset.
                    </div>
                  </div>
                )}
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
                    <button style={s.annotateBtn(false)} onClick={() => setAnnotateUpload(true)}>
                      <Square size={12} />
                      Annotate Missed Objects for Dataset
                    </button>
                    <div style={s.note}>
                      Use this when the model misses items in the uploaded photo. You'll be able to draw rectangles directly on the real image and assign each class.
                    </div>
                    <button style={s.resetBtn} onClick={handleReset}>
                      <RefreshCw size={12} />
                      Clear
                    </button>
                  </>
                )}
                {result && (
                  <>
                    <button style={s.annotateBtn(true)} onClick={() => setAnnotateUpload(true)}>
                      <Square size={12} />
                      Annotate This Uploaded Image
                    </button>
                    <button style={s.resetBtn} onClick={handleReset}>
                      <RefreshCw size={12} />
                      New Image
                    </button>
                  </>
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
          )
        ) : (
          <div style={s.panel}>
            <div style={s.panelTitle}>
              <Camera size={12} />
              Live Detection
            </div>
            <WebcamDetector />
          </div>
        )}

        <div style={s.historyPanel}>
          <div style={s.historyHeader} onClick={() => setHistoryOpen((prev) => !prev)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text)' }}>
              <History size={14} color="var(--green)" />
              Recent Detections
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {historyItems.length > 0 && (
                <button
                  style={{ ...s.resetBtn, width: 'auto', marginTop: 0, padding: '8px 12px' }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setHistory([]);
                  }}
                >
                  <Trash2 size={12} />
                  Clear History
                </button>
              )}
              <ChevronDown size={16} color="var(--text3)" style={{ transform: historyOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>
          </div>
          {historyOpen && (
            historyItems.length > 0 ? (
              <div style={s.historyGrid}>
                {historyItems.map((item) => (
                  <div key={item.id} style={s.historyCard} onClick={() => { setTab('upload'); setResult(item.result); }}>
                    <img src={`data:image/jpeg;base64,${item.thumbnail}`} alt="History preview" style={s.historyThumb} />
                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>
                      {formatClassName(item.topClass)}
                    </div>
                    <div style={s.historyMeta}>{new Date(item.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '18px 20px', fontSize: '13px', color: 'var(--text3)' }}>
                Your last 5 detections will appear here and stay available after refresh.
              </div>
            )
          )}
        </div>

        <div style={s.features}>
          {[
            { icon: <Brain size={16} color="var(--green)" />, title: 'Active Learning', desc: 'Wrong detection or missed object? Annotate it and help the model improve with cleaner training data.' },
            { icon: <Zap size={16} color="var(--green)" />, title: 'Real-time Speed', desc: 'YOLOv8m delivers fast inference for both uploaded photos and live camera checks.' },
            { icon: <Recycle size={16} color="var(--green)" />, title: 'Disposal Guidance', desc: 'Every detection is grouped and paired with disposal guidance for practical segregation.' },
          ].map((f) => (
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
