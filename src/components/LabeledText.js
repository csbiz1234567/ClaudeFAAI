import React from 'react';

// Label+text field combo
const LabeledText = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: '2px solid #e5e7eb',
        borderRadius: 8,
        fontSize: 14,
      }}
    />
  </div>
);

export default LabeledText;
