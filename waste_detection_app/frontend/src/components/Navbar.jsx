import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, ShieldCheck } from 'lucide-react';

const s = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '60px',
    background: 'rgba(10,15,10,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem',
    color: 'var(--green)',
    letterSpacing: '-0.02em',
  },
  logoIcon: {
    width: 32, height: 32,
    background: 'rgba(74,222,128,0.15)',
    border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  links: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  link: (active) => ({
    fontSize: '13px', fontWeight: 500,
    color: active ? 'var(--green)' : 'var(--text3)',
    padding: '4px 12px', borderRadius: 6,
    background: active ? 'rgba(74,222,128,0.1)' : 'transparent',
    border: active ? '1px solid rgba(74,222,128,0.2)' : '1px solid transparent',
    transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '6px',
  }),
  badge: {
    background: 'rgba(74,222,128,0.15)',
    border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 99, padding: '2px 8px',
    fontSize: '11px', color: 'var(--green)',
    fontFamily: 'var(--font-mono)',
  }
};

export default function Navbar() {
  const loc = useLocation();
  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}>
        <div style={s.logoIcon}>
          <Recycle size={16} color="var(--green)" />
        </div>
        WasteAI
        <span style={s.badge}>v1.0</span>
      </Link>
      <div style={s.links}>
        <Link to="/" style={s.link(loc.pathname === '/')}>
          Detect
        </Link>
        <Link to="/admin" style={s.link(loc.pathname === '/admin')}>
          <ShieldCheck size={13} />
          Admin
        </Link>
      </div>
    </nav>
  );
}
