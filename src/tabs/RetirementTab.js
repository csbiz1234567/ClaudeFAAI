import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD } from '../utils/helpers.js';
import { computeRetirementProjection } from '../utils/retirement.js';
import Card from '../components/Card.js';
import LabeledText from '../components/LabeledText.js';
import LabeledSelect from '../components/LabeledSelect.js';
import LineChart from '../components/LineChart.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const RetirementTab = ({ cashflowData, retirement, setRetirement, retirementProjection, profile, age }) => {
// State for investment percentage of savings
const [investmentPercent, setInvestmentPercent] = React.useState(retirement.investmentPercent || 100);

// Update retirement object when percentage changes
React.useEffect(() => {
if (retirement.investmentPercent !== investmentPercent) {
setRetirement({ …retirement, investmentPercent });
}
}, [investmentPercent]);

if (!cashflowData) {
return (
<div style={{ padding: 20 }}>
<Card title="⚠️ Complete Previous Steps" value="Please complete your profile and cashflow information first" tone="warn" />
</div>
);
}

// Auto-sync data from Profile and Cashflow
const retirementAge = toNum(profile.retirementAge, 65);
const yearsToRetirement = Math.max(0, retirementAge - age);

// Monthly investment amount - Apply investment percentage to cashflow savings
const totalMonthlySavings = cashflowData.monthlySavings;
const monthlyInvestment = totalMonthlySavings * (toNum(investmentPercent, 100) / 100);

const currentAge = age;

// Life expectancy based on gender
const lifeExpectancy = profile.gender === ‘female’ ? 86 : 82;
const retirementYears = Math.max(0, lifeExpectancy - retirementAge);

// Calculate estimated monthly retirement EXPENSES (70% of current expenses or custom from Profile)
const currentMonthlyExpenses = cashflowData.totalExpenses;
const estimatedRetirementExpenses = profile.customRetirementExpense && toNum(profile.customRetirementExpense) > 0
? toNum(profile.customRetirementExpense)
: currentMonthlyExpenses * 0.7; // 70% rule

// Inflation-adjusted future retirement expenses
const inflationRate = 0.03;
const futureRetirementExpenses = estimatedRetirementExpenses * Math.pow(1 + inflationRate, yearsToRetirement);

// Total retirement nest egg needed (inflation-adjusted expenses × years)
const totalNestEggNeeded = futureRetirementExpenses * 12 * retirementYears;

// CPF Life payout estimate (rough approximation)
const estimatedCpfLifePayout = 1379; // Average CPF Life payout per month
const cpfLifeShortfall = Math.max(0, futureRetirementExpenses - estimatedCpfLifePayout);
const cpfLifeShortfallAnnual = cpfLifeShortfall * 12;
const additionalFundsNeeded = cpfLifeShortfallAnnual * retirementYears;

// Current retirement projection value
const projectedBalance = retirementProjection && retirementProjection.length > 0
? retirementProjection[retirementProjection.length - 1].balance
: 0;

// Gap analysis
const retirementGap = totalNestEggNeeded - projectedBalance;
const additionalMonthlyRequired = retirementGap > 0 && yearsToRetirement > 0
? retirementGap / (yearsToRetirement * 12)
: 0;

const scenarios = [
{ value: ‘conservative’, label: ‘Conservative (2.5%)’ },
{ value: ‘moderate’, label: ‘Moderate (5.0%)’ },
{ value: ‘aggressive’, label: ‘Aggressive (8.0%)’ }
];

