import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshCw,
  Send,
  Square,
  Trash2,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { predictImage, submitFeedback } from '../api';
import DetectionResult from './DetectionResult';
import { CLASS_NAMES, formatClassName } from '../constants/waste';

const OTHER_CLASS_VALUE = '__new_class__';

const s = {
  wrap: { display: 'grid', gap: '18px' },
  toolbar: {
    display: 'grid',
    gap: '12px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
    boxShadow: '0 16px 36px rgba(0,0,0,0.14)',
  },
  toolbarRow: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' },
  label: { fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' },
  modeBtn: (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '10px 14px', borderRadius: 12,
    background: active ? 'rgba(96,165,250,0.14)' : 'rgba(255,255,255,0.015)',
    color: active ? '#bfdbfe' : 'var(--text2)',
    border: `1px solid ${active ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
  }),
  select: {
    width: '100%', padding: '8px 10px',
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 10, color: 'var(--text)', fontSize: '13px',
  },
  input: {
    width: '100%', padding: '8px 10px',
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 10, color: 'var(--text)', fontSize: '13px',
    fontFamily: 'var(--font-body)',
  },
  textarea: {
    width: '100%', minHeight: 84, resize: 'vertical', padding: '8px 10px',
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 10, color: 'var(--text)', fontSize: '13px', fontFamily: 'var(--font-body)',
  },
  buttonRow: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', borderRadius: 12,
    background: 'linear-gradient(135deg, var(--green2), var(--green3))', color: '#fff',
    border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
  secondaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: 12,
    background: 'rgba(255,255,255,0.015)', color: 'var(--text2)',
    border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  message: (ok) => ({
    padding: '10px 12px', borderRadius: 12,
    background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.12)',
    border: `1px solid ${ok ? 'rgba(34,197,94,0.2)' : 'rgba(248,113,113,0.2)'}`,
    color: ok ? 'var(--green)' : 'var(--red)',
    fontSize: '12px',
  }),
  boardWrap: {
    position: 'relative',
    width: '100%',
    minHeight: 300,
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#ffffff',
    boxShadow: '0 18px 40px rgba(0,0,0,0.16)',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    minHeight: 300,
    touchAction: 'none',
    cursor: 'crosshair',
  },
  overlayInfo: {
    position: 'absolute',
    top: 14,
    left: 14,
    padding: '7px 12px',
    borderRadius: 999,
    background: 'rgba(30,41,59,0.8)',
    color: '#fff',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    pointerEvents: 'none',
    boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
  },
  boxList: {
    display: 'grid',
    gap: '10px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px',
    boxShadow: '0 14px 32px rgba(0,0,0,0.12)',
  },
  boxItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) auto',
    gap: '8px',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '10px',
  },
  hintCard: {
    padding: '12px 14px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(74,222,128,0.07))',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text2)',
    fontSize: '13px',
    lineHeight: 1.7,
  },
};

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((res) => res.blob());
}

function normalizeRect(start, current, width, height) {
  const x1 = Math.max(0, Math.min(start.x, current.x));
  const y1 = Math.max(0, Math.min(start.y, current.y));
  const x2 = Math.min(width, Math.max(start.x, current.x));
  const y2 = Math.min(height, Math.max(start.y, current.y));
  return {
    x1: Math.round(x1),
    y1: Math.round(y1),
    x2: Math.round(x2),
    y2: Math.round(y2),
  };
}

export default function DrawCanvas({
  backgroundImage = '',
  defaultMode = 'annotation',
  allowFreeDraw = false,
  onResultChange,
}) {
  const containerRef = useRef(null);
  const baseCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const backgroundImgRef = useRef(null);
  const annotationStartRef = useRef(null);

  const [size, setSize] = useState({ width: 640, height: 420 });
  const [mode, setMode] = useState(defaultMode);
  const [boxes, setBoxes] = useState([]);
  const [activeDraftBox, setActiveDraftBox] = useState(null);
  const [feedbackClass, setFeedbackClass] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageReady, setImageReady] = useState(!backgroundImage);

  const isUploadedAnnotator = Boolean(backgroundImage);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (!backgroundImage) {
      backgroundImgRef.current = null;
      setImageReady(true);
      return;
    }

    setImageReady(false);
    const img = new window.Image();
    img.onload = () => {
      backgroundImgRef.current = img;
      setImageReady(true);
      if (containerRef.current) {
        const width = Math.max(400, Math.floor(containerRef.current.clientWidth));
        const ratio = img.height / img.width || 0.65;
        setSize({ width, height: Math.max(300, Math.floor(width * ratio)) });
      }
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const nextWidth = Math.max(400, Math.floor(containerRef.current.clientWidth));
      if (backgroundImgRef.current) {
        const ratio = backgroundImgRef.current.height / backgroundImgRef.current.width || 0.65;
        setSize({ width: nextWidth, height: Math.max(300, Math.floor(nextWidth * ratio)) });
        return;
      }
      const nextHeight = Math.max(300, Math.floor(nextWidth * 0.65));
      setSize({ width: nextWidth, height: nextHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = baseCanvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    canvas.width = size.width;
    canvas.height = size.height;
    overlay.width = size.width;
    overlay.height = size.height;
    redrawBase();
    redrawOverlay();
  }, [size, imageReady]);

  useEffect(() => {
    redrawBase();
  }, [imageReady]);

  useEffect(() => {
    redrawOverlay();
  }, [boxes, activeDraftBox, mode]);

  useEffect(() => {
    setBoxes([]);
    setResult(null);
    setMessage(null);
  }, [backgroundImage]);

  const serializedAnnotations = useMemo(() => {
    return boxes
      .filter((box) => box.className)
      .map((box) => ({
        bbox: [box.x1, box.y1, box.x2, box.y2],
        class: box.className,
      }));
  }, [boxes]);

  const getPoint = (event) => {
    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * size.width,
      y: ((clientY - rect.top) / rect.height) * size.height,
    };
  };

  const redrawBase = () => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (backgroundImgRef.current) {
      ctx.drawImage(backgroundImgRef.current, 0, 0, canvas.width, canvas.height);
    }
  };

  const redrawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode !== 'annotation') return;

    boxes.forEach((box, index) => {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
      ctx.fillStyle = 'rgba(37,99,235,0.12)';
      ctx.fillRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(box.x1, Math.max(0, box.y1 - 24), 172, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${index + 1}. ${formatClassName(box.className || 'unassigned')}`, box.x1 + 6, Math.max(14, box.y1 - 10));
    });

    if (activeDraftBox) {
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(activeDraftBox.x1, activeDraftBox.y1, activeDraftBox.x2 - activeDraftBox.x1, activeDraftBox.y2 - activeDraftBox.y1);
      ctx.fillStyle = 'rgba(22,163,74,0.1)';
      ctx.fillRect(activeDraftBox.x1, activeDraftBox.y1, activeDraftBox.x2 - activeDraftBox.x1, activeDraftBox.y2 - activeDraftBox.y1);
    }
  };

  const beginAction = (event) => {
    event.preventDefault();
    if (mode !== 'annotation') return;
    const point = getPoint(event);
    annotationStartRef.current = point;
    setActiveDraftBox(normalizeRect(point, point, size.width, size.height));
    setMessage(null);
  };

  const moveAction = (event) => {
    if (mode !== 'annotation' || !annotationStartRef.current) return;
    const point = getPoint(event);
    setActiveDraftBox(normalizeRect(annotationStartRef.current, point, size.width, size.height));
  };

  const endAction = () => {
    if (mode !== 'annotation') return;
    if (annotationStartRef.current && activeDraftBox) {
      const width = activeDraftBox.x2 - activeDraftBox.x1;
      const height = activeDraftBox.y2 - activeDraftBox.y1;
      if (width > 6 && height > 6) {
        setBoxes((prev) => ([...prev, { ...activeDraftBox, className: CLASS_NAMES[0] }]));
      }
    }
    annotationStartRef.current = null;
    setActiveDraftBox(null);
  };

  const clearAll = () => {
    setBoxes([]);
    setResult(null);
    setMessage(null);
  };

  const getCanvasDataUrl = () => baseCanvasRef.current.toDataURL('image/png');

  const handleDetect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const blob = await dataUrlToBlob(getCanvasDataUrl());
      const response = await predictImage(blob);
      setResult(response);
      onResultChange?.(response);
      setMessage({ ok: true, text: isUploadedAnnotator ? 'Uploaded image sent for detection.' : 'Image sent for detection.' });
    } catch (error) {
      setMessage({ ok: false, text: error.response?.data?.detail || 'Detection failed.' });
    }
    setLoading(false);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackClass) return;
    if (feedbackClass === OTHER_CLASS_VALUE && !newClassName.trim()) {
      setMessage({ ok: false, text: 'Enter a suggested class name before submitting.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await submitFeedback({
        predictionId: null,
        predictedClass: isUploadedAnnotator ? 'uploaded_image' : 'annotation_canvas',
        correctClass: feedbackClass,
        imageBase64: getCanvasDataUrl().split(',')[1],
        newClassName,
        newClassDescription,
      });
      setMessage({ ok: true, text: 'Feedback submitted successfully.' });
      setShowFeedbackForm(false);
      setFeedbackClass('');
      setNewClassName('');
      setNewClassDescription('');
    } catch (error) {
      setMessage({ ok: false, text: error.response?.data?.detail || 'Could not submit feedback.' });
    }
    setLoading(false);
  };

  const handleAnnotationSubmit = async () => {
    if (!serializedAnnotations.length) {
      setMessage({ ok: false, text: 'Add at least one annotated box before submitting.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await submitFeedback({
        predictionId: null,
        predictedClass: 'unknown',
        correctClass: 'annotated',
        imageBase64: getCanvasDataUrl().split(',')[1],
        annotations: serializedAnnotations,
      });
      setMessage({ ok: true, text: 'Annotated submission sent successfully.' });
    } catch (error) {
      setMessage({ ok: false, text: error.response?.data?.detail || 'Could not submit annotations.' });
    }
    setLoading(false);
  };

  return (
    <div style={s.wrap}>
      <div style={s.toolbar}>
        <div style={s.toolbarRow}>
          <button style={s.modeBtn(mode === 'annotation')} onClick={() => setMode('annotation')}>
            <Square size={14} />
            Annotation Mode
          </button>
          {isUploadedAnnotator && (
            <span style={{ ...s.label, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={12} />
              Annotating uploaded image directly
            </span>
          )}
        </div>

        <div style={s.hintCard}>
          Drag across each missed object to create a bounding box, then assign the correct class below. This keeps the original image clean while storing the labels separately for your dataset pipeline.
        </div>

        <div style={s.buttonRow}>
          <button style={s.secondaryBtn} onClick={clearAll}>
            <RefreshCw size={14} />
            Clear Boxes
          </button>
          <button style={s.primaryBtn} onClick={handleDetect} disabled={loading || !imageReady}>
            <Zap size={14} />
            {loading ? 'Detecting...' : 'Detect'}
          </button>
          <button style={s.secondaryBtn} onClick={() => setShowFeedbackForm((prev) => !prev)}>
            <Send size={14} />
            Submit as Feedback
          </button>
          <button style={s.primaryBtn} onClick={handleAnnotationSubmit} disabled={loading || !imageReady}>
            <Square size={14} />
            Submit Annotations
          </button>
        </div>

        {showFeedbackForm && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <select style={s.select} value={feedbackClass} onChange={(e) => setFeedbackClass(e.target.value)}>
              <option value="">Select feedback class</option>
              {CLASS_NAMES.map((name) => (
                <option key={name} value={name}>{formatClassName(name)}</option>
              ))}
              <option value={OTHER_CLASS_VALUE}>Suggest New Class</option>
            </select>
            {feedbackClass === OTHER_CLASS_VALUE && (
              <>
                <input style={s.input} value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New class name" />
                <textarea style={s.textarea} value={newClassDescription} onChange={(e) => setNewClassDescription(e.target.value)} placeholder="Describe the new class" />
              </>
            )}
            <div style={s.buttonRow}>
              <button style={s.primaryBtn} onClick={handleFeedbackSubmit} disabled={loading || !feedbackClass}>
                <Send size={14} />
                {loading ? 'Submitting...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        )}

        {message && <div style={s.message(message.ok)}>{message.text}</div>}
      </div>

      <div ref={containerRef} style={s.boardWrap}>
        <canvas ref={baseCanvasRef} style={s.canvas} />
        <canvas
          ref={overlayCanvasRef}
          style={{ ...s.canvas, position: 'absolute', inset: 0, pointerEvents: 'auto' }}
          onMouseDown={beginAction}
          onMouseMove={moveAction}
          onMouseUp={endAction}
          onMouseLeave={endAction}
          onTouchStart={beginAction}
          onTouchMove={moveAction}
          onTouchEnd={endAction}
        />
        <div style={s.overlayInfo}>
          Drag to place labeled bounding boxes on this image
        </div>
      </div>

      <div style={s.boxList}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
          Annotation Boxes ({boxes.length})
        </div>
        {boxes.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
            No boxes yet. Drag across each missed item in the image to create your first annotation.
          </div>
        ) : (
          boxes.map((box, index) => (
            <div key={`${box.x1}-${box.y1}-${index}`} style={s.boxItem}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                  Box {index + 1}: [{box.x1}, {box.y1}, {box.x2}, {box.y2}]
                </div>
                <select
                  style={s.select}
                  value={box.className}
                  onChange={(e) => {
                    const className = e.target.value;
                    setBoxes((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, className } : item));
                  }}
                >
                  {CLASS_NAMES.map((name) => (
                    <option key={name} value={name}>{formatClassName(name)}</option>
                  ))}
                </select>
              </div>
              <button
                style={s.secondaryBtn}
                onClick={() => setBoxes((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {result && <DetectionResult result={result} />}
    </div>
  );
}
