import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, RefreshCw, Lock, MessageSquare, Cpu, Tag } from 'lucide-react';
import { getAdminStats, getFeedbackQueue, approveFeedback, rejectFeedback, triggerRetrain, adminLogin } from '../api';
import { formatClassName, getBadgeMeta } from '../constants/waste';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const s = {
  page: { paddingTop: '80px', minHeight: '100vh' },
  wrap: { maxWidth: 1080, margin: '0 auto', padding: '40px 20px 80px' },
  header: { marginBottom: '32px' },
  h1: {
    fontFamily: 'var(--font-head)', fontWeight: 800,
    fontSize: '1.8rem', color: 'var(--text)',
    letterSpacing: '-0.03em', marginBottom: '6px',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  sub: { fontSize: '13px', color: 'var(--text3)' },
  loginBox: {
    maxWidth: 380, margin: '80px auto',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center',
  },
  loginIcon: {
    width: 56, height: 56, borderRadius: 16,
    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  },
  input: {
    width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 10, color: 'var(--text)', fontSize: '14px', marginBottom: '12px',
  },
  loginBtn: {
    width: '100%', padding: '11px', background: 'var(--green3)', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  error: { color: 'var(--red)', fontSize: '12px', marginTop: '8px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '28px' },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px' },
  statLabel: { fontSize: '11px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statNum: { fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: 'var(--green)', fontWeight: 500 },
  section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '20px' },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  sectionTitle: { fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' },
  retrainBtn: (ready) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 8,
    background: ready ? 'var(--green3)' : 'var(--surface2)', color: ready ? '#fff' : 'var(--text3)',
    border: `1px solid ${ready ? 'transparent' : 'var(--border)'}`,
    fontSize: '12px', fontWeight: 600, cursor: ready ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)',
  }),
  queueItem: (focused) => ({
    display: 'grid', gridTemplateColumns: '80px minmax(0,1fr) auto', gap: '14px', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border)', outline: 'none',
    background: focused ? 'rgba(74,222,128,0.05)' : 'transparent',
  }),
  thumb: { width: 80, height: 80, borderRadius: 12, objectFit: 'cover', background: 'var(--bg3)' },
  info: { display: 'grid', gap: '8px' },
  title: { fontSize: '13px', color: 'var(--text)', fontWeight: 600 },
  meta: { fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' },
  badges: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  badge: (style) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 999,
    background: style.bg, color: style.text, border: `1px solid ${style.border}`, fontSize: '11px', fontWeight: 700,
  }),
  notes: { fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 },
  controls: { display: 'flex', gap: '8px', alignItems: 'center' },
  approveBtn: {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 8,
    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: 'var(--green)',
    fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  rejectBtn: {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 8,
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)',
    fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  empty: { padding: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' },
  progressWrap: { padding: '20px' },
  progressRow: { marginBottom: '14px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' },
  progressTrack: { height: 6, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' },
  shortcut: { fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' },
};

function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(password);
      onLogin(res.token);
    } catch {
      setError('Incorrect password. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={s.loginBox}>
      <div style={s.loginIcon}>
        <Lock size={24} color="var(--green)" />
      </div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Admin Access</div>
      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>Enter admin password to continue</div>
      <input
        type="password" placeholder="Password" style={s.input}
        value={password} onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
      />
      <button style={s.loginBtn} onClick={handleLogin} disabled={loading}>
        {loading ? 'Verifying...' : 'Login'}
      </button>
      {error && <div style={s.error}>{error}</div>}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [retraining, setRetraining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [focusedId, setFocusedId] = useState(null);

  const handleLogin = (t) => {
    setToken(t);
    localStorage.setItem('admin_token', t);
  };

  const load = async () => {
    setRefreshing(true);
    try {
      const [st, fb] = await Promise.all([getAdminStats(token), getFeedbackQueue(token)]);
      setStats(st);
      setQueue(fb.feedback || []);
      setFocusedId((fb.feedback || [])[0]?.id || null);
    } catch (e) {
      if (e.response?.status === 401) {
        setToken('');
        localStorage.removeItem('admin_token');
      }
    }
    setRefreshing(false);
  };

  useEffect(() => { if (token) load(); }, [token]);

  useEffect(() => {
    if (!queue.length) return;
    const handleKeydown = async (event) => {
      if (!focusedId) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (event.key.toLowerCase() === 'a') {
        await handleApprove(focusedId);
      }
      if (event.key.toLowerCase() === 'r') {
        await handleReject(focusedId);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [focusedId, queue, token]);

  const handleApprove = async (id) => {
    await approveFeedback(token, id);
    setQueue((q) => q.filter((f) => f.id !== id));
    setStats((prev) => prev ? { ...prev, approved_corrections: (prev.approved_corrections || 0) + 1 } : prev);
    setFocusedId((prev) => prev === id ? queue.find((item) => item.id !== id)?.id || null : prev);
  };

  const handleReject = async (id) => {
    await rejectFeedback(token, id);
    setQueue((q) => q.filter((f) => f.id !== id));
    setFocusedId((prev) => prev === id ? queue.find((item) => item.id !== id)?.id || null : prev);
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await triggerRetrain(token);
      alert('Retraining triggered! Check your training server.');
    } catch {
      alert('Failed to trigger retrain.');
    }
    setRetraining(false);
  };

  if (!token) {
    return <div style={s.page}><LoginForm onLogin={handleLogin} /></div>;
  }

  const approved = stats?.approved_corrections || 0;
  const retrainReady = approved >= 500;
  const retrainPct = Math.min((approved / 500) * 100, 100);

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.header}>
          <div style={s.h1}>
            <ShieldCheck size={24} color="var(--green)" />
            Admin Panel
          </div>
          <div style={s.sub}>Review feedback, monitor model performance, and curate the next training cycle.</div>
        </div>

        {stats && (
          <div style={s.statsGrid}>
            {[
              { label: 'Total Predictions', value: stats.total_predictions || 0 },
              { label: 'Feedback Received', value: stats.total_feedback || 0 },
              { label: 'Approved', value: stats.approved_corrections || 0 },
              { label: 'Model Version', value: `v${stats.model_version || 1}` },
            ].map(({ label, value }) => (
              <div key={label} style={s.statCard}>
                <div style={s.statLabel}>{label}</div>
                <div style={s.statNum}>{value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        <div style={s.section}>
          <div style={s.sectionHead}>
            <div style={s.sectionTitle}>
              <Cpu size={14} color="var(--green)" />
              Retraining Pipeline
            </div>
            <button style={s.retrainBtn(retrainReady && !retraining)} onClick={handleRetrain} disabled={!retrainReady || retraining}>
              <RefreshCw size={12} style={retraining ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {retraining ? 'Triggering...' : retrainReady ? 'Trigger Retrain' : `${approved}/500 corrections needed`}
            </button>
          </div>
          <div style={s.progressWrap}>
            <div style={s.progressRow}>
              <div style={s.progressLabel}>
                <span>Approved corrections collected</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: retrainReady ? 'var(--green)' : 'var(--text2)' }}>{approved} / 500</span>
              </div>
              <div style={s.progressTrack}>
                <div style={{ height: '100%', width: `${retrainPct}%`, background: retrainReady ? 'var(--green2)' : 'var(--green-dim)', borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionHead}>
            <div style={s.sectionTitle}>
              <MessageSquare size={14} color="var(--green)" />
              Feedback Queue
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={s.shortcut}>Shortcuts: A approve, R reject</div>
              <button style={{ ...s.approveBtn, background: 'transparent' }} onClick={load}>
                <RefreshCw size={11} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
                Refresh
              </button>
            </div>
          </div>

          {queue.length === 0 ? (
            <div style={s.empty}>
              <CheckCircle size={28} color="var(--green)" style={{ margin: '0 auto 8px', display: 'block' }} />
              No pending feedback. All caught up!
            </div>
          ) : (
            queue.map((item) => {
              const predictedBadge = getBadgeMeta(item.predicted_class || '');
              const correctBadge = getBadgeMeta(item.correct_class, {
                isNewClass: item.correct_class === '__new_class__',
                isAnnotated: item.correct_class === 'annotated',
              });
              const hasAnnotations = Array.isArray(item.annotations) && item.annotations.length > 0;

              return (
                <div
                  key={item.id}
                  style={s.queueItem(focusedId === item.id)}
                  tabIndex={0}
                  onFocus={() => setFocusedId(item.id)}
                  onClick={() => setFocusedId(item.id)}
                >
                  {item.image_url ? (
                    <img src={`${BASE_URL}${item.image_url}`} alt="feedback" style={s.thumb} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ ...s.thumb, display: 'grid', placeItems: 'center', color: 'var(--text3)' }}>
                      <Tag size={18} />
                    </div>
                  )}

                  <div style={s.info}>
                    <div style={s.title}>Feedback #{item.id}</div>
                    <div style={s.badges}>
                      <span style={s.badge(predictedBadge.style)}>Predicted: {predictedBadge.label}</span>
                      <span style={s.badge(correctBadge.style)}>
                        {item.correct_class === '__new_class__' ? 'NEW CLASS' : item.correct_class === 'annotated' ? 'ANNOTATED' : `Correct: ${correctBadge.label}`}
                      </span>
                      {hasAnnotations && (
                        <span style={s.badge(getBadgeMeta('', { isAnnotated: true }).style)}>
                          {item.annotations.length} box{item.annotations.length > 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                    <div style={s.notes}>
                      Model predicted <strong>{formatClassName(item.predicted_class || 'unknown')}</strong>
                      {item.correct_class !== '__new_class__' && item.correct_class !== 'annotated' && (
                        <span> and the correction is <strong>{formatClassName(item.correct_class || 'unknown')}</strong>.</span>
                      )}
                    </div>
                    {item.correct_class === '__new_class__' && (
                      <div style={s.notes}>
                        Suggested class: <strong>{item.new_class_name || 'unnamed'}</strong><br />
                        {item.new_class_description || 'No description provided.'}
                      </div>
                    )}
                    <div style={s.meta}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</div>
                  </div>

                  <div style={s.controls}>
                    <button style={s.approveBtn} onClick={() => handleApprove(item.id)}>
                      <CheckCircle size={11} />
                      Approve
                    </button>
                    <button style={s.rejectBtn} onClick={() => handleReject(item.id)}>
                      <XCircle size={11} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
