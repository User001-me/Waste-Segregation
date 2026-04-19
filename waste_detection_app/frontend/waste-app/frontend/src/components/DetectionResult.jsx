import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, ChevronDown, Send } from 'lucide-react';
import { submitFeedback } from '../api';

const CLASS_NAMES = [
  'organic','paper','cardboard','fabric','clothes','leather','rubber',
  'wood','shoe','diaper','hazardous','cigarette_butt','e_waste',
  'injection_vial','iv_fluid_bottle','blood_contaminated','sharp_instruments',
  'syringe','gloves_masks','biomedical','plastic','glass','metal'
];

const GROUP_MAP = {
  organic:'msw',paper:'msw',cardboard:'msw',fabric:'msw',clothes:'msw',
  leather:'msw',rubber:'msw',wood:'msw',shoe:'msw',diaper:'msw',
  hazardous:'hazardous',cigarette_butt:'hazardous',
  e_waste:'ewaste',
  injection_vial:'biomedical',iv_fluid_bottle:'biomedical',
  blood_contaminated:'biomedical',sharp_instruments:'biomedical',
  syringe:'biomedical',gloves_masks:'biomedical',biomedical:'biomedical',
  plastic:'plastic',
  glass:'cnd',metal:'cnd',
};

const GROUP_LABELS = {
  msw: '🏙️ Municipal Solid Waste',
  hazardous: '⚠️ Hazardous Waste',
  ewaste: '⚡ E-Waste',
  biomedical: '🏥 Bio-medical Waste',
  plastic: '🧴 Plastic Waste',
  cnd: '🏗️ Construction & Demolition',
};

const DISPOSAL = {
  organic:'Compost bin / Green bin',
  paper:'Recycling bin — clean & dry',
  cardboard:'Recycling bin — flatten first',
  fabric:'Textile recycling point',
  clothes:'Textile recycling / donation',
  leather:'Specialised recycling',
  rubber:'Rubber recycling facility',
  wood:'Wood recycling / green waste',
  shoe:'Shoe recycling point',
  diaper:'Sealed bag → general waste',
  hazardous:'Hazardous waste facility only',
  cigarette_butt:'Cigarette bin — never litter',
  e_waste:'E-waste drop-off centre',
  injection_vial:'Sharps container → biomedical facility',
  iv_fluid_bottle:'Biomedical waste bag',
  blood_contaminated:'Red biomedical bag — sealed',
  sharp_instruments:'Sharps container immediately',
  syringe:'Sharps container immediately',
  gloves_masks:'Yellow biomedical bag',
  biomedical:'Authorised biomedical disposal',
  plastic:'Recycling bin — rinse first',
  glass:'Glass recycling bin',
  metal:'Metal recycling bin',
};

const s = {
  wrap: { animation: 'fadeUp 0.4s ease forwards' },
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
    color: 'var(--green)', fontWeight: 500, minWidth: 40,
  },
  barTrack: {
    width: 80, height: 6, background: 'var(--bg3)',
    borderRadius: 99, overflow: 'hidden',
  },
  detBody: { padding: '14px 18px' },
  groupBadge: (g) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: 99,
    fontSize: '12px', fontWeight: 500,
    border: '1px solid',
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
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: 8,
    background: 'var(--green3)', color: '#fff',
    fontSize: '13px', fontWeight: 500,
    border: 'none', cursor: 'pointer',
    transition: 'background 0.2s',
  },
  successMsg: {
    fontSize: '12px', color: 'var(--green)',
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 0',
  },
  bbox: {
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    color: 'var(--text3)', marginTop: '6px',
  }
};

function Detection({ det, index, predictionId }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctClass, setCorrectClass] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const group = GROUP_MAP[det.class] || 'msw';
  const conf = Math.round(det.confidence * 100);

  const handleSubmit = async () => {
    if (!correctClass) return;
    setLoading(true);
    try {
      await submitFeedback(predictionId, correctClass);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={s.card}>
      <div style={s.detHead}>
        <div style={s.rank}>#{index + 1}</div>
        <div style={s.className}>{det.class.replace(/_/g, ' ')}</div>
        <div style={s.confBar}>
          <div style={s.confNum}>{conf}%</div>
          <div style={s.barTrack}>
            <div style={{
              height: '100%', width: `${conf}%`, borderRadius: 99,
              background: conf > 70 ? 'var(--green2)' : conf > 40 ? 'var(--amber)' : 'var(--red)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>
      <div style={s.detBody}>
        <div className={`group-${group}`} style={s.groupBadge(group)}>
          {GROUP_LABELS[group]}
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
                  <option value="">— Select correct class —</option>
                  {CLASS_NAMES.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button style={s.submitBtn} onClick={handleSubmit} disabled={loading || !correctClass}>
                  <Send size={12} />
                  {loading ? 'Submitting...' : 'Submit Correction'}
                </button>
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
  if (!result) return null;
  const { detections, prediction_id, annotated_image } = result;

  return (
    <div style={s.wrap}>
      {annotated_image && (
        <div style={{ marginBottom: '20px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img
            src={`data:image/jpeg;base64,${annotated_image}`}
            alt="Annotated detection"
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      )}

      {detections && detections.length > 0 ? (
        <>
          <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
            {detections.length} object{detections.length > 1 ? 's' : ''} detected
          </div>
          {detections.map((det, i) => (
            <Detection key={i} det={det} index={i} predictionId={prediction_id} />
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
