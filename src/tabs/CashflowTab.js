import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD, monthNames, parseDob, monthsSinceDob } from '../utils/helpers.js';
import Card from '../components/Card.js';

const CashflowTab = ({ cpfData, expenses, setExpenses, cashflowData, profile, customExpenses, setCustomExpenses }) => {
// Projection settings
const [currentSavings, setCurrentSavings] = useState(’’);
const [projectToAge, setProjectToAge] = useState(‘100’);
const [viewMode, setViewMode] = useState(‘summary’); // ‘summary’ or ‘monthly’

// Bank interest rate for savings (Singapore banks offer 0.05% to 4%+)
const [bankInterestRate, setBankInterestRate] = useState(‘0.05’); // Default 0.05% for normal deposits

// Additional income sources
const [additionalIncomes, setAdditionalIncomes] = useState([]);

// Withdrawals
const [withdrawals, setWithdrawals] = useState([]);

const currentAge = Math.floor((new Date() - new Date(profile.dob)) / (365.25 * 24 * 60 * 60 * 1000));
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

// Add income
const addIncome = () => {
setAdditionalIncomes([…additionalIncomes, {
id: Date.now(),
name: ‘’,
amount: ‘’,
type: ‘recurring’, // ‘recurring’ or ‘onetime’
frequency: ‘monthly’, // ‘monthly’, ‘quarterly’, ‘yearly’
startAge: currentAge,
startMonth: currentMonth,
endAge: null // null means indefinite
}]);
};

const removeIncome = (id) => {
setAdditionalIncomes(additionalIncomes.filter(i => i.id !== id));
};

const updateIncome = (id, field, value) => {
setAdditionalIncomes(additionalIncomes.map(i =>
i.id === id ? { …i, [field]: value } : i
));
};

// Add withdrawal
const addWithdrawal = () => {
setWithdrawals([…withdrawals, {
id: Date.now(),
name: ‘’,
amount: ‘’,
type: ‘onetime’, // ‘onetime’ or ‘recurring’
frequency: ‘monthly’, // ‘monthly’, ‘quarterly’, ‘yearly’
startAge: currentAge,
startMonth: currentMonth
}]);
};

const removeWithdrawal = (id) => {
setWithdrawals(withdrawals.filter(w => w.id !== id));
};

const updateWithdrawal = (id, field, value) => {
setWithdrawals(withdrawals.map(w =>
w.id === id ? { …w, [field]: value } : w
));
};

// Calculate monthly projection
const monthlyProjection = useMemo(() => {
if (!cashflowData) return [];

const targetAge = parseInt(projectToAge) || 100;
const totalMonths = Math.max(1, (targetAge - currentAge) * 12);
const projection = [];

let balance = toNum(currentSavings, 0);
const monthlyInterestRate = toNum(bankInterestRate, 0) / 100 / 12; // Convert annual % to monthly decimal

for (let m = 0; m < totalMonths; m++) {
  const ageAtMonth = currentAge + (m / 12);
  const monthIndex = (currentMonth + m) % 12;
  const yearOffset = Math.floor((currentMonth + m) / 12);
  const year = currentYear + yearOffset;
  
  // Apply interest on existing balance at the start of the month
  const interestEarned = balance * monthlyInterestRate;
  balance += interestEarned;
  
  // Base income and expenses
  let monthIncome = cashflowData.monthlySavings; // This is already net (take-home - expenses)
  let monthExpense = 0;
  let additionalIncome = 0;
  let withdrawalAmount = 0;
  
  // Check additional incomes
  additionalIncomes.forEach(income => {
    const incomeStartMonth = (parseInt(income.startAge) - currentAge) * 12 + (parseInt(income.startMonth) - currentMonth);
    const incomeEndMonth = income.endAge ? (parseInt(income.endAge) - currentAge) * 12 + 11 : Infinity;
    
    if (m >= incomeStartMonth && m <= incomeEndMonth) {
      if (income.type === 'onetime' && m === incomeStartMonth) {
        additionalIncome += toNum(income.amount, 0);
      } else if (income.type === 'recurring') {
        let shouldAdd = false;
        const monthsSinceStart = m - incomeStartMonth;
        
        switch (income.frequency) {
          case 'monthly':
            shouldAdd = true;
            break;
          case 'quarterly':
            shouldAdd = monthsSinceStart % 3 === 0;
            break;
          case 'yearly':
            shouldAdd = monthsSinceStart % 12 === 0;
            break;
        }
        
        if (shouldAdd) {
          additionalIncome += toNum(income.amount, 0);
        }
      }
    }
  });
  
  // Check withdrawals
  withdrawals.forEach(withdrawal => {
    const withdrawalStartMonth = (parseInt(withdrawal.startAge) - currentAge) * 12 + (parseInt(withdrawal.startMonth) - currentMonth);
    
    if (withdrawal.type === 'onetime' && m === withdrawalStartMonth) {
      withdrawalAmount += toNum(withdrawal.amount, 0);
    } else if (withdrawal.type === 'recurring' && m >= withdrawalStartMonth) {
      let shouldWithdraw = false;
      const monthsSinceStart = m - withdrawalStartMonth;
      
      switch (withdrawal.frequency) {
        case 'monthly':
          shouldWithdraw = true;
          break;
        case 'quarterly':
          shouldWithdraw = monthsSinceStart % 3 === 0;
          break;
        case 'yearly':
          shouldWithdraw = monthsSinceStart % 12 === 0;
          break;
      }
      
      if (shouldWithdraw) {
        withdrawalAmount += toNum(withdrawal.amount, 0);
      }
    }
  });
  
  const netCashflow = monthIncome + additionalIncome - withdrawalAmount;
  balance += netCashflow;
  
  projection.push({
    month: m,
    age: Math.floor(ageAtMonth),
    ageDecimal: ageAtMonth,
    monthName: monthNames[monthIndex],
    year: year,
    monthIndex: monthIndex,
    baseIncome: monthIncome,
    additionalIncome: additionalIncome,
    totalIncome: monthIncome + additionalIncome,
    withdrawal: withdrawalAmount,
    interestEarned: interestEarned,
    netCashflow: netCashflow,
    balance: balance
  });
}

return projection;

}, [cashflowData, currentSavings, projectToAge, currentAge, currentMonth, currentYear, additionalIncomes, withdrawals, bankInterestRate]);

const finalBalance = monthlyProjection.length > 0 ? monthlyProjection[monthlyProjection.length - 1].balance : 0;
const totalIncome = monthlyProjection.reduce((sum, m) => sum + m.totalIncome, 0);
const totalWithdrawals = monthlyProjection.reduce((sum, m) => sum + m.withdrawal, 0);
const totalInterestEarned = monthlyProjection.reduce((sum, m) => sum + m.interestEarned, 0);

if (!cashflowData) {
return (
<div style={{ padding: 20 }}>
<Card title="⚠️ Profile Required" value="Please complete your profile information first" tone="warn" />
</div>
);
}

export default CashflowTab;
