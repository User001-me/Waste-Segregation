import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CameraOff, Zap, FlipHorizontal } from 'lucide-react';
import { predictImage } from '../api';
import DetectionResult from './DetectionResult';

const s = {
  wrap: { position: 'relative' },
  camBox: {
    position: 'relative', borderRadius: 'var(--radius-lg)',
    overflow: 'hidden', border: '1px solid var(--border)',
    background: 'var(--bg3)',
    aspectRatio: '16/9',
  },
  cam: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    background: 'linear-gradient(90deg, transparent, var(--green), transparent)',
    animation: 'scan 2.5s linear infinite',
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: '12px',
    background: 'rgba(10,15,10,0.8)',
  },
  offIcon: {
    width: 64, height: 64, borderRadius: 20,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  controls: {
    display: 'flex', gap: '10px', marginTop: '14px',
    justifyContent: 'center', flexWrap: 'wrap',
  },
  btn: (active, color) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: 10,
    background: active ? (color || 'var(--green3)') : 'var(--surface)',
    color: active ? '#fff' : 'var(--text2)',
    border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
  }),
  snapBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 24px', borderRadius: 10,
    background: 'var(--green3)', color: '#fff',
    border: 'none', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
    animation: 'pulse-glow 2s ease infinite',
  },
  status: {
    position: 'absolute', bottom: 12, left: 12,
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(0,0,0,0.7)', padding: '4px 10px',
    borderRadius: 99, fontSize: '11px',
    fontFamily: 'var(--font-mono)',
  },
  dot: (on) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: on ? 'var(--green)' : 'var(--red)',
  }),
  loading: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10,15,10,0.7)',
    borderRadius: 'var(--radius-lg)',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--green)',
    animation: 'spin 0.8s linear infinite',
  },
};

export default function WebcamDetector() {
  const webcamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);
  const autoRef = useRef(null);

  const capture = useCallback(async () => {
    if (!webcamRef.current || loading) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setLoading(true);
    try {
      const blob = await (await fetch(imageSrc)).blob();
      const res = await predictImage(blob);
      setResult(res);
    } catch (e) {
      console.error('Detection error:', e);
    }
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    if (autoDetect && active) {
      autoRef.current = setInterval(capture, 3000);
    } else {
      clearInterval(autoRef.current);
    }
    return () => clearInterval(autoRef.current);
  }, [autoDetect, active, capture]);

  return (
    <div style={s.wrap}>
      <div style={s.camBox}>
        {active ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              style={s.cam}
            />
            <div style={s.scanLine} />
            <div style={s.status}>
              <div style={s.dot(true)} />
              <span style={{ color: 'var(--green)' }}>LIVE</span>
              {autoDetect && <span style={{ color: 'var(--text3)', marginLeft: 4 }}>· AUTO</span>}
            </div>
          </>
        ) : (
          <div style={s.overlay}>
            <div style={s.offIcon}>
              <CameraOff size={28} color="var(--text3)" />
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text3)' }}>Camera is off</div>
          </div>
        )}
        {loading && (
          <div style={s.loading}>
            <div style={s.spinner} />
          </div>
        )}
      </div>

      <div style={s.controls}>
        <button style={s.btn(active, active ? '#dc2626' : null)} onClick={() => { setActive(!active); setResult(null); }}>
          {active ? <CameraOff size={14} /> : <Camera size={14} />}
          {active ? 'Stop' : 'Start Camera'}
        </button>

        {active && (
          <>
            <button style={s.snapBtn} onClick={capture} disabled={loading}>
              <Zap size={14} />
              {loading ? 'Detecting...' : 'Detect Now'}
            </button>
            <button style={s.btn(autoDetect)} onClick={() => setAutoDetect(!autoDetect)}>
              Auto ({autoDetect ? 'ON' : 'OFF'})
            </button>
            <button style={s.btn(false)} onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}>
              <FlipHorizontal size={14} />
              Flip
            </button>
          </>
        )}
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <DetectionResult result={result} />
        </div>
      )}
    </div>
  );
}
