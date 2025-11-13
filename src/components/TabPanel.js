import React from 'react';

// Panel that shows only if active
const TabPanel = ({ active, children }) => (
  <div style={{ display: active ? 'block' : 'none' }}>{children}</div>
);

export default TabPanel;
