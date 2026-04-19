import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, RefreshCw, Lock, TrendingUp, MessageSquare, Cpu, AlertTriangle } from 'lucide-react';
import { getAdminStats, getFeedbackQueue, approveFeedback, rejectFeedback, triggerRetrain, adminLogin } from '../api';

const s = {
  page: { paddingTop: '80px', minHeight: '100vh' },
  wrap: { maxWidth: 1000, margin: '0 auto', padding: '40px 20px 80px' },
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
    borderRadius: 'var(--radius-lg)', padding: '32px',
    textAlign: 'center',
  },
  loginIcon: {
    width: 56, height: 56, borderRadius: 16,
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  input: {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 10, color: 'var(--text)',
    fontSize: '14px', marginBottom: '12px',
  },
  loginBtn: {
    width: '100%', padding: '11px',
    background: 'var(--green3)', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  error: { color: 'var(--red)', fontSize: '12px', marginTop: '8px' },

  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    gap: '12px', marginBottom: '28px',
  },
  statCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '18px',
  },
  statLabel: { fontSize: '11px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statNum: { fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: 'var(--green)', fontWeight: 500 },

  section: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '20px',
  },
  sectionHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-head)', fontWeight: 700,
    fontSize: '0.9rem', color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  retrainBtn: (ready) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 16px', borderRadius: 8,
    background: ready ? 'var(--green3)' : 'var(--surface2)',
    color: ready ? '#fff' : 'var(--text3)',
    border: `1px solid ${ready ? 'transparent' : 'var(--border)'}`,
    fontSize: '12px', fontWeight: 600, cursor: ready ? 'pointer' : 'not-allowed',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
  }),

  fbItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 20px', borderBottom: '1px solid var(--border)',
  },
  fbThumb: {
    width: 48, height: 48, borderRadius: 8,
    objectFit: 'cover', background: 'var(--bg3)',
    flexShrink: 0,
  },
  fbInfo: { flex: 1 },
  fbClass: { fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' },
  fbCorrect: { fontSize: '12px', color: 'var(--green)' },
  fbTime: { fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' },
  approveBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: 7,
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.2)',
    color: 'var(--green)', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
  },
  rejectBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: 7,
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    color: 'var(--red)', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
  },
  empty: {
    padding: '40px', textAlign: 'center',
    fontSize: '13px', color: 'var(--text3)',
  },
  progressWrap: { padding: '20px' },
  progressRow: { marginBottom: '14px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' },
  progressTrack: { height: 6, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' },
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
    } catch (e) {
      if (e.response?.status === 401) {
        setToken('');
        localStorage.removeItem('admin_token');
      }
    }
    setRefreshing(false);
  };

  useEffect(() => { if (token) load(); }, [token]);

  const handleApprove = async (id) => {
    await approveFeedback(token, id);
    setQueue(q => q.filter(f => f.id !== id));
    setStats(s => s ? { ...s, approved_corrections: (s.approved_corrections || 0) + 1 } : s);
  };

  const handleReject = async (id) => {
    await rejectFeedback(token, id);
    setQueue(q => q.filter(f => f.id !== id));
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await triggerRetrain(token);
      alert('Retraining triggered! Check your training server.');
    } catch { alert('Failed to trigger retrain.'); }
    setRetraining(false);
  };

  if (!token) return (
    <div style={s.page}>
      <LoginForm onLogin={handleLogin} />
    </div>
  );

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
          <div style={s.sub}>Review feedback, monitor model performance, trigger retraining.</div>
        </div>

        {/* Stats */}
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

        {/* Retrain progress */}
        <div style={s.section}>
          <div style={s.sectionHead}>
            <div style={s.sectionTitle}>
              <Cpu size={14} color="var(--green)" />
              Retraining Pipeline
            </div>
            <button
              style={s.retrainBtn(retrainReady && !retraining)}
              onClick={handleRetrain}
              disabled={!retrainReady || retraining}
            >
              <RefreshCw size={12} style={retraining ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {retraining ? 'Triggering...' : retrainReady ? 'Trigger Retrain' : `${approved}/500 corrections needed`}
            </button>
          </div>
          <div style={s.progressWrap}>
            <div style={s.progressRow}>
              <div style={s.progressLabel}>
                <span>Approved corrections collected</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: retrainReady ? 'var(--green)' : 'var(--text2)' }}>
                  {approved} / 500
                </span>
              </div>
              <div style={s.progressTrack}>
                <div style={{
                  height: '100%', width: `${retrainPct}%`,
                  background: retrainReady ? 'var(--green2)' : 'var(--green-dim)',
                  borderRadius: 99, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
            {retrainReady && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)', marginTop: '8px' }}>
                <CheckCircle size={12} />
                Enough data collected! Model is ready for retraining.
              </div>
            )}
            {!retrainReady && (
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
                Collect {500 - approved} more approved corrections to unlock retraining.
              </div>
            )}
          </div>
        </div>

        {/* Feedback queue */}
        <div style={s.section}>
          <div style={s.sectionHead}>
            <div style={s.sectionTitle}>
              <MessageSquare size={14} color="var(--green)" />
              Feedback Queue
              <span style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 99, padding: '1px 8px', fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                {queue.length} pending
              </span>
            </div>
            <button
              style={{ ...s.approveBtn, background: 'transparent' }}
              onClick={load}
            >
              <RefreshCw size={11} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
              Refresh
            </button>
          </div>

          {queue.length === 0 ? (
            <div style={s.empty}>
              <CheckCircle size={28} color="var(--green)" style={{ margin: '0 auto 8px', display: 'block' }} />
              No pending feedback. All caught up!
            </div>
          ) : (
            queue.map(item => (
              <div key={item.id} style={s.fbItem}>
                {item.image_url && (
                  <img src={item.image_url} alt="" style={s.fbThumb} />
                )}
                <div style={s.fbInfo}>
                  <div style={s.fbClass}>
                    Model predicted: <strong>{item.predicted_class?.replace(/_/g, ' ')}</strong>
                  </div>
                  <div style={s.fbCorrect}>
                    ✓ Correct class: {item.correct_class?.replace(/_/g, ' ')}
                  </div>
                  <div style={s.fbTime}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
