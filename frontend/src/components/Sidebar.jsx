import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  History,
  BarChart3,
  Cpu,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Predict Marks', path: '/predict', icon: BrainCircuit, highlight: true },
  { name: 'Prediction History', path: '/history', icon: History },
  { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  { name: 'ML Model Architecture', path: '/model-info', icon: Cpu },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'transform 0.25s ease',
          ...(window.innerWidth <= 1024
            ? {
                position: 'fixed',
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
              }
            : {}),
        }}
      >
        {/* Sidebar Header / Logo */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Logo size={32} />
          {/* Mobile close button */}
          <button
            onClick={onClose}
            style={{
              display: window.innerWidth <= 1024 ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 12px 10px',
            }}
          >
            Academic Workspace
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth <= 1024) onClose();
                  }}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#2563EB' : '#334155',
                    backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                    borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: 'white',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#172554',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.full_name || 'Educator'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email || 'educator@gradelytics.com'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', justifyContent: 'center', gap: '8px', color: '#EF4444' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
