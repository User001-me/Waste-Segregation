import React, { useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, ChevronDown, Download, Copy, Send } from 'lucide-react';
import { submitFeedback } from '../api';
import {
  CLASS_NAMES,
  DISPOSAL,
  formatClassName,
  getBadgeMeta,
} from '../constants/waste';

const OTHER_CLASS_VALUE = '__new_class__';

const s = {
  wrap: { animation: 'fadeUp 0.4s ease forwards' },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 14px',
    borderRadius: 10,
    background: 'var(--surface)',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  detHead: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
  },
  rank: {
    width: 28, height: 28, borderRadius: 8,
    background: 'rgba(74,222,128,0.15)',
    border: '1px solid rgba(74,222,128,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)',
    fontWeight: 600, flexShrink: 0,
  },
  className: {
    fontFamily: 'var(--font-head)', fontWeight: 700,
    fontSize: '1rem', color: 'var(--text)', flex: 1,
    textTransform: 'capitalize',
  },
  confBar: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  confNum: {
    fontFamily: 'var(--font-mono)', fontSize: '13px',
    color: 'var(--text)', fontWeight: 500, minWidth: 42,
  },
  barTrack: {
    width: 88, height: 8, background: 'var(--bg3)',
    borderRadius: 99, overflow: 'hidden', position: 'relative',
  },
  detBody: { padding: '14px 18px' },
  groupBadge: (style) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: 99,
    fontSize: '12px', fontWeight: 600,
    border: `1px solid ${style.border}`,
    background: style.bg,
    color: style.text,
    marginBottom: '10px',
  }),
  disposal: {
    fontSize: '13px', color: 'var(--text2)',
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    padding: '10px 12px',
    background: 'var(--bg3)', borderRadius: 8,
    marginBottom: '12px',
  },
  feedbackBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', color: 'var(--text3)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6, padding: '5px 10px',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  feedbackPanel: {
    marginTop: '10px',
    padding: '12px',
    background: 'var(--bg3)',
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  select: {
    width: '100%', padding: '8px 12px',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 8, color: 'var(--text)',
    fontSize: '13px', marginBottom: '8px',
    appearance: 'none',
  },
  input: {
    width: '100%', padding: '9px 12px',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 8, color: 'var(--text)',
    fontSize: '13px', marginBottom: '8px',
    fontFamily: 'var(--font-body)',
  },
  textarea: {
    width: '100%', minHeight: 78, resize: 'vertical', padding: '9px 12px',
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 8, color: 'var(--text)', fontSize: '13px', marginBottom: '8px',
    fontFamily: 'var(--font-body)',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: 8,
    background: 'var(--green3)', color: '#fff',
    fontSize: '13px', fontWeight: 500,
    border: 'none', cursor: 'pointer',
  },
  successMsg: {
    fontSize: '12px', color: 'var(--green)',
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 0',
  },
  errorMsg: {
    fontSize: '12px', color: 'var(--red)',
    paddingTop: '4px',
  },
  bbox: {
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    color: 'var(--text3)', marginTop: '6px',
  }
};

function getBarColor(conf) {
  if (conf > 70) return 'var(--green2)';
  if (conf >= 40) return '#fbbf24';
  return 'var(--red)';
}

function buildSummary(detections) {
  if (!detections?.length) {
    return 'WasteAI detected no waste objects in this image.';
  }

  const parts = detections.map((det) => `${formatClassName(det.class)} (${Math.round(det.confidence * 100)}%)`);
  const firstDisposal = DISPOSAL[detections[0]?.class] || 'Follow local disposal guidelines';
  return `WasteAI detected: ${parts.join(', ')} | Disposal: ${firstDisposal}`;
}

