import React from 'react';

// Label+select combo
const LabeledSelect = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>{label}</div>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14 }}>
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default LabeledSelect;
