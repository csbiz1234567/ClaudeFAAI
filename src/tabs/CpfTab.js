import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD, monthNames, parseDob, monthsSinceDob } from '../utils/helpers.js';
import Card from '../components/Card.js';

const CpfTab = ({ cpfData, age }) => {
// State for current CPF balances
const [currentBalances, setCurrentBalances] = useState({
oa: ‘’,
sa: ‘’,
ma: ‘’
});

// State for CPF withdrawals/usage
const [cpfWithdrawals, setCpfWithdrawals] = useState([]);

// Add withdrawal
const addWithdrawal = () => {
setCpfWithdrawals([…cpfWithdrawals, {
id: Date.now(),
purpose: ‘’,
account: ‘oa’, // ‘oa’, ‘sa’, or ‘ma’
amount: ‘’,
date: new Date().toISOString().split(‘T’)[0],
type: ‘onetime’, // ‘onetime’ or ‘recurring’
frequency: ‘monthly’ // for recurring
}]);
};

const removeWithdrawal = (id) => {
setCpfWithdrawals(cpfWithdrawals.filter(w => w.id !== id));
};

const updateWithdrawal = (id, field, value) => {
setCpfWithdrawals(cpfWithdrawals.map(w =>
w.id === id ? { …w, [field]: value } : w
));
};

// Calculate projected monthly balances
const monthlyProjection = useMemo(() => {
if (!cpfData) return null;

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const projectionMonths = Math.min(360, (85 - Math.round(age)) * 12); // Project up to age 85 or 30 years

let oaBalance = toNum(currentBalances.oa, 0);
let saBalance = toNum(currentBalances.sa, 0);
let maBalance = toNum(currentBalances.ma, 0);

const projection = [];

for (let m = 0; m <= projectionMonths; m++) {
  const monthAge = age + (m / 12);
  const year = currentYear + Math.floor((currentMonth + m) / 12);
  const month = (currentMonth + m) % 12;
  
  // STEP 1: Add monthly contributions (if not first month)
  if (m > 0) {
    oaBalance += cpfData.oa;
    saBalance += cpfData.sa;
    maBalance += cpfData.ma;
  }
  
  // STEP 2: Apply interest FIRST (in January, for previous year's balance)
  // CPF actually credits interest in January, not December
  if (m > 0 && month === 0) { // January = month 0
    oaBalance *= 1.025;
    saBalance *= 1.04;
    maBalance *= 1.04;
  }
  
  // STEP 3: Apply withdrawals AFTER contributions and interest
  cpfWithdrawals.forEach(w => {
    const withdrawalDate = new Date(w.date);
    const withdrawalYear = withdrawalDate.getFullYear();
    const withdrawalMonth = withdrawalDate.getMonth();
    
    if (w.type === 'onetime') {
      // Check if this month matches withdrawal date
      if (year === withdrawalYear && month === withdrawalMonth) {
        const amount = toNum(w.amount, 0);
        if (w.account === 'oa') oaBalance = Math.max(0, oaBalance - amount);
        else if (w.account === 'sa') saBalance = Math.max(0, saBalance - amount);
        else if (w.account === 'ma') maBalance = Math.max(0, maBalance - amount);
      }
    } else if (w.type === 'recurring') {
      // Apply recurring withdrawal based on frequency
      const monthsSinceWithdrawal = (year - withdrawalYear) * 12 + (month - withdrawalMonth);
      if (monthsSinceWithdrawal >= 0) {
        let shouldWithdraw = false;
        if (w.frequency === 'monthly') shouldWithdraw = true;
        else if (w.frequency === 'quarterly' && monthsSinceWithdrawal % 3 === 0) shouldWithdraw = true;
        else if (w.frequency === 'yearly' && monthsSinceWithdrawal % 12 === 0) shouldWithdraw = true;
        
        if (shouldWithdraw) {
          const amount = toNum(w.amount, 0);
          if (w.account === 'oa') oaBalance = Math.max(0, oaBalance - amount);
          else if (w.account === 'sa') saBalance = Math.max(0, saBalance - amount);
          else if (w.account === 'ma') maBalance = Math.max(0, maBalance - amount);
        }
      }
    }
  });
  
  projection.push({
    month: m,
    age: Math.round(monthAge), // Fixed: Remove decimal from age
    ageDecimal: monthAge, // Keep decimal for calculations
    year,
    monthLabel: monthNames[month],
    ageLabel: `Age ${Math.round(monthAge)}`,
    oa: oaBalance,
    sa: saBalance,
    ma: maBalance,
    total: oaBalance + saBalance + maBalance,
    monthlyContribution: m === 0 ? 0 : cpfData.total,
    isInterestMonth: month === 0 && m > 0 // Flag for January (interest month)
  });
}

return projection;

}, [cpfData, age, currentBalances, cpfWithdrawals]);

if (!cpfData) {
return (
<div style={{ padding: 20 }}>
<Card title="⚠️ Profile Required" value="Please complete your profile information first" tone="warn" />
</div>
);
}

export default CpfTab;
