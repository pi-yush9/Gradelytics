import React from 'react';
import { Menu, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, title }) => {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Toggle Navigation"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#172554' }}>
            {title || 'Academic Analytics Platform'}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link to="/predict" className="btn btn-primary btn-sm">
          <Sparkles size={14} />
          <span>Quick Predict</span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            backgroundColor: '#F1F5F9',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#334155',
          }}
        >
          <BookOpen size={14} color="#2563EB" />
          <span>BCA Academic Portal</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
