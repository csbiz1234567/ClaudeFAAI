// Helper functions for the Singapore FA App

export const toNum = (val, def = 0) => {
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? def : n;
};

export const fmtSGD = (amt) => {
  const num = typeof amt === 'number' ? amt : toNum(amt, 0);
  return `SGD $${num.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const parseDob = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

export const monthsSinceDob = (dob, refYear, refMonth) => {
  const dobYear = dob.getFullYear();
  const dobMonth = dob.getMonth();
  return (refYear - dobYear) * 12 + (refMonth - dobMonth);
};
