import React from 'react';

// Tab button for switching between panels
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '12px 20px',
      border: 'none',
      borderBottom: active ? '3px solid #667eea' : '3px solid transparent',
      background: active ? 'linear-gradient(180deg, #f0f4ff 0%, #fff 100%)' : 'transparent',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: active ? 700 : 500,
      color: active ? '#667eea' : '#6B7280',
      borderRadius: '8px 8px 0 0',
    }}
  >
    {children}
  </button>
);

export default TabButton;
