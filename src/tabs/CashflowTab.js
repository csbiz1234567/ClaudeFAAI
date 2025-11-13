import React, { useState, useMemo } from 'react';
import { toNum, fmtSGD, monthNames } from '../utils/helpers.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../components/Card.js';
import LabeledText from '../components/LabeledText.js';
import LabeledSelect from '../components/LabeledSelect.js';

const CashflowTab = ({ cpfData, expenses, setExpenses, cashflowData, profile, customExpenses, setCustomExpenses }) => {
// Projection settings
const [currentSavings, setCurrentSavings] = useState('');
const [projectToAge, setProjectToAge] = useState('100');
const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'monthly'

// Bank interest rate for savings (Singapore banks offer 0.05% to 4%+)
const [bankInterestRate, setBankInterestRate] = useState('0.05'); // Default 0.05% for normal deposits

// Additional income sources
const [additionalIncomes, setAdditionalIncomes] = useState([]);

// Withdrawals
const [withdrawals, setWithdrawals] = useState([]);

const currentAge = Math.floor((new Date() - new Date(profile.dob)) / (365.25 * 24 * 60 * 60 * 1000));
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

// Add income
const addIncome = () => {
setAdditionalIncomes([...additionalIncomes, {
id: Date.now(),
name: '',
amount: '',
type: 'recurring', // 'recurring' or 'onetime'
frequency: 'monthly', // 'monthly', 'quarterly', 'yearly'
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
i.id === id ? { ...i, [field]: value } : i
));
};

// Add withdrawal
const addWithdrawal = () => {
setWithdrawals([...withdrawals, {
id: Date.now(),
name: '',
amount: '',
type: 'onetime', // 'onetime' or 'recurring'
frequency: 'monthly', // 'monthly', 'quarterly', 'yearly'
startAge: currentAge,
startMonth: currentMonth
}]);
};

const removeWithdrawal = (id) => {
setWithdrawals(withdrawals.filter(w => w.id !== id));
};

const updateWithdrawal = (id, field, value) => {
setWithdrawals(withdrawals.map(w =>
w.id === id ? { ...w, [field]: value } : w
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

const expenseCategories = [
{ key: 'housing', label: 'Housing' },
{ key: 'food', label: 'Food & Dining' },
{ key: 'transport', label: 'Transport' },
{ key: 'insurance', label: 'Insurance' },
{ key: 'entertainment', label: 'Entertainment' },
{ key: 'others', label: 'Others' }
];

const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
const pieData = expenseCategories
.map((cat, idx) => ({ name: cat.label, value: toNum(expenses[cat.key]), color: pieColors[idx] }))
.filter(item => item.value > 0);

// Add custom expenses to pie data
if (customExpenses && customExpenses.length > 0) {
customExpenses.forEach((exp, idx) => {
if (toNum(exp.amount) > 0) {
pieData.push({
name: exp.name || `Custom ${idx + 1}`,
value: toNum(exp.amount),
color: `hsl(${(idx * 60 + 200) % 360}, 70%, 50%)`
});
}
});
}

return (
<div style={{ padding: 20 }}>
{/* Header */}
<div style={{
background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
border: '2px solid #10b981',
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
}}>
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<div style={{ fontSize: 32 }}>💸</div>
<div style={{ flex: 1 }}>
<h3 style={{ margin: 0, color: '#065f46', fontSize: 20 }}>
{profile.name ? `${profile.name}'s Lifetime Cashflow Projection` : 'Lifetime Cashflow Projection'}
</h3>
<p style={{ margin: '4px 0 0', color: '#065f46', fontSize: 14, opacity: 0.8 }}>
Track monthly income, expenses, savings, and withdrawals from age {currentAge} to {projectToAge}
</p>
</div>
</div>
</div>

  {/* Summary Cards */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
    <Card title="💵 Monthly Take-Home" value={fmtSGD(cashflowData.takeHome)} tone="info" icon="💰" />
    <Card title="🛒 Monthly Expenses" value={fmtSGD(cashflowData.totalExpenses)} tone="danger" icon="📊" />
    <Card 
      title="💎 Monthly Savings" 
      value={fmtSGD(cashflowData.monthlySavings)} 
      tone={cashflowData.monthlySavings >= 0 ? "success" : "danger"} 
      icon="💵" 
    />
    <Card title="📈 Savings Rate" value={`${cashflowData.savingsRate.toFixed(1)}%`} tone="info" icon="📊" />
  </div>

  {/* Projection Settings */}
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>⚙️ Projection Settings</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
      <LabeledText
        label="💰 Current Savings/Balance (SGD)"
        value={currentSavings}
        onChange={setCurrentSavings}
        placeholder="e.g., 50000"
      />
      <LabeledText
        label="🎯 Project Until Age"
        type="number"
        value={projectToAge}
        onChange={setProjectToAge}
        placeholder="100"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>📊 View Mode</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewMode('summary')}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: viewMode === 'summary' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f3f4f6',
              color: viewMode === 'summary' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: viewMode === 'monthly' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f3f4f6',
              color: viewMode === 'monthly' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Monthly
          </button>
        </div>
      </div>
    </div>
    
    {/* Bank Interest Rate Section */}
    <div style={{ marginTop: 20, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #3b82f6' }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: 8 }}>
          🏦 Bank Savings Interest Rate (% p.a.)
        </label>
        <input
          type="number"
          step="0.01"
          value={bankInterestRate}
          onChange={(e) => setBankInterestRate(e.target.value)}
          placeholder="0.05"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '2px solid #3b82f6',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600
          }}
        />
        <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 6 }}>
          Normal deposits: 0.05% | High-yield savings: 2-4%+ during good years
        </div>
      </div>
      
      {/* Quick preset buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setBankInterestRate('0.05')}
          style={{
            padding: '8px 16px',
            background: bankInterestRate === '0.05' ? '#3b82f6' : '#fff',
            color: bankInterestRate === '0.05' ? '#fff' : '#3b82f6',
            border: '2px solid #3b82f6',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Normal (0.05%)
        </button>
        <button
          onClick={() => setBankInterestRate('2')}
          style={{
            padding: '8px 16px',
            background: bankInterestRate === '2' ? '#10b981' : '#fff',
            color: bankInterestRate === '2' ? '#fff' : '#10b981',
            border: '2px solid #10b981',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Savings (2%)
        </button>
        <button
          onClick={() => setBankInterestRate('3')}
          style={{
            padding: '8px 16px',
            background: bankInterestRate === '3' ? '#10b981' : '#fff',
            color: bankInterestRate === '3' ? '#fff' : '#10b981',
            border: '2px solid #10b981',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          High-Yield (3%)
        </button>
        <button
          onClick={() => setBankInterestRate('4')}
          style={{
            padding: '8px 16px',
            background: bankInterestRate === '4' ? '#f59e0b' : '#fff',
            color: bankInterestRate === '4' ? '#fff' : '#f59e0b',
            border: '2px solid #f59e0b',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Premium (4%)
        </button>
        <button
          onClick={() => setBankInterestRate('5')}
          style={{
            padding: '8px 16px',
            background: bankInterestRate === '5' ? '#f59e0b' : '#fff',
            color: bankInterestRate === '5' ? '#fff' : '#f59e0b',
            border: '2px solid #f59e0b',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Exceptional (5%)
        </button>
      </div>
    </div>
    
    {/* Projection Summary */}
    {monthlyProjection.length > 0 && (
      <div style={{ marginTop: 20, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '2px solid #10b981' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#065f46', marginBottom: 4 }}>Starting Balance</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#065f46' }}>{fmtSGD(currentSavings)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#065f46', marginBottom: 4 }}>Total Income</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#065f46' }}>{fmtSGD(totalIncome)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 4 }}>💰 Interest Earned</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{fmtSGD(totalInterestEarned)}</div>
            <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 2 }}>@ {bankInterestRate}% p.a.</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#065f46', marginBottom: 4 }}>Total Withdrawals</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{fmtSGD(totalWithdrawals)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#065f46', marginBottom: 4 }}>Final Balance @ Age {projectToAge}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: finalBalance >= 0 ? '#065f46' : '#dc2626' }}>{fmtSGD(finalBalance)}</div>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Additional Income Sources */}
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>➕ Additional Income / Savings</h3>
      <button
        onClick={addIncome}
        style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
        }}
      >
        + Add Income
      </button>
    </div>
    
    {additionalIncomes.length === 0 ? (
      <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
        No additional income sources. Click "+ Add Income" to add bonuses, investment returns, or other income.
      </div>
    ) : (
      <div style={{ display: 'grid', gap: 12 }}>
        {additionalIncomes.map((income) => (
          <div key={income.id} style={{ padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <LabeledText
                label="Income Name"
                value={income.name}
                onChange={(v) => updateIncome(income.id, 'name', v)}
                placeholder="e.g., Bonus, Investment Return"
              />
              <LabeledText
                label="Amount (SGD)"
                value={income.amount}
                onChange={(v) => updateIncome(income.id, 'amount', v)}
                placeholder="5000"
              />
              <LabeledSelect
                label="Type"
                value={income.type}
                onChange={(v) => updateIncome(income.id, 'type', v)}
                options={[
                  { label: 'One-Time', value: 'onetime' },
                  { label: 'Recurring', value: 'recurring' }
                ]}
              />
              {income.type === 'recurring' && (
                <LabeledSelect
                  label="Frequency"
                  value={income.frequency}
                  onChange={(v) => updateIncome(income.id, 'frequency', v)}
                  options={[
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Quarterly', value: 'quarterly' },
                    { label: 'Yearly', value: 'yearly' }
                  ]}
                />
              )}
              <LabeledText
                label="At Age"
                type="number"
                value={income.startAge}
                onChange={(v) => updateIncome(income.id, 'startAge', v)}
                placeholder={currentAge.toString()}
              />
              <LabeledSelect
                label="In Month"
                value={income.startMonth}
                onChange={(v) => updateIncome(income.id, 'startMonth', v)}
                options={monthNames.map((name, idx) => ({
                  label: name,
                  value: idx.toString()
                }))}
              />
              <button
                onClick={() => removeIncome(income.id)}
                style={{
                  padding: '10px 16px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 8
                }}
              >
                Remove
              </button>
            </div>
            {/* Show event preview */}
            <div style={{ marginTop: 8, padding: 8, background: '#e0f2fe', borderRadius: 4, fontSize: 12, color: '#0c4a6e' }}>
              💡 <strong>Event:</strong> {income.type === 'onetime' ? 'One-time' : income.frequency.charAt(0).toUpperCase() + income.frequency.slice(1)} 
              {' '}{fmtSGD(income.amount)} in {monthNames[parseInt(income.startMonth) || 0]} at age {income.startAge}
              {income.type === 'recurring' && income.frequency !== 'monthly' && `, then every ${income.frequency === 'quarterly' ? '3 months' : 'year'}`}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Withdrawals */}
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>💳 Withdrawals / Expenses</h3>
      <button
        onClick={addWithdrawal}
        style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
        }}
      >
        + Add Withdrawal
      </button>
    </div>
    
    {withdrawals.length === 0 ? (
      <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
        No withdrawals planned. Click "+ Add Withdrawal" to plan car purchases, home renovations, or other expenses.
      </div>
    ) : (
      <div style={{ display: 'grid', gap: 12 }}>
        {withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} style={{ padding: 16, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <LabeledText
                label="Withdrawal Name"
                value={withdrawal.name}
                onChange={(v) => updateWithdrawal(withdrawal.id, 'name', v)}
                placeholder="e.g., Car Purchase, Renovation"
              />
              <LabeledText
                label="Amount (SGD)"
                value={withdrawal.amount}
                onChange={(v) => updateWithdrawal(withdrawal.id, 'amount', v)}
                placeholder="50000"
              />
              <LabeledSelect
                label="Type"
                value={withdrawal.type}
                onChange={(v) => updateWithdrawal(withdrawal.id, 'type', v)}
                options={[
                  { label: 'One-Time', value: 'onetime' },
                  { label: 'Recurring', value: 'recurring' }
                ]}
              />
              {withdrawal.type === 'recurring' && (
                <LabeledSelect
                  label="Frequency"
                  value={withdrawal.frequency}
                  onChange={(v) => updateWithdrawal(withdrawal.id, 'frequency', v)}
                  options={[
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Quarterly', value: 'quarterly' },
                    { label: 'Yearly', value: 'yearly' }
                  ]}
                />
              )}
              <LabeledText
                label="At Age"
                type="number"
                value={withdrawal.startAge}
                onChange={(v) => updateWithdrawal(withdrawal.id, 'startAge', v)}
                placeholder={currentAge.toString()}
              />
              <button
                onClick={() => removeWithdrawal(withdrawal.id)}
                style={{
                  padding: '10px 16px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 8
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Monthly Breakdown Table */}
  {viewMode === 'monthly' && monthlyProjection.length > 0 && (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>📅 Monthly Breakdown</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Date</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Age</th>
              <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Base Income</th>
              <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Additional</th>
              <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Interest</th>
              <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Withdrawals</th>
              <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Net Cashflow</th>
              <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {monthlyProjection.slice(0, 120).map((row, idx) => ( // Show first 10 years
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 12 }}>{row.monthName} {row.year}</td>
                <td style={{ padding: 12 }}>{row.age}</td>
                <td style={{ padding: 12, textAlign: 'right', color: '#10b981' }}>{fmtSGD(row.baseIncome)}</td>
                <td style={{ padding: 12, textAlign: 'right', color: row.additionalIncome > 0 ? '#10b981' : '#6b7280' }}>
                  {row.additionalIncome > 0 ? fmtSGD(row.additionalIncome) : '-'}
                </td>
                <td style={{ padding: 12, textAlign: 'right', color: row.interestEarned > 0 ? '#3b82f6' : '#6b7280' }}>
                  {row.interestEarned > 0 ? fmtSGD(row.interestEarned) : '-'}
                </td>
                <td style={{ padding: 12, textAlign: 'right', color: row.withdrawal > 0 ? '#ef4444' : '#6b7280' }}>
                  {row.withdrawal > 0 ? fmtSGD(row.withdrawal) : '-'}
                </td>
                <td style={{ padding: 12, textAlign: 'right', color: row.netCashflow >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {fmtSGD(row.netCashflow)}
                </td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, color: row.balance >= 0 ? '#065f46' : '#dc2626' }}>
                  {fmtSGD(row.balance)}
                </td>
              </tr>
            ))}
            {monthlyProjection.length > 120 && (
              <tr>
                <td colSpan="8" style={{ padding: 12, textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                  ... and {monthlyProjection.length - 120} more months
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* Expenses Breakdown */}
  <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1F2937' }}>Monthly Expenses</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
      {expenseCategories.map(cat => (
        <LabeledText
          key={cat.key}
          label={cat.label}
          value={expenses[cat.key]}
          onChange={(val) => setExpenses({ ...expenses, [cat.key]: val })}
          placeholder="0"
        />
      ))}
    </div>
    
    {/* Show custom expenses if they exist */}
    {customExpenses && customExpenses.length > 0 && (
      <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginTop: 0, marginBottom: 12 }}>
          ➕ Custom Expenses
        </h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {customExpenses.map(exp => (
            <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{exp.name || 'Unnamed'}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{fmtSGD(exp.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Pie Chart */}
    {pieData.length > 0 && (
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#374151' }}>Expense Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${fmtSGD(entry.value)}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => fmtSGD(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
</div>

);
};


export default CashflowTab;
