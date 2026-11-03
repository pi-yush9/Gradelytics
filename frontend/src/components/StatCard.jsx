import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = '#2563EB', bgColor = '#EFF6FF' }) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: bgColor,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#172554', marginTop: '2px', lineHeight: 1.2 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