return (
<div style={{ padding: 20 }}>
{/* Header Banner */}
<div style={{
background: ‘linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)’,
border: ‘2px solid #f59e0b’,
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: ‘0 4px 12px rgba(245, 158, 11, 0.15)’
}}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 12 }}>
<div style={{ fontSize: 32 }}>🏖️</div>
<div style={{ flex: 1 }}>
<h3 style={{ margin: 0, color: ‘#92400e’, fontSize: 20, fontWeight: 700 }}>
{profile.name ? `${profile.name}'s Retirement Plan` : ‘Your Retirement Plan’}
</h3>
<p style={{ margin: ‘4px 0 0’, color: ‘#92400e’, fontSize: 14, opacity: 0.8 }}>
Auto-synced from your Profile and Cashflow data
</p>
</div>
</div>
</div>

  {/* Auto-Synced Summary Cards */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
    <Card
      title="Current Age"
      value={`${currentAge} years`}
      tone="info"
      icon="👤"
    />
    <Card
      title="Target Retirement Age"
      value={`${retirementAge} years`}
      tone="info"
      icon="🎯"
    />
    <Card
      title="Years to Retirement"
      value={`${yearsToRetirement} years`}
      tone={yearsToRetirement > 20 ? "success" : yearsToRetirement > 10 ? "warn" : "danger"}
      icon="⏳"
    />
    <Card
      title="Life Expectancy"
      value={`${lifeExpectancy} years`}
      tone="info"
      icon="🌟"
    />
    <Card
      title="Retirement Duration"
      value={`${retirementYears} years`}
      tone="info"
      icon="📅"
    />
  </div>

  {/* Retirement Expenses Analysis */}
  <div style={{ background: '#fff', border: '2px solid #3b82f6', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#1e40af', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
      💰 Retirement Expenses Projection
    </h3>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
      <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>Current Monthly Expenses</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(currentMonthlyExpenses)}</div>
      </div>
      
      <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>Estimated Retirement Expenses</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(estimatedRetirementExpenses)}</div>
        <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 2 }}>70% of current (typical)</div>
      </div>
      
      <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>Inflation-Adjusted @ Retirement</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#92400e' }}>{fmtSGD(futureRetirementExpenses)}</div>
        <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 2 }}>At 3% inflation for {yearsToRetirement} years</div>
      </div>
    </div>
    
    <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #10b981' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>
        💡 Total Retirement Nest Egg Needed
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#065f46' }}>
        {fmtSGD(totalNestEggNeeded)}
      </div>
      <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>
        {fmtSGD(futureRetirementExpenses)}/month × 12 months × {retirementYears} years
      </div>
    </div>
  </div>

  {/* CPF Life Analysis */}
  <div style={{ background: '#fff', border: '2px solid #10b981', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#065f46', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
      🏛️ CPF Life Analysis
    </h3>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
      <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: '#065f46', fontWeight: 600, marginBottom: 4 }}>Estimated CPF Life Payout</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#065f46' }}>{fmtSGD(estimatedCpfLifePayout)}/month</div>
        <div style={{ fontSize: 10, color: '#10b981', marginTop: 2 }}>Average baseline estimate</div>
      </div>
      
      <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>Monthly Shortfall</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#991b1b' }}>{fmtSGD(cpfLifeShortfall)}/month</div>
        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Gap to cover with investments</div>
      </div>
      
      <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>Additional Funds Needed</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#991b1b' }}>{fmtSGD(additionalFundsNeeded)}</div>
        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>For {retirementYears} years of retirement</div>
      </div>
    </div>
  </div>

  {/* Investment Settings */}
  <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1F2937' }}>⚙️ Investment Strategy Settings</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
      <div>
        <LabeledText
          label="Initial Investment / Current Savings (SGD)"
          value={retirement.initialSavings}
          onChange={(val) => setRetirement({ ...retirement, initialSavings: val })}
          placeholder="10000"
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          Your starting investment amount today
        </div>
      </div>
      
      <div>
        <LabeledSelect
          label="Investment Scenario"
          value={retirement.scenario}
          onChange={(val) => setRetirement({ ...retirement, scenario: val })}
          options={scenarios}
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          Expected annual return rate
        </div>
      </div>
    </div>
    
    {/* Investment Percentage Selector */}
    <div style={{ marginTop: 20, padding: 16, background: '#fef3c7', borderRadius: 8, border: '2px solid #f59e0b' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 12 }}>
        🎯 Investment Allocation: What % of your monthly savings do you want to invest for retirement?
      </div>
      
      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {[25, 50, 75, 100].map(percent => (
          <button
            key={percent}
            onClick={() => setInvestmentPercent(percent.toString())}
            style={{
              padding: '10px 20px',
              background: toNum(investmentPercent) === percent 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                : '#fff',
              color: toNum(investmentPercent) === percent ? '#fff' : '#92400e',
              border: `2px solid ${toNum(investmentPercent) === percent ? '#f59e0b' : '#fde68a'}`,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {percent}%
          </button>
        ))}
      </div>
      
      {/* Custom Percentage Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 6 }}>
            Or enter custom percentage:
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={investmentPercent}
            onChange={(e) => {
              const val = Math.min(100, Math.max(0, toNum(e.target.value, 0)));
              setInvestmentPercent(val.toString());
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid #f59e0b',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600
            }}
          />
        </div>
        <div style={{ 
          padding: '12px 16px', 
          background: '#fff', 
          borderRadius: 8, 
          border: '2px solid #f59e0b',
          minWidth: '120px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600 }}>INVESTING</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
            {investmentPercent}%
          </div>
        </div>
      </div>
    </div>
    
    {/* Monthly Investment Breakdown */}
    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Total Monthly Savings */}
      <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #3b82f6' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>
          💰 Total Monthly Savings (From Cashflow)
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1e40af' }}>
          {fmtSGD(totalMonthlySavings)}
        </div>
        <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4 }}>
          Take-Home ({fmtSGD(cashflowData.takeHome)}) - Expenses ({fmtSGD(cashflowData.totalExpenses)})
        </div>
      </div>
      
      {/* Amount Going to Retirement Investment */}
      <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '2px solid #10b981' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>
          📈 Monthly Retirement Investment
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#065f46' }}>
          {fmtSGD(monthlyInvestment)}
        </div>
        <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>
          {investmentPercent}% of {fmtSGD(totalMonthlySavings)} = {fmtSGD(monthlyInvestment)}
        </div>
      </div>
    </div>
    
    {/* Remaining Savings Info */}
    {toNum(investmentPercent) < 100 && (
      <div style={{ marginTop: 12, padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 12, color: '#1e40af' }}>
          💡 <strong>Remaining {100 - toNum(investmentPercent)}% ({fmtSGD(totalMonthlySavings - monthlyInvestment)})</strong> can be used for:
          emergency funds, short-term savings, other investments, or specific goals
        </div>
      </div>
    )}
    
    {/* Show Retirement Expense Info separately */}
    {profile.customRetirementExpense && toNum(profile.customRetirementExpense) > 0 && (
      <div style={{ marginTop: 12, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
          🎯 Target Monthly Retirement Expense (From Profile)
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#92400e' }}>
          {fmtSGD(toNum(profile.customRetirementExpense))}
        </div>
        <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
          This is your planned monthly spending in retirement (before inflation adjustment)
        </div>
      </div>
    )}
  </div>
  
  {/* Retirement Projection Results */}
  {retirementProjection && retirementProjection.length > 0 && (
    <>
      {/* Gap Analysis Banner */}
      <div style={{
        background: retirementGap > 0 
          ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
          : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        border: retirementGap > 0 ? '2px solid #ef4444' : '2px solid #10b981',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: retirementGap > 0 
          ? '0 4px 12px rgba(239, 68, 68, 0.15)'
          : '0 4px 12px rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 48 }}>{retirementGap > 0 ? '⚠️' : '✅'}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: 0, 
              color: retirementGap > 0 ? '#991b1b' : '#065f46', 
              fontSize: 20, 
              fontWeight: 700 
            }}>
              {retirementGap > 0 
                ? `Retirement Shortfall: ${fmtSGD(retirementGap)}`
                : `On Track! Surplus: ${fmtSGD(Math.abs(retirementGap))}`
              }
            </h3>
            <p style={{ 
              margin: '4px 0 0', 
              color: retirementGap > 0 ? '#991b1b' : '#065f46', 
              fontSize: 14 
            }}>
              {retirementGap > 0
                ? `You need to invest an additional ${fmtSGD(additionalMonthlyRequired)}/month to reach your retirement goal`
                : `Your current investment strategy exceeds your retirement needs. Great job!`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Projection Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Card 
          title="Total Contributions" 
          value={fmtSGD(retirementProjection[retirementProjection.length - 1].contributions)} 
          tone="info" 
          icon="💵" 
        />
        <Card 
          title="Investment Gains" 
          value={fmtSGD(retirementProjection[retirementProjection.length - 1].gains)} 
          tone="success" 
          icon="📈" 
        />
        <Card 
          title={`Projected at Age ${retirementAge}`} 
          value={fmtSGD(projectedBalance)} 
          tone="info" 
          icon="🎯" 
        />
        <Card 
          title="Retirement Nest Egg Needed" 
          value={fmtSGD(totalNestEggNeeded)} 
          tone={retirementGap > 0 ? "warn" : "success"} 
          icon="🎁" 
        />
      </div>
      
      {/* Chart */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1F2937' }}>📊 Retirement Accumulation Timeline</h3>
        <LineChart
          xLabels={retirementProjection.map(item => `Year ${item.year}`)}
          series={[
            {
              name: 'Total Balance',
              stroke: '#8b5cf6',
              values: retirementProjection.map(item => item.balance)
            },
            {
              name: 'Contributions',
              stroke: '#3b82f6',
              values: retirementProjection.map(item => item.contributions)
            },
            {
              name: 'Investment Gains',
              stroke: '#10b981',
              values: retirementProjection.map(item => item.gains)
            }
          ]}
          height={300}
          onFormatY={(value) => {
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
            return fmtSGD(value);
          }}
        />
      </div>

      {/* Detailed Year-by-Year Breakdown */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1F2937' }}>📋 Year-by-Year Projection</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Year</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Age</th>
                <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Annual Contribution</th>
                <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Total Contributed</th>
                <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Investment Gains</th>
                <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Total Balance</th>
              </tr>
            </thead>
            <tbody>
              {retirementProjection.map((row, idx) => {
                const annualContribution = idx === 0 
                  ? toNum(retirement.initialSavings) 
                  : monthlyInvestment * 12;
                const ageAtYear = currentAge + row.year;
                
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{row.year}</td>
                    <td style={{ padding: 12 }}>{Math.round(ageAtYear)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#3b82f6' }}>
                      {fmtSGD(annualContribution)}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#1e40af', fontWeight: 600 }}>
                      {fmtSGD(row.contributions)}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                      {fmtSGD(row.gains)}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#7c3aed', fontWeight: 700, fontSize: 14 }}>
                      {fmtSGD(row.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}
</div>

);
};

export default RetirementTab;
