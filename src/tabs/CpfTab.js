import React, { useState, useMemo } from 'react';
import { toNum, fmtSGD, monthNames } from '../utils/helpers.js';
import { getCpfRates } from '../utils/cpf.js';
import Card from '../components/Card.js';
import LineChart from '../components/LineChart.js';
import LabeledText from '../components/LabeledText.js';
import LabeledSelect from '../components/LabeledSelect.js';

const CpfTab = ({ cpfData, age }) => {
// State for current CPF balances
const [currentBalances, setCurrentBalances] = useState({
oa: '',
sa: '',
ma: ''
});

// State for CPF withdrawals/usage
const [cpfWithdrawals, setCpfWithdrawals] = useState([]);

// Add withdrawal
const addWithdrawal = () => {
setCpfWithdrawals([...cpfWithdrawals, {
id: Date.now(),
purpose: '',
account: 'oa', // 'oa', 'sa', or 'ma'
amount: '',
date: new Date().toISOString().split('T')[0],
type: 'onetime', // 'onetime' or 'recurring'
frequency: 'monthly' // for recurring
}]);
};

const removeWithdrawal = (id) => {
setCpfWithdrawals(cpfWithdrawals.filter(w => w.id !== id));
};

const updateWithdrawal = (id, field, value) => {
setCpfWithdrawals(cpfWithdrawals.map(w =>
w.id === id ? { ...w, [field]: value } : w
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

const cpfRates = getCpfRates(age);

return (
<div style={{ padding: 20 }}>
{/* Current Balances Input Section */}
<div style={{
background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
border: '2px solid #3b82f6',
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
}}>
<h3 style={{ marginTop: 0, color: '#1e40af', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
💼 Your Current CPF Balances
</h3>
<p style={{ margin: '0 0 20px 0', color: '#3b82f6', fontSize: 13 }}>
Enter your current CPF account balances to see accurate projections
</p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <div>
        <LabeledText
          label="🏠 Ordinary Account (OA)"
          value={currentBalances.oa}
          onChange={(val) => setCurrentBalances({ ...currentBalances, oa: val })}
          placeholder="e.g., 80000"
        />
        <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>
          For housing, investments, education
        </div>
      </div>
      
      <div>
        <LabeledText
          label="🎯 Special Account (SA)"
          value={currentBalances.sa}
          onChange={(val) => setCurrentBalances({ ...currentBalances, sa: val })}
          placeholder="e.g., 40000"
        />
        <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>
          For retirement only (4% interest)
        </div>
      </div>
      
      <div>
        <LabeledText
          label="🏥 MediSave (MA)"
          value={currentBalances.ma}
          onChange={(val) => setCurrentBalances({ ...currentBalances, ma: val })}
          placeholder="e.g., 30000"
        />
        <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>
          For healthcare expenses (4% interest)
        </div>
      </div>
    </div>
    
    {/* Total Current Balance */}
    {(toNum(currentBalances.oa) + toNum(currentBalances.sa) + toNum(currentBalances.ma)) > 0 && (
      <div style={{ 
        marginTop: 16, 
        padding: 16, 
        background: '#fff', 
        borderRadius: 8,
        border: '2px solid #3b82f6'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>
          💰 Total Current CPF Balance
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1e40af' }}>
          {fmtSGD(toNum(currentBalances.oa) + toNum(currentBalances.sa) + toNum(currentBalances.ma))}
        </div>
      </div>
    )}
  </div>
  
  {/* Monthly Contributions Section */}
  <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1F2937' }}>💵 Monthly CPF Contributions</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmin(200px, 1fr))', gap: 12, marginBottom: 20 }}>
      <Card 
        title={`Employee (${(cpfRates.employee * 100).toFixed(1)}%)`} 
        value={fmtSGD(cpfData.employee)} 
        tone="info" 
        icon="👤" 
      />
      <Card 
        title={`Employer (${(cpfRates.employer * 100).toFixed(1)}%)`} 
        value={fmtSGD(cpfData.employer)} 
        tone="success" 
        icon="🏢" 
      />
      <Card 
        title="Total Monthly CPF" 
        value={fmtSGD(cpfData.total)} 
        tone="info" 
        icon="💰" 
      />
    </div>
    
    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 24, color: '#1F2937' }}>📊 Monthly Account Allocation</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      <div style={{ border: '2px solid #3b82f6', borderRadius: 10, padding: 16, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>Ordinary Account (OA)</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(cpfData.oa)}</div>
        <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4 }}>per month</div>
      </div>
      <div style={{ border: '2px solid #10b981', borderRadius: 10, padding: 16, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>Special Account (SA)</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#065f46' }}>{fmtSGD(cpfData.sa)}</div>
        <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>per month</div>
      </div>
      <div style={{ border: '2px solid #f59e0b', borderRadius: 10, padding: 16, background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>MediSave (MA)</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#92400e' }}>{fmtSGD(cpfData.ma)}</div>
        <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>per month</div>
      </div>
    </div>
  </div>
  
  {/* CPF Withdrawals/Usage Section */}
  <div style={{ 
    background: '#fff', 
    border: '2px solid #f59e0b',
    borderRadius: 12, 
    padding: 24, 
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <h3 style={{ margin: 0, color: '#92400e', fontSize: 18, fontWeight: 700 }}>
          🏠 CPF Withdrawals & Usage
        </h3>
        <p style={{ margin: '4px 0 0', color: '#f59e0b', fontSize: 13 }}>
          Track housing loans, investments, education expenses, etc.
        </p>
      </div>
      <button
        onClick={addWithdrawal}
        style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
        }}
      >
        + Add Withdrawal
      </button>
    </div>
    
    {cpfWithdrawals.length === 0 ? (
      <div style={{ padding: 20, background: '#fef3c7', borderRadius: 8, textAlign: 'center', color: '#92400e' }}>
        No withdrawals tracked yet. Click "Add Withdrawal" to record housing loans, investments, etc.
      </div>
    ) : (
      <div style={{ display: 'grid', gap: 12 }}>
        {cpfWithdrawals.map(w => (
          <div key={w.id} style={{ 
            padding: 16, 
            background: '#fffbeb', 
            border: '1px solid #fde68a',
            borderRadius: 8 
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
              <LabeledText
                label="Purpose"
                value={w.purpose}
                onChange={(val) => updateWithdrawal(w.id, 'purpose', val)}
                placeholder="e.g., Housing loan"
              />
              
              <LabeledSelect
                label="From Account"
                value={w.account}
                onChange={(val) => updateWithdrawal(w.id, 'account', val)}
                options={[
                  { label: '🏠 Ordinary (OA)', value: 'oa' },
                  { label: '🎯 Special (SA)', value: 'sa' },
                  { label: '🏥 MediSave (MA)', value: 'ma' }
                ]}
              />
              
              <LabeledText
                label="Amount"
                value={w.amount}
                onChange={(val) => updateWithdrawal(w.id, 'amount', val)}
                placeholder="50000"
              />
              
              <LabeledText
                label="Date"
                type="date"
                value={w.date}
                onChange={(val) => updateWithdrawal(w.id, 'date', val)}
              />
              
              <LabeledSelect
                label="Type"
                value={w.type}
                onChange={(val) => updateWithdrawal(w.id, 'type', val)}
                options={[
                  { label: 'One-time', value: 'onetime' },
                  { label: 'Recurring', value: 'recurring' }
                ]}
              />
              
              {w.type === 'recurring' && (
                <LabeledSelect
                  label="Frequency"
                  value={w.frequency}
                  onChange={(val) => updateWithdrawal(w.id, 'frequency', val)}
                  options={[
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Quarterly', value: 'quarterly' },
                    { label: 'Yearly', value: 'yearly' }
                  ]}
                />
              )}
            </div>
            
            <button
              onClick={() => removeWithdrawal(w.id)}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
  
  {/* Monthly Account Balance Projection */}
  {monthlyProjection && monthlyProjection.length > 0 && (
    <div style={{ 
      background: '#fff', 
      borderRadius: 12, 
      padding: 24, 
      marginBottom: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: 0, color: '#1F2937', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        📈 CPF Account Balance Projection
      </h3>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Card
          title="Current Total CPF"
          value={fmtSGD(monthlyProjection[0].total)}
          tone="info"
          icon="💰"
        />
        <Card
          title={`Projected at Age ${Math.round(monthlyProjection[monthlyProjection.length - 1].age)}`}
          value={fmtSGD(monthlyProjection[monthlyProjection.length - 1].total)}
          tone="success"
          icon="🎯"
        />
        <Card
          title="Total Growth"
          value={fmtSGD(monthlyProjection[monthlyProjection.length - 1].total - monthlyProjection[0].total)}
          tone="success"
          icon="📈"
        />
      </div>
      
      {/* Chart */}
      <LineChart
        xLabels={monthlyProjection.filter((_, i) => i % 12 === 0).map(d => d.ageLabel)}
        series={[
          {
            name: 'OA Balance',
            values: monthlyProjection.filter((_, i) => i % 12 === 0).map(d => d.oa),
            stroke: '#3b82f6'
          },
          {
            name: 'SA Balance',
            values: monthlyProjection.filter((_, i) => i % 12 === 0).map(d => d.sa),
            stroke: '#10b981'
          },
          {
            name: 'MA Balance',
            values: monthlyProjection.filter((_, i) => i % 12 === 0).map(d => d.ma),
            stroke: '#f59e0b'
          },
          {
            name: 'Total CPF',
            values: monthlyProjection.filter((_, i) => i % 12 === 0).map(d => d.total),
            stroke: '#8b5cf6'
          }
        ]}
        height={300}
        onFormatY={(val) => {
          if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
          return fmtSGD(val);
        }}
      />
      
      {/* Monthly Breakdown Table */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0, color: '#1F2937', fontSize: 16, fontWeight: 700 }}>
            📋 Monthly CPF Account Breakdown
          </h4>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Showing all months from age {Math.round(monthlyProjection[0].age)} to {Math.round(monthlyProjection[monthlyProjection.length - 1].age)}
          </div>
        </div>
        
        {/* Table Container with Scroll */}
        <div style={{ 
          overflowX: 'auto', 
          border: '1px solid #e5e7eb', 
          borderRadius: 8,
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: 13,
            minWidth: 1000
          }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              zIndex: 10
            }}>
              <tr>
                <th style={{ 
                  padding: '14px 12px', 
                  textAlign: 'left', 
                  fontWeight: 700, 
                  borderBottom: '2px solid #d1d5db',
                  color: '#374151',
                  position: 'sticky',
                  left: 0,
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  zIndex: 11
                }}>
                  Date
                </th>
                <th style={{ 
                  padding: '14px 12px', 
                  textAlign: 'left', 
                  fontWeight: 700, 
                  borderBottom: '2px solid #d1d5db',
                  color: '#374151'
                }}>
                  Age
                </th>
                <th style={{ 
                  padding: '14px 12px', 
                  textAlign: 'right', 
                  fontWeight: 700, 
                  borderBottom: '2px solid #d1d5db',
                  color: '#1e40af'
                }}>
                  OA Balance
                </th>
                <th style={{ 
                  padding: '14px 12px', 
                  textAlign: 'right', 
                  fontWeight: 700, 
                  borderBottom: '2px solid #d1d5db',
                  color: '#065f46'
                }}>
                  SA Balance
                </th>
                <th style={{ 
                  padding: '14px 12px', 
                  textAlign: 'right', 
                  fontWeight: 700, 
                  borderBottom: '2px solid #d1d5db',
                  color: '#92400e'
                }}>
                  MA Balance
                </th>
                <th style={{ 
                  padding: '14px 12px', 
                  textAlign: 'right', 
                  fontWeight: 700, 
                  borderBottom: '2px solid #d1d5db',
                  color: '#5b21b6'
                }}>
                  Total CPF
                </th>
                <th style={{ 
                  padding: '14px 12px', 
                  textAlign: 'right', 
                  fontWeight: 700, 
                  borderBottom: '2px solid #d1d5db',
                  color: '#059669'
                }}>
                  Monthly Change
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyProjection.map((row, idx) => {
                const prevTotal = idx > 0 ? monthlyProjection[idx - 1].total : row.total;
                const monthlyChange = row.total - prevTotal;
                const isYearEnd = row.monthLabel === 'Dec';
                const isInterestMonth = row.isInterestMonth; // January
                
                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      background: isInterestMonth ? '#f0fdf4' : (isYearEnd ? '#f0f9ff' : (idx % 2 === 0 ? '#fff' : '#f9fafb')),
                      borderBottom: isYearEnd ? '2px solid #3b82f6' : (isInterestMonth ? '2px solid #10b981' : '1px solid #f3f4f6')
                    }}
                  >
                    <td style={{ 
                      padding: '12px', 
                      fontWeight: (isYearEnd || isInterestMonth) ? 700 : 500,
                      color: isInterestMonth ? '#065f46' : '#374151',
                      position: 'sticky',
                      left: 0,
                      background: isInterestMonth ? '#f0fdf4' : (isYearEnd ? '#f0f9ff' : (idx % 2 === 0 ? '#fff' : '#f9fafb')),
                      borderRight: '1px solid #e5e7eb'
                    }}>
                      {isInterestMonth && '💰 '}{row.year}-{row.monthLabel}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      color: '#6b7280',
                      fontWeight: (isYearEnd || isInterestMonth) ? 600 : 400
                    }}>
                      {row.age}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: '#1e40af'
                    }}>
                      {fmtSGD(row.oa)}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: '#065f46'
                    }}>
                      {fmtSGD(row.sa)}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: '#92400e'
                    }}>
                      {fmtSGD(row.ma)}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontWeight: 700,
                      color: '#5b21b6',
                      fontSize: 14
                    }}>
                      {fmtSGD(row.total)}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      fontWeight: isInterestMonth ? 700 : 600,
                      color: monthlyChange >= 0 ? (isInterestMonth ? '#059669' : '#10b981') : '#dc2626'
                    }}>
                      {isInterestMonth && '✨ '}{monthlyChange >= 0 ? '+' : ''}{fmtSGD(monthlyChange)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Table Legend/Info */}
        <div style={{ 
          marginTop: 12, 
          padding: 12, 
          background: '#f9fafb', 
          borderRadius: 6,
          fontSize: 12,
          color: '#6b7280'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>💡 Table Information:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
            <div>• <span style={{ color: '#3b82f6', fontWeight: 600 }}>Blue rows</span> = December (Year-end)</div>
            <div>• <span style={{ color: '#10b981', fontWeight: 600 }}>Green rows with 💰</span> = January (Interest credited)</div>
            <div>• Monthly contributions added automatically</div>
            <div>• Interest applied in January (2.5% OA, 4% SA/MA)</div>
            <div>• Withdrawals deducted when scheduled</div>
            <div>• <span style={{ fontWeight: 600 }}>Monthly Change</span> = Total change from previous month</div>
          </div>
        </div>
      </div>
    </div>
  )}
  
  <Card 
    title="💵 Take-Home Pay" 
    value={fmtSGD(cpfData.takeHome)} 
    tone="success" 
    icon="💸" 
  />
  
  <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: 20 }}>
    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1F2937' }}>📅 Annual Summary</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Annual CPF Contributions</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>{fmtSGD(cpfData.total * 12)}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Annual Take-Home</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>{fmtSGD(cpfData.takeHome * 12)}</div>
      </div>
    </div>
  </div>
</div>

);
};


export default CpfTab;
