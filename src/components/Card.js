import React from 'react';

// A card for summary values, color-coded by tone
const Card = ({ title, value, tone = 'info', icon }) => {
  const toneColors = {
    success: { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '#10B981', text: '#065F46' },
    info: { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '#3B82F6', text: '#1E40AF' },
    warn: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#F59E0B', text: '#92400E' },
    danger: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '#EF4444', text: '#991B1B' },
  };
  const c = toneColors[tone] || toneColors.info;
  return (
    <div style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6, textTransform: 'uppercase' }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {title}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{value}</div>
    </div>
  );
};

export default Card;
