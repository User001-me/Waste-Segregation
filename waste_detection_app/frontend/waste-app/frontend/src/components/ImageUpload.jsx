import React, { useState, useRef, useCallback } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';

const s = {
  zone: (drag) => ({
    border: `2px dashed ${drag ? 'var(--green)' : 'var(--border2)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: drag ? 'rgba(74,222,128,0.05)' : 'var(--surface)',
    position: 'relative',
  }),
  icon: {
    width: 56, height: 56,
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontFamily: 'var(--font-head)', fontWeight: 700,
    fontSize: '1.1rem', color: 'var(--text)',
    marginBottom: '8px',
  },
  sub: { fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: 10,
    background: 'var(--green3)', color: '#fff',
    fontSize: '13px', fontWeight: 600,
    border: 'none', cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'var(--font-body)',
  },
  preview: {
    position: 'relative', borderRadius: 'var(--radius-lg)',
    overflow: 'hidden', border: '1px solid var(--border)',
  },
  previewImg: { width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain', background: 'var(--bg3)' },
  clearBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(0,0,0,0.7)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text)',
  },
  formats: {
    marginTop: '12px', fontSize: '11px', color: 'var(--text3)',
    fontFamily: 'var(--font-mono)',
  }
};

export default function ImageUpload({ onImage, preview, onClear }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onImage(file);
  }, [onImage]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const onInputChange = (e) => handleFile(e.target.files[0]);

  if (preview) {
    return (
      <div style={s.preview}>
        <img src={preview} alt="Preview" style={s.previewImg} />
        <button style={s.clearBtn} onClick={onClear}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={s.zone(dragging)}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef} type="file"
        accept="image/*" capture="environment"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />
      <div style={s.icon}>
        <ImageIcon size={24} color="var(--green)" />
      </div>
      <div style={s.title}>Drop image or tap to upload</div>
      <div style={s.sub}>Works with phone camera, gallery, or any image file</div>
      <button style={s.btn} type="button">
        <Upload size={14} />
        Choose Image
      </button>
      <div style={s.formats}>JPG · PNG · WEBP · HEIC supported</div>
    </div>
  );
}
