import React from 'react';

export const LogoIcon = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    {/* Background rounded badge */}
    <rect width="36" height="36" rx="8" fill="#172554" />
    
    {/* Academic Mortarboard Cap */}
    <path
      d="M18 7L6 13L18 19L30 13L18 7Z"
      fill="#2563EB"
    />
    <path
      d="M11 15.5V21.5C11 23.5 14.13 25.5 18 25.5C21.87 25.5 25 23.5 25 21.5V15.5"
      stroke="#60A5FA"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M28 14.2V22"
      stroke="#93C5FD"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="28" cy="22.5" r="1.5" fill="#93C5FD" />
    
    {/* Upward Analytics Trend Line / Pulse */}
    <path
      d="M9 29L15 25L20 28L27 20"
      stroke="#38BDF8"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="27" cy="20" r="2" fill="#38BDF8" />
  </svg>
);

export const Logo = ({ size = 32, showWordmark = true, light = false }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <LogoIcon size={size} />
      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: light ? '#FFFFFF' : '#172554',
              lineHeight: 1.1,
            }}
          >
            Grade<span style={{ color: '#2563EB' }}>lytics</span>
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: light ? '#94A3B8' : '#64748B',
              marginTop: '1px',
            }}
          >
            Predict &bull; Perform
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