function Detection({ det, index, predictionId }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctClass, setCorrectClass] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const badge = getBadgeMeta(det.class);
  const conf = Math.round(det.confidence * 100);

  const handleSubmit = async () => {
    if (!correctClass) return;
    if (correctClass === OTHER_CLASS_VALUE && !newClassName.trim()) {
      setError('Please enter a suggested class name.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let imageBase64 = '';
      const imgEl = document.querySelector('img[alt="Annotated detection"]');
      if (imgEl && imgEl.src.includes('base64')) {
        imageBase64 = imgEl.src.split(',')[1] || '';
      }

      await submitFeedback({
        predictionId,
        predictedClass: det.class,
        correctClass: correctClass === OTHER_CLASS_VALUE ? OTHER_CLASS_VALUE : correctClass,
        imageBase64,
        newClassName,
        newClassDescription,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not submit feedback.');
    }
    setLoading(false);
  };

  return (
    <div style={s.card}>
      <div style={s.detHead}>
        <div style={s.rank}>#{index + 1}</div>
        <div style={s.className}>{formatClassName(det.class)}</div>
        <div style={s.confBar} title={`${conf}% confidence`}>
          <div style={s.confNum}>{conf}%</div>
          <div style={s.barTrack}>
            <div style={{
              height: '100%', width: `${conf}%`, borderRadius: 99,
              background: getBarColor(conf),
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>
      <div style={s.detBody}>
        <div style={s.groupBadge(badge.style)}>
          {badge.label}
        </div>
        <div style={s.disposal}>
          <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--green)' }} />
          <span>{DISPOSAL[det.class] || 'Follow local disposal guidelines'}</span>
        </div>
        {det.bbox && (
          <div style={s.bbox}>
            bbox: [{det.bbox.map(v => Math.round(v)).join(', ')}]
          </div>
        )}

        {!submitted ? (
          <>
            <button style={s.feedbackBtn} onClick={() => setShowFeedback(!showFeedback)}>
              <AlertTriangle size={12} />
              Wrong detection?
              <ChevronDown size={12} style={{ transform: showFeedback ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showFeedback && (
              <div style={s.feedbackPanel}>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>
                  Select the correct class:
                </div>
                <select style={s.select} value={correctClass} onChange={e => setCorrectClass(e.target.value)}>
                  <option value="">- Select correct class -</option>
                  {CLASS_NAMES.map(c => (
                    <option key={c} value={c}>{formatClassName(c)}</option>
                  ))}
                  <option value={OTHER_CLASS_VALUE}>Other (suggest new class)</option>
                </select>
                {correctClass === OTHER_CLASS_VALUE && (
                  <>
                    <input
                      style={s.input}
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="New class name"
                    />
                    <textarea
                      style={s.textarea}
                      value={newClassDescription}
                      onChange={(e) => setNewClassDescription(e.target.value)}
                      placeholder="Describe the new class"
                    />
                  </>
                )}
                <button style={s.submitBtn} onClick={handleSubmit} disabled={loading || !correctClass}>
                  <Send size={12} />
                  {loading ? 'Submitting...' : 'Submit Correction'}
                </button>
                {error && <div style={s.errorMsg}>{error}</div>}
              </div>
            )}
          </>
        ) : (
          <div style={s.successMsg}>
            <CheckCircle size={14} />
            Thanks! Correction saved for model improvement.
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetectionResult({ result }) {
  const sortedDetections = useMemo(() => {
    return [...(result?.detections || [])].sort((a, b) => b.confidence - a.confidence);
  }, [result]);

  if (!result) return null;
  const { prediction_id, annotated_image } = result;

  const handleDownload = () => {
    if (!annotated_image) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${annotated_image}`;
    link.download = `wasteai-result-${Date.now()}.png`;
    link.click();
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary(sortedDetections));
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.actions}>
        <button style={s.actionBtn} onClick={handleDownload}>
          <Download size={14} />
          Download Result
        </button>
        <button style={s.actionBtn} onClick={handleCopySummary}>
          <Copy size={14} />
          Copy Summary
        </button>
      </div>

      {annotated_image && (
        <div style={{ marginBottom: '20px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img
            src={`data:image/jpeg;base64,${annotated_image}`}
            alt="Annotated detection"
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      )}

      {sortedDetections.length > 0 ? (
        <>
          <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
            {sortedDetections.length} object{sortedDetections.length > 1 ? 's' : ''} detected
          </div>
          {sortedDetections.map((det, i) => (
            <Detection key={`${det.class}-${i}`} det={det} index={i} predictionId={prediction_id} />
          ))}
        </>
      ) : (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          color: 'var(--text3)', fontSize: '14px',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          No waste detected in this image. Try a different angle or image.
        </div>
      )}
    </div>
  );
}
