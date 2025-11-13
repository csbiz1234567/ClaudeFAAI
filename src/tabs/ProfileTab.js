import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD, monthNames, parseDob, monthsSinceDob } from '../utils/helpers.js';
import { getCpfRates, getCPFRates, getCpfAllocation, computeCpf } from '../utils/cpf.js';
import Card from '../components/Card.js';
import LabeledText from '../components/LabeledText.js';
import LabeledSelect from '../components/LabeledSelect.js';
import LineChart from '../components/LineChart.js';

const ProfileTab = ({ profile, setProfile, age, cpfData, expenses, setExpenses, customExpenses, setCustomExpenses, cashflowData }) => {
// Interest rates for accumulation phase scenarios
const [rate1, setRate1] = useState(0.05); // Conservative: 0.05%
const [rate2, setRate2] = useState(6);    // Moderate: 6%
const [rate3, setRate3] = useState(12);   // Growth (formerly Aggressive): 12%
// Percentage of savings to invest
const [savingsInvestPercent, setSavingsInvestPercent] = useState(100);

const totalMonthlyExpenses = useMemo(() => {
let sum = 0;
for (const key in expenses) {
sum += toNum(expenses[key], 0);
}
// Add custom expenses
if (customExpenses) {
customExpenses.forEach(exp => {
sum += toNum(exp.amount, 0);
});
}
return sum;
}, [expenses, customExpenses]);

const monthlyRetirementExpenses = profile.customRetirementExpense && toNum(profile.customRetirementExpense, 0) > 0
? toNum(profile.customRetirementExpense, 0)
: (totalMonthlyExpenses > 0
? totalMonthlyExpenses
: (cpfData ? cpfData.takeHome * 0.7 : 0));

const yearsToRetirement = Math.max(1, toNum(profile.retirementAge, 65) - age);
const lifeExpectancy = profile.gender === ‘female’ ? 86 : 82;
const inflationRate = 0.03;

const futureMonthlyRetirementExpenses = monthlyRetirementExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
const retirementYears = Math.max(10, lifeExpectancy - toNum(profile.retirementAge, 65));
const retirementNestEgg = futureMonthlyRetirementExpenses * 12 * retirementYears;

const monthsToRetirement = yearsToRetirement * 12;
const monthlyRate = 0.08 / 12;
const requiredMonthlyInvestment = retirementNestEgg / ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate);

const coffeeFuturePrice = Math.round(6 * Math.pow(1.03, yearsToRetirement));
const cpfShortfall = futureMonthlyRetirementExpenses - 1379;

// Calculate total children education costs
const calculateChildEducationCost = (child) => {
if (!child.dobISO) return 0;
const childDob = parseDob(child.dobISO);
if (!childDob) return 0;
const today = new Date();
const refYear = today.getFullYear();
const refMonth = today.getMonth();
const ageInMonths = monthsSinceDob(childDob, refYear, refMonth);
const currentAge = Math.floor(ageInMonths / 12);

// Gender-specific university start age (males after NS, females direct entry)
const uniStartAge = child.gender === 'male' ? 21 : 19;
const uniEndAge = uniStartAge + 3; // 4 years total

// Realistic Singapore parent spending - PSLE to O-Levels + University
const stages = [
  { start: 12, end: 16, yearlyCost: 9600 },   // PSLE to O-Levels (5 years)
  { start: uniStartAge, end: uniEndAge, yearlyCost: 8750 },   // University - $35k total / 4 years
];

let totalCost = 0;
stages.forEach(stage => {
  if (currentAge <= stage.end) {
    const yearsUntilStart = Math.max(0, stage.start - currentAge);
    const duration = stage.end - Math.max(stage.start, currentAge) + 1;
    if (duration > 0) {
      for (let year = 0; year < duration; year++) {
        const yearsFromNow = yearsUntilStart + year;
        totalCost += stage.yearlyCost * Math.pow(1 + inflationRate, yearsFromNow);
      }
    }
  }
});
return totalCost;

};

const totalChildrenEducationCost = profile.children
? profile.children.reduce((sum, child) => sum + calculateChildEducationCost(child), 0)
: 0;

return (
<div style={{ padding: 20 }}>
{/* Welcome Banner */}
<div style={{
background: ‘linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)’,
border: ‘1px solid #3b82f6’,
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: ‘0 2px 8px rgba(0,0,0,0.04)’
}}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 12 }}>
<div style={{ fontSize: 32 }}>👋</div>
<div>
<h3 style={{ margin: 0, color: ‘#1e40af’, fontSize: 20 }}>Let’s Get to Know You</h3>
<p style={{ margin: ‘4px 0 0’, color: ‘#1e40af’, fontSize: 14, opacity: 0.8 }}>
Your personal details help us create a customized financial roadmap
</p>
</div>
</div>
</div>

  {/* Personal Info */}
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  }}>
    <h3 style={{ marginTop: 0 }}>📋 Personal Information</h3>
    
    {/* Profile Display Card */}
    {profile.name && age > 0 && (
      <div style={{ marginBottom: 20, padding: 16, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: 12, border: '2px solid #10b981' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 48 }}>👤</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>
              {profile.name}, {age} years old
            </div>
            <div style={{ fontSize: 14, color: '#065f46', marginTop: 4 }}>
              {profile.employmentStatus === 'employed' ? '💼 Employed' : '🏢 Self-Employed'} • 
              {profile.gender === 'male' ? ' ♂️ Male' : ' ♀️ Female'} • 
              Target Retirement: Age {profile.retirementAge || 65}
            </div>
          </div>
        </div>
      </div>
    )}

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      <LabeledText 
        label='Full Name' 
        value={profile.name} 
        onChange={(val) => setProfile({ ...profile, name: val })} 
        placeholder='Enter your name' 
      />
      <LabeledText 
        label='Date of Birth' 
        value={profile.dob} 
        onChange={(val) => setProfile({ ...profile, dob: val })} 
        type='date' 
      />
      <LabeledSelect
        label='Gender'
        value={profile.gender}
        onChange={(val) => setProfile({ ...profile, gender: val })}
        options={[
          { label: 'Male (Life: 82 yrs)', value: 'male' },
          { label: 'Female (Life: 86 yrs)', value: 'female' }
        ]}
      />
      <LabeledSelect
        label='Employment Status'
        value={profile.employmentStatus || 'employed'}
        onChange={(val) => setProfile({ ...profile, employmentStatus: val })}
        options={[
          { label: '💼 Employed', value: 'employed' },
          { label: '🏢 Self-Employed', value: 'self-employed' }
        ]}
      />
    </div>

    <div style={{ marginBottom: 12, marginTop: 12, padding: 10, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
      <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
        <strong>💡 Auto-Sync:</strong> {age ? 
          `Enter either Gross OR Take-Home salary - the other calculates automatically based on your age and CPF rates! ${profile.employmentStatus === 'self-employed' ? '(Self-employed: No employer CPF)' : ''}` : 
          '⚠️ Fill in your Date of Birth above first, then enter either salary field to enable auto-calculation!'}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      <div>
        <LabeledText 
          label='Monthly Gross Salary (SGD) 💼' 
          value={profile.grossSalary || ''} 
          onChange={(val) => {
            const gross = toNum(val);
            const rates = getCpfRates(age);
            const employeeCPF = gross * rates.employee;
            const takeHome = gross - employeeCPF;
            setProfile({ 
              ...profile, 
              grossSalary: val,
              monthlyIncome: val,
              takeHome: takeHome.toFixed(2)
            });
          }} 
          placeholder='e.g., 6000' 
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          🏦 Used for CPF calculations • Auto-syncs with Take-Home
        </div>
      </div>
      <div>
        <LabeledText 
          label='Monthly Take-Home (SGD) 💵' 
          value={profile.takeHome || ''} 
          onChange={(val) => {
            const takeHome = toNum(val);
            const rates = getCpfRates(age);
            const gross = takeHome / (1 - rates.employee);
            setProfile({ 
              ...profile, 
              takeHome: val,
              grossSalary: gross.toFixed(2),
              monthlyIncome: gross.toFixed(2)
            });
          }} 
          placeholder='e.g., 4800' 
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          💸 Used for Cashflow calculations • Auto-syncs with Gross
        </div>
      </div>
    </div>

    {/* Salary Breakdown Info Cards */}
    {profile.grossSalary && age > 0 && (
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: profile.employmentStatus === 'employed' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 12 }}>
        <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: 14, borderRadius: 8, border: '2px solid #3b82f6' }}>
          <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
            💰 Gross Salary
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1e40af' }}>
            {fmtSGD(profile.grossSalary)}
          </div>
          <div style={{ fontSize: 10, color: '#1e40af', marginTop: 2, opacity: 0.8 }}>
            Before CPF deductions
          </div>
        </div>
        
        <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: 14, borderRadius: 8, border: '2px solid #f59e0b' }}>
          <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
            👤 Employee CPF
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#92400e' }}>
            {(() => {
              const rates = getCpfRates(age);
              const employeeCPF = toNum(profile.grossSalary, 0) * rates.employee;
              return fmtSGD(employeeCPF);
            })()}
          </div>
          <div style={{ fontSize: 10, color: '#92400e', marginTop: 2, opacity: 0.8 }}>
            {(() => {
              const rates = getCpfRates(age);
              return `${(rates.employee * 100).toFixed(0)}% of gross`;
            })()}
          </div>
        </div>
        
        {profile.employmentStatus === 'employed' && (
          <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', padding: 14, borderRadius: 8, border: '2px solid #10b981' }}>
            <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
              🏢 Employer CPF
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#065f46' }}>
              {(() => {
                const rates = getCpfRates(age);
                const employerCPF = toNum(profile.grossSalary, 0) * rates.employer;
                return fmtSGD(employerCPF);
              })()}
            </div>
            <div style={{ fontSize: 10, color: '#065f46', marginTop: 2, opacity: 0.8 }}>
              {(() => {
                const rates = getCpfRates(age);
                return `${(rates.employer * 100).toFixed(1)}% of gross`;
              })()}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Retirement Age */}
    <div style={{ marginTop: 16 }}>
      <div style={{ maxWidth: 300 }}>
        <LabeledText 
          label='🎯 Target Retirement Age' 
          value={profile.retirementAge} 
          onChange={(val) => setProfile({ ...profile, retirementAge: val })} 
          placeholder='e.g., 65' 
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          Standard retirement age in Singapore is 63-65 years
        </div>
      </div>
    </div>
  </div>

  {/* Expenses */}
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  }}>
    <h3 style={{ marginTop: 0 }}>💰 Monthly Expenses Breakdown</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {Object.keys(expenses).map((key) => (
        <LabeledText
          key={key}
          label={key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          value={expenses[key]}
          onChange={(v) => setExpenses({ ...expenses, [key]: v })}
          placeholder='0'
        />
      ))}
    </div>
    {/* Custom Expenses */}
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#374151' }}>➕ Custom Expenses</h4>
        <button 
          onClick={() => setCustomExpenses([...customExpenses, { id: Date.now(), name: '', amount: '' }])}
          style={{ padding: '6px 12px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Custom Expense
        </button>
      </div>
      {customExpenses && customExpenses.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {customExpenses.map((exp) => (
            <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <LabeledText
                label='Expense Name'
                value={exp.name}
                onChange={(v) => setCustomExpenses(customExpenses.map(e => e.id === exp.id ? { ...e, name: v } : e))}
                placeholder='e.g., Pet care, Subscriptions'
              />
              <LabeledText
                label='Amount (SGD)'
                value={exp.amount}
                onChange={(v) => setCustomExpenses(customExpenses.map(e => e.id === exp.id ? { ...e, amount: v } : e))}
                placeholder='0'
              />
              <button
                onClick={() => setCustomExpenses(customExpenses.filter(e => e.id !== exp.id))}
                style={{ padding: '10px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', height: 'fit-content', marginBottom: 8 }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    {/* Total Expenses Summary */}
    <div style={{ marginTop: 16, padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Total Monthly Expenses:</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#667eea' }}>{fmtSGD(totalMonthlyExpenses)}</span>
      </div>
    </div>
  </div>

  {/* Retirement Expense Planning */}
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  }}>
    <h3 style={{ marginTop: 0 }}>🌅 Retirement Expense Planning</h3>

    {/* Visual Retirement Journey Chart */}
    {age > 0 && retirementNestEgg > 0 && (
      <div style={{ marginBottom: 20, padding: 24, background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: 12, border: '2px solid #3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}>
        <h4 style={{ marginTop: 0, color: '#1e40af', fontSize: 18, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>📊</span>
          Your Wealth Building & Retirement Journey
        </h4>
        <p style={{ margin: '0 0 20px 0', color: '#3b82f6', fontSize: 14 }}>
          Visual timeline from age {Math.round(age)} to {lifeExpectancy}: See exactly when you're building wealth vs living off it
        </p>

        {(() => {
          const currentAge = Math.round(age);
          const retirementAge = toNum(profile.retirementAge, 65);
          const deathAge = lifeExpectancy;
          
          // Calculate phases
          const accumulationPhase = {
            startAge: currentAge,
            endAge: retirementAge,
            duration: retirementAge - currentAge,
            label: 'WEALTH BUILDING PHASE',
            description: 'Working, saving, investing - growing your nest egg',
            icon: '💼',
            color: '#10b981',
            bgColor: '#d1fae5'
          };
          
          const drawdownPhase = {
            startAge: retirementAge,
            endAge: deathAge,
            duration: deathAge - retirementAge,
            label: 'LIVING OFF WEALTH PHASE',
            description: 'Retired, withdrawing from savings and investments',
            icon: '🏖️',
            color: '#f59e0b',
            bgColor: '#fef3c7'
          };
          
          // Create timeline data (every 5 years)
          const timelinePoints = [];
          for (let a = currentAge; a <= deathAge; a += 5) {
            if (a > deathAge) break;
            timelinePoints.push(a);
          }
          if (timelinePoints[timelinePoints.length - 1] !== deathAge) {
            timelinePoints.push(deathAge);
          }
          
          // Add retirement age if not already in timeline
          if (!timelinePoints.includes(retirementAge)) {
            timelinePoints.push(retirementAge);
            timelinePoints.sort((a, b) => a - b);
          }
          
          const totalYears = deathAge - currentAge;
          
          return (
            <>
              {/* Phase Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {/* Accumulation Phase Card */}
                <div style={{
                  padding: 20,
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  borderRadius: 10,
                  border: '3px solid #10b981',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{accumulationPhase.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {accumulationPhase.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
                    Age {accumulationPhase.startAge} → {accumulationPhase.endAge}
                  </div>
                  <div style={{ fontSize: 13, color: '#065f46', marginBottom: 12 }}>
                    {accumulationPhase.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'rgba(255, 255, 255, 0.8)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600 }}>Duration:</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                      {accumulationPhase.duration} years
                    </div>
                  </div>
                </div>
                
                {/* Drawdown Phase Card */}
                <div style={{
                  padding: 20,
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: 10,
                  border: '3px solid #f59e0b',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{drawdownPhase.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {drawdownPhase.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
                    Age {drawdownPhase.startAge} → {drawdownPhase.endAge}
                  </div>
                  <div style={{ fontSize: 13, color: '#92400e', marginBottom: 12 }}>
                    {drawdownPhase.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'rgba(255, 255, 255, 0.8)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>Duration:</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
                      {drawdownPhase.duration} years
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visual Timeline Bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 12 }}>
                  📅 Life Timeline Visualization
                </div>
                
                {/* Timeline Bar */}
                <div style={{ position: 'relative', height: 80, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                  {/* Accumulation Phase Bar */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: `${(accumulationPhase.duration / totalYears) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    borderRight: '3px solid #fff'
                  }}>
                    💼 BUILDING: {accumulationPhase.duration}y
                  </div>
                  
                  {/* Drawdown Phase Bar */}
                  <div style={{
                    position: 'absolute',
                    left: `${(accumulationPhase.duration / totalYears) * 100}%`,
                    top: 0,
                    width: `${(drawdownPhase.duration / totalYears) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13
                  }}>
                    🏖️ LIVING: {drawdownPhase.duration}y
                  </div>
                </div>
                
                {/* Age Markers */}
                <div style={{ position: 'relative', height: 40, marginTop: 8 }}>
                  {timelinePoints.map((a, idx) => {
                    const position = ((a - currentAge) / totalYears) * 100;
                    const isRetirement = a === retirementAge;
                    
                    return (
                      <div key={idx} style={{
                        position: 'absolute',
                        left: `${position}%`,
                        transform: 'translateX(-50%)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: 2,
                          height: isRetirement ? 20 : 12,
                          background: isRetirement ? '#ef4444' : '#9ca3af',
                          marginBottom: 4,
                          marginLeft: '50%'
                        }} />
                        <div style={{
                          fontSize: isRetirement ? 13 : 11,
                          fontWeight: isRetirement ? 700 : 600,
                          color: isRetirement ? '#ef4444' : '#6b7280',
                          whiteSpace: 'nowrap'
                        }}>
                          {isRetirement ? `🎯 ${a}` : a}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Detailed Timeline Breakdown */}
              <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                  📋 Detailed Age Breakdown
                </div>
                
                <div style={{ display: 'grid', gap: 12 }}>
                  {/* Current Age */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f0fdf4', borderRadius: 6, border: '2px solid #10b981' }}>
                    <div style={{ fontSize: 24 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>Current Age</div>
                      <div style={{ fontSize: 11, color: '#065f46' }}>You are here now</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
                      {currentAge}
                    </div>
                  </div>
                  
                  {/* Retirement Age */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fef2f2', borderRadius: 6, border: '2px solid #ef4444' }}>
                    <div style={{ fontSize: 24 }}>🎯</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>Retirement Age</div>
                      <div style={{ fontSize: 11, color: '#991b1b' }}>Stop working, start living</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
                      {retirementAge}
                    </div>
                  </div>
                  
                  {/* Life Expectancy */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fef3c7', borderRadius: 6, border: '2px solid #f59e0b' }}>
                    <div style={{ fontSize: 24 }}>🌅</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Life Expectancy</div>
                      <div style={{ fontSize: 11, color: '#92400e' }}>Plan savings to last until here</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                      {deathAge}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Key Insights */}
              <div style={{ 
                marginTop: 16, 
                padding: 16, 
                background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', 
                borderRadius: 8,
                border: '2px solid #8b5cf6'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6', marginBottom: 8 }}>
                  💡 Financial Planning Insights:
                </div>
                <div style={{ fontSize: 12, color: '#5b21b6', lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 6 }}>
                    • <strong>Wealth Building Phase:</strong> You have {accumulationPhase.duration} years to save and invest. The earlier you start, the more compound interest works for you!
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    • <strong>Retirement Duration:</strong> Your money needs to last {drawdownPhase.duration} years. Plan for {fmtSGD(futureMonthlyRetirementExpenses)}/month in retirement (inflation-adjusted).
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    • <strong>Required Nest Egg:</strong> Target {fmtSGD(retirementNestEgg)} by age {retirementAge} to sustain your retirement lifestyle.
                  </div>
                  <div>
                    • <strong>Ratio Analysis:</strong> You'll spend {Math.round((accumulationPhase.duration / totalYears) * 100)}% of your adult life building wealth, and {Math.round((drawdownPhase.duration / totalYears) * 100)}% living off it.
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    )}

    <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
      <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
        <strong>💡 Pro Tip:</strong> Most people spend less in retirement (no commuting, mortgage paid off) but some spend more (travel, healthcare). 
        Adjust your retirement expenses below to match your expected lifestyle.
      </div>
    </div>

    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
        📊 Current Monthly Expenses: {fmtSGD(totalMonthlyExpenses)}
      </div>
      {/* Quick Adjustment Buttons */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Quick Adjustments:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setProfile({ ...profile, customRetirementExpense: (totalMonthlyExpenses * 0.5).toFixed(2) })}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}
          >
            -50% ({fmtSGD(totalMonthlyExpenses * 0.5)})
          </button>
          <button
            onClick={() => setProfile({ ...profile, customRetirementExpense: (totalMonthlyExpenses * 0.75).toFixed(2) })}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}
          >
            -25% ({fmtSGD(totalMonthlyExpenses * 0.75)})
          </button>
          <button
            onClick={() => setProfile({ ...profile, customRetirementExpense: totalMonthlyExpenses.toFixed(2) })}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}
          >
            Same ({fmtSGD(totalMonthlyExpenses)})
          </button>
          <button
            onClick={() => setProfile({ ...profile, customRetirementExpense: (totalMonthlyExpenses * 1.25).toFixed(2) })}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
            }}
          >
            +25% ({fmtSGD(totalMonthlyExpenses * 1.25)})
          </button>
          <button
            onClick={() => setProfile({ ...profile, customRetirementExpense: (totalMonthlyExpenses * 1.5).toFixed(2) })}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
            }}
          >
            +50% ({fmtSGD(totalMonthlyExpenses * 1.5)})
          </button>
        </div>
      </div>

      {/* Custom Amount Input */}
      <div>
        <LabeledText
          label='💰 Custom Retirement Monthly Expense (Before Inflation)'
          value={profile.customRetirementExpense || ''}
          onChange={(val) => setProfile({ ...profile, customRetirementExpense: val })}
          placeholder={`Default: ${fmtSGD(totalMonthlyExpenses > 0 ? totalMonthlyExpenses : (cpfData ? cpfData.takeHome * 0.7 : 0))}`}
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>
          💡 Enter your expected monthly expenses in retirement (today's dollars). 
          We'll automatically adjust for inflation over {yearsToRetirement} years.
        </div>
      </div>

      {/* Show what will be used */}
      <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
          <strong>📝 Retirement Calculation Using:</strong>
          <div style={{ marginTop: 6 }}>
            Today's Monthly Expense: <strong>{fmtSGD(profile.customRetirementExpense && toNum(profile.customRetirementExpense, 0) > 0 
              ? toNum(profile.customRetirementExpense, 0)
              : monthlyRetirementExpenses)}</strong>
          </div>
          {age > 0 && (
            <div style={{ marginTop: 4 }}>
              After {yearsToRetirement} years @ 3% inflation: <strong style={{ color: '#dc2626' }}>
                {fmtSGD(futureMonthlyRetirementExpenses)}/month
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* Big Numbers: Your Complete Financial Blueprint */}
  {retirementNestEgg > 0 && (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '2px solid #f59e0b',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <h3 style={{ marginTop: 0, color: '#92400e', fontSize: 20 }}>🎯 Your Complete Financial Blueprint</h3>
      <div style={{ marginBottom: 12, padding: 12, background: 'rgba(255, 255, 255, 0.7)', borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          📊 Retirement Expense Calculation:
        </div>
        <div style={{ fontSize: 12, color: '#92400e', marginTop: 4, lineHeight: 1.5 }}>
          {profile.customRetirementExpense && toNum(profile.customRetirementExpense, 0) > 0 ? (
            <>Using your custom retirement expense: <strong>{fmtSGD(toNum(profile.customRetirementExpense, 0))}/month</strong></>
          ) : totalMonthlyExpenses > 0 ? (
            <>Using current total expenses: <strong>{fmtSGD(totalMonthlyExpenses)}/month</strong></>
          ) : (
            <>Using 70% of take-home: <strong>{fmtSGD((cpfData ? cpfData.takeHome : 0) * 0.7)}/month</strong></>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#065f46', marginBottom: 4, fontWeight: 600 }}>🌅 Retirement Nest Egg Target</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#065f46' }}>{fmtSGD(retirementNestEgg)}</div>
        <div style={{ fontSize: 12, color: '#065f46', marginTop: 4 }}>
          {fmtSGD(futureMonthlyRetirementExpenses)}/month × {retirementYears} years of retirement
        </div>
        <div style={{ fontSize: 11, color: '#065f46', marginTop: 6, opacity: 0.9, lineHeight: 1.5 }}>
          From age {toNum(profile.retirementAge, 65)} to {lifeExpectancy} (life expectancy for {profile.gender === 'female' ? 'females' : 'males'} in SG)
        </div>
        <div style={{ fontSize: 11, color: '#065f46', marginTop: 8, padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 4 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>💡 Why so high? Inflation matters!</div>
          <div style={{ marginBottom: 2 }}>
            Today's lifestyle cost: {fmtSGD(monthlyRetirementExpenses)}/month
          </div>
          <div style={{ fontWeight: 600 }}>
            In {yearsToRetirement} years @ 3% inflation: {fmtSGD(futureMonthlyRetirementExpenses)}/month
          </div>
          <div style={{ fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>
            That's {((futureMonthlyRetirementExpenses / Math.max(1, monthlyRetirementExpenses) - 1) * 100).toFixed(0)}% more expensive!
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '2px solid #10b981', textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#065f46', marginBottom: 8, fontWeight: 600 }}>💎 TOTAL RETIREMENT GOAL</div>
        <div style={{ fontSize: 42, fontWeight: 700, color: '#10b981', marginBottom: 12 }}>{fmtSGD(retirementNestEgg)}</div>
        <div style={{ fontSize: 13, color: '#065f46', marginBottom: 16, lineHeight: 1.6 }}>
          This covers {retirementYears} years from age {toNum(profile.retirementAge, 65)} to {lifeExpectancy}<br/>
          at {fmtSGD(futureMonthlyRetirementExpenses)}/month (inflation-adjusted)
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16, borderRadius: 8, color: '#fff' }}>
          <div style={{ fontSize: 14, marginBottom: 6, opacity: 0.95 }}>To reach this goal, invest approximately:</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 6 }}>{fmtSGD(requiredMonthlyInvestment)}/month</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>at 8% annual returns over the next {yearsToRetirement} years (until retirement)</div>
        </div>
      </div>
    </div>
  )}

  {/* CPF Shortfall Reality Check */}
  {age > 0 && yearsToRetirement > 0 && (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '2px solid #f59e0b',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: 0, color: '#92400e', fontSize: 22, fontWeight: 700 }}>
          {profile.name || 'Your'} Reality: Why CPF Alone Won't Be Enough
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.6)', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>$1,379</div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            <strong>Average CPF Life payout per month.</strong> Can you live comfortably on this?
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.6)', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>3%</div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            <strong>Annual inflation.</strong> Your savings lose value every year.
          </div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
            {fmtSGD(futureMonthlyRetirementExpenses).replace('SGD ', '$')}
          </div>
          <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>
            <strong>What YOUR lifestyle will cost at retirement</strong> in {yearsToRetirement} years!
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Coffee Example */}
  {age > 0 && yearsToRetirement > 0 && (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '2px solid #f59e0b',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 32 }}>💡</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, color: '#92400e', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Your Retirement Income Strategy: Year {new Date().getFullYear() + yearsToRetirement}
          </h4>
          <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6, marginBottom: 16 }}>
            CPF Life provides a <strong>safety net</strong> with monthly payouts that escalate over time to keep pace with inflation. 
            The <strong>Escalating Plan</strong> (most popular) starts at ~$1,379 and increases annually. 
            But will it be enough to maintain your desired lifestyle?
          </div>
          
          {(() => {
            // CPF Life Escalating Plan - increases ~2% annually to match inflation
            const cpfLifeBaselineToday = 1379;
            const cpfInflationAdjustment = 0.02; // CPF escalates at ~2% annually
            const actualInflation = 0.03; // Real inflation is ~3%
            
            // CPF Life future value (with 2% escalation)
            const cpfLifeFuture = cpfLifeBaselineToday * Math.pow(1 + cpfInflationAdjustment, yearsToRetirement);
            
            // User's inflation-adjusted retirement needs (at 3% inflation)
            const todayExpenses = monthlyRetirementExpenses;
            const futureExpenses = futureMonthlyRetirementExpenses; // Already inflated at 3%
            
            // The gap: CPF escalates slower than actual inflation
            const shortfall = Math.max(0, futureExpenses - cpfLifeFuture);
            const shortfallPercentage = futureExpenses > 0 ? (shortfall / futureExpenses * 100) : 0;
            
            // Calculate supplementary investment needed
            const retirementYearsCalc = Math.max(10, (profile.gender === 'female' ? 86 : 82) - toNum(profile.retirementAge, 65));
            const totalSupplementaryNeeded = shortfall * 12 * retirementYearsCalc;
            
            return (
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Current Lifestyle */}
                <div style={{ 
                  padding: 16, 
                  background: '#fff', 
                  borderRadius: 8,
                  border: '2px solid #3b82f6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                        📊 Your Lifestyle Today
                      </div>
                      <div style={{ fontSize: 12, color: '#3b82f6' }}>
                        Monthly expenses in today's dollars
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
                        {fmtSGD(todayExpenses)}/month
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Future Needs (Inflation-Adjusted) */}
                <div style={{ 
                  padding: 16, 
                  background: '#fff', 
                  borderRadius: 8,
                  border: '2px solid #f59e0b'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
                        💰 Same Lifestyle at Retirement (Age {toNum(profile.retirementAge, 65)})
                      </div>
                      <div style={{ fontSize: 12, color: '#92400e' }}>
                        After {yearsToRetirement} years of 3% inflation
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                        {fmtSGD(futureExpenses)}/month
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Income Breakdown */}
                <div style={{ 
                  padding: 20, 
                  background: '#fff', 
                  borderRadius: 8,
                  border: '3px solid #10b981'
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 12 }}>
                    🏛️ Your Retirement Income Sources:
                  </div>
                  
                  {/* CPF Life with Escalation */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 12,
                    background: '#f0fdf4',
                    borderRadius: 6,
                    marginBottom: 8
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                        ✅ CPF Life - Escalating Plan
                      </div>
                      <div style={{ fontSize: 11, color: '#10b981' }}>
                        Starts at $1,379, grows ~2% yearly
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                        {fmtSGD(cpfLifeFuture)}
                      </div>
                      <div style={{ fontSize: 10, color: '#10b981' }}>
                        at age {toNum(profile.retirementAge, 65)}
                      </div>
                    </div>
                  </div>
                  
                  {/* The Gap - Inflation vs CPF Escalation */}
                  {shortfall > 0 && (
                    <div style={{ 
                      padding: 12,
                      background: '#fef3c7',
                      borderRadius: 6,
                      marginBottom: 8
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                            ⚠️ Lifestyle Gap (The Problem)
                          </div>
                          <div style={{ fontSize: 11, color: '#f59e0b' }}>
                            CPF grows 2%, but inflation is 3%
                          </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                          {fmtSGD(shortfall)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Supplementary Investment Needed */}
                  {shortfall > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 12,
                      background: '#dbeafe',
                      borderRadius: 6
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                          🎯 Your Investments (Solution)
                        </div>
                        <div style={{ fontSize: 11, color: '#3b82f6' }}>
                          To maintain your lifestyle
                        </div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>
                        {fmtSGD(shortfall)}
                      </div>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div style={{ 
                    marginTop: 12,
                    padding: 16,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        💎 Total Monthly Income Needed
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                        {fmtSGD(futureExpenses)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Key Insight */}
                {shortfall > 0 && (
                  <div style={{ 
                    padding: 16, 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    borderRadius: 8,
                    border: '1px solid #10b981'
                  }}>
                    <div style={{ fontSize: 13, color: '#065f46', lineHeight: 1.6 }}>
                      💡 <strong>The Reality:</strong> CPF Life escalates at ~2% yearly, but actual inflation averages 3%. 
                      This 1% gap compounds over time! By age {toNum(profile.retirementAge, 65)}, CPF Life will provide 
                      <strong> {fmtSGD(cpfLifeFuture)}</strong> (~{((cpfLifeFuture / futureExpenses) * 100).toFixed(0)}% of your needs), 
                      leaving a <strong>{fmtSGD(shortfall)}/month</strong> gap. 
                      You'll need <strong>{fmtSGD(totalSupplementaryNeeded)}</strong> in supplementary investments 
                      to maintain your lifestyle for {retirementYearsCalc} years.
                    </div>
                  </div>
                )}
                
                {shortfall <= 0 && (
                  <div style={{ 
                    padding: 16, 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    borderRadius: 8,
                    border: '1px solid #10b981'
                  }}>
                    <div style={{ fontSize: 13, color: '#065f46', lineHeight: 1.6, textAlign: 'center', fontWeight: 600 }}>
                      🎉 Excellent! Even with CPF Life escalating at 2% (vs 3% inflation), it can cover your modest retirement needs. 
                      Any additional investments will enhance your lifestyle and provide extra security.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  )}

  {/* Early Investment Impact */}
  {age > 0 && yearsToRetirement > 0 && cashflowData && cashflowData.monthlySavings > 0 && (
    <div style={{
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      border: '2px solid #10b981',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 32 }}>⏰</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, color: '#065f46', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            The Power of Starting Early: Time is Your Greatest Asset
          </h4>
          <div style={{ fontSize: 14, color: '#065f46', lineHeight: 1.6, marginBottom: 16 }}>
            See the dramatic difference between investing NOW versus waiting 5 or 10 years. 
            Every year you delay costs you tens of thousands in lost compound growth!
          </div>
          
          {(() => {
            const monthlyInvestment = cashflowData.monthlySavings;
            const growthRate = 0.12; // 12% annual growth
            const monthlyRate = growthRate / 12;
            
            // Calculate for starting now
            const yearsNow = yearsToRetirement;
            const monthsNow = yearsNow * 12;
            const futureValueNow = monthlyInvestment > 0 
              ? monthlyInvestment * ((Math.pow(1 + monthlyRate, monthsNow) - 1) / monthlyRate)
              : 0;
            
            // Calculate for starting 5 years later
            const yearsLater5 = Math.max(0, yearsToRetirement - 5);
            const monthsLater5 = yearsLater5 * 12;
            const futureValueLater5 = monthlyInvestment > 0 && yearsLater5 > 0
              ? monthlyInvestment * ((Math.pow(1 + monthlyRate, monthsLater5) - 1) / monthlyRate)
              : 0;
            
            // Calculate for starting 10 years later
            const yearsLater10 = Math.max(0, yearsToRetirement - 10);
            const monthsLater10 = yearsLater10 * 12;
            const futureValueLater10 = monthlyInvestment > 0 && yearsLater10 > 0
              ? monthlyInvestment * ((Math.pow(1 + monthlyRate, monthsLater10) - 1) / monthlyRate)
              : 0;
            
            const lost5Years = futureValueNow - futureValueLater5;
            const lost10Years = futureValueNow - futureValueLater10;
            
            return (
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Start Now */}
                <div style={{ 
                  padding: 16, 
                  background: '#fff', 
                  borderRadius: 8,
                  border: '3px solid #10b981',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
                        ✅ START NOW (Age {age})
                      </div>
                      <div style={{ fontSize: 12, color: '#065f46' }}>
                        Invest {fmtSGD(monthlyInvestment)}/month for {yearsNow} years @ 12% growth
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
                        {fmtSGD(futureValueNow)}
                      </div>
                      <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>
                        🏆 BEST OUTCOME
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Start 5 Years Later */}
                {yearsLater5 > 0 && (
                  <div style={{ 
                    padding: 16, 
                    background: '#fff', 
                    borderRadius: 8,
                    border: '2px solid #f59e0b'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                          ⚠️ START IN 5 YEARS (Age {age + 5})
                        </div>
                        <div style={{ fontSize: 12, color: '#92400e' }}>
                          Invest {fmtSGD(monthlyInvestment)}/month for {yearsLater5} years @ 12% growth
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                          {fmtSGD(futureValueLater5)}
                        </div>
                        <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
                          Lost: {fmtSGD(lost5Years)} 💸
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Start 10 Years Later */}
                {yearsLater10 > 0 && (
                  <div style={{ 
                    padding: 16, 
                    background: '#fff', 
                    borderRadius: 8,
                    border: '2px solid #ef4444'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
                          🚨 START IN 10 YEARS (Age {age + 10})
                        </div>
                        <div style={{ fontSize: 12, color: '#991b1b' }}>
                          Invest {fmtSGD(monthlyInvestment)}/month for {yearsLater10} years @ 12% growth
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
                          {fmtSGD(futureValueLater10)}
                        </div>
                        <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
                          Lost: {fmtSGD(lost10Years)} 💸💸
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(16, 185, 129, 0.3)', borderRadius: 6, fontSize: 15, fontWeight: 700, color: '#065f46', textAlign: 'center' }}>
            💚 The choice is yours: Start Today or Lose Hundreds of Thousands Tomorrow?
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Complete Financial Picture with Children */}
  {totalChildrenEducationCost > 0 && (
    <div style={{
      background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
      border: '2px solid #8b5cf6',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
        <h3 style={{ margin: 0, color: '#5b21b6', fontSize: 22, fontWeight: 700 }}>
          Your Complete Financial Picture
        </h3>
      </div>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '2px solid #8b5cf6' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#5b21b6', marginBottom: 8, fontWeight: 600 }}>
            📊 Total Financial Goals (Inflation-Adjusted):
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ background: '#faf5ff', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#5b21b6' }}>🌅 Retirement Nest Egg</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#5b21b6' }}>{fmtSGD(retirementNestEgg)}</span>
            </div>
            <div style={{ background: '#faf5ff', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#5b21b6' }}>🎓 Children's Education ({profile.children?.length || 0} {profile.children?.length === 1 ? 'child' : 'children'})</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#5b21b6' }}>{fmtSGD(totalChildrenEducationCost)}</span>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 15, color: '#fff', fontWeight: 600 }}>💎 TOTAL FINANCIAL GOAL</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{fmtSGD(retirementNestEgg + totalChildrenEducationCost)}</span>
            </div>
          </div>
        </div>
        <div style={{ background: '#fef3c7', padding: 14, borderRadius: 8, marginTop: 16, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 6 }}>
            💡 Smart Investment Strategy:
          </div>
          <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
            To reach your combined goal of <strong>{fmtSGD(retirementNestEgg + totalChildrenEducationCost)}</strong>, 
            consider investing approximately <strong>{fmtSGD((retirementNestEgg + totalChildrenEducationCost) / Math.max(1, yearsToRetirement * 12))}/month</strong> at 
            8% annual returns over {yearsToRetirement} years. The earlier you start, the less you need to invest monthly!
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Interest Rate Impact - Accumulation Phase */}
  {age > 0 && (cpfData?.takeHome || profile.takeHome) && (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <h3 style={{ marginTop: 0, color: '#374151' }}>📊 Accumulation Phase - Interest Rate Impact on Retirement</h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
        See how different investment returns affect your retirement savings over {yearsToRetirement} years
      </p>
      
      {/* Investment Scenario Rate Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <LabeledText
          label="Conservative Rate (%)"
          type="number"
          value={rate1}
          onChange={(val) => setRate1(val)}
          placeholder="0.05"
        />
        <LabeledText
          label="Moderate Rate (%)"
          type="number"
          value={rate2}
          onChange={(val) => setRate2(val)}
          placeholder="6"
        />
        <LabeledText
          label="Growth Rate (%)"
          type="number"
          value={rate3}
          onChange={(val) => setRate3(val)}
          placeholder="12"
        />
      </div>

      <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          💡 Investment Scenarios Comparison
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {(() => {
            const scenarios = [
              { rate: rate1, label: 'Conservative', color: '#000000' }, // Black
              { rate: rate2, label: 'Moderate', color: '#92400e' },     // Brown
              { rate: rate3, label: 'Growth', color: '#10b981' }        // Green
            ];
            
            const monthlySavings = cashflowData ? cashflowData.monthlySavings : 0;
            const months = yearsToRetirement * 12;
            
            // Calculate future values for all scenarios
            const scenariosWithValues = scenarios.map((scenario) => {
              const monthlyRate = toNum(scenario.rate) / 100 / 12;
              const futureValue = monthlySavings > 0 
                ? monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
                : 0;
              return { ...scenario, futureValue };
            });
            
            // Find the highest value
            const maxValue = Math.max(...scenariosWithValues.map(s => s.futureValue));
            
            return scenariosWithValues.map((scenario) => {
              const isHighest = scenario.futureValue === maxValue && maxValue > 0;
              
              return (
                <div key={scenario.label} style={{ 
                  padding: 12, 
                  background: isHighest ? '#f0fdf4' : '#fff', 
                  borderRadius: 6, 
                  borderLeft: `4px solid ${scenario.color}`,
                  border: isHighest ? `2px solid ${scenario.color}` : undefined
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        {scenario.label} ({scenario.rate}% annual)
                        {isHighest && <span style={{ marginLeft: 8, fontSize: 12, color: scenario.color }}>🏆 Best Growth</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {fmtSGD(monthlySavings)}/month for {yearsToRetirement} years
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: isHighest ? 24 : 18, 
                        fontWeight: isHighest ? 800 : 700, 
                        color: scenario.color 
                      }}>
                        {fmtSGD(scenario.futureValue)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* NEW: Investment Growth Visualization Chart */}
      {(() => {
        const monthlySavings = cashflowData ? cashflowData.monthlySavings : 0;
        
        if (monthlySavings <= 0) {
          return (
            <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8, border: '1px solid #fca5a5' }}>
              <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
                ⚠️ Enter your expenses in the sections above to see your monthly savings and investment projections
              </div>
            </div>
          );
        }

        // Generate projection data for all three scenarios
        const scenarios = [
          { rate: rate1, label: 'Conservative', color: '#000000' }, // Black
          { rate: rate2, label: 'Moderate', color: '#92400e' },     // Brown
          { rate: rate3, label: 'Growth', color: '#10b981' }        // Green
        ];

        // Calculate projections year by year
        const projectionData = [];
        const maxYears = Math.min(yearsToRetirement, 50); // Cap at 50 years for readability
        
        for (let year = 0; year <= maxYears; year++) {
          const currentAge = age + year;
          const dataPoint = {
            year,
            age: currentAge,
            ageLabel: `Age ${Math.round(currentAge)}`
          };
          
          scenarios.forEach((scenario) => {
            const monthlyRate = toNum(scenario.rate) / 100 / 12;
            const months = year * 12;
            const futureValue = year === 0 ? 0 : monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
            dataPoint[scenario.label] = futureValue;
          });
          
          projectionData.push(dataPoint);
        }

        // Find milestone years
        const milestones = [100000, 250000, 500000, 1000000, 1500000, 2000000];
        const scenarioMilestones = scenarios.map(scenario => {
          const reached = [];
          milestones.forEach(target => {
            const yearReached = projectionData.findIndex(d => d[scenario.label] >= target);
            if (yearReached > 0 && yearReached < projectionData.length) {
              reached.push({
                target,
                year: yearReached,
                age: age + yearReached
              });
            }
          });
          return { ...scenario, milestones: reached };
        });

        return (
          <>
            {/* Chart Section */}
            <div style={{ marginBottom: 20, padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
                📈 Investment Growth Over Time (Starting Age: {Math.round(age)})
              </div>
              
              <LineChart
                xLabels={projectionData.map(d => d.ageLabel)}
                series={scenarios.map(scenario => ({
                  name: `${scenario.label} (${scenario.rate}%)`,
                  values: projectionData.map(d => d[scenario.label]),
                  stroke: scenario.color
                }))}
                height={320}
                onFormatY={(val) => {
                  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
                  return fmtSGD(val);
                }}
                onFormatX={(label, idx) => {
                  // Show every 5 years or first/last
                  if (idx === 0 || idx === projectionData.length - 1 || idx % 5 === 0) {
                    return label;
                  }
                  return '';
                }}
              />

              <div style={{ marginTop: 12, fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
                Based on monthly investment of {fmtSGD(monthlySavings)} (your current monthly savings)
              </div>
            </div>

            {/* Milestone Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {scenarioMilestones.map((scenario) => (
                <div key={scenario.label} style={{ 
                  padding: 16, 
                  background: '#fff', 
                  borderRadius: 8, 
                  border: `2px solid ${scenario.color}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: scenario.color, 
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {scenario.label} ({scenario.rate}% p.a.)
                  </div>
                  
                  {scenario.milestones.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                      Reach $100K+ with longer investment horizon
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {scenario.milestones.slice(0, 4).map((milestone) => (
                        <div key={milestone.target} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: 8,
                          background: `${scenario.color}10`,
                          borderRadius: 4
                        }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                              {milestone.target >= 1000000 ? `$${milestone.target / 1000000}M` : `$${milestone.target / 1000}K`}
                            </div>
                            <div style={{ fontSize: 10, color: '#6b7280' }}>
                              Age {Math.round(milestone.age)}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: scenario.color }}>
                            {milestone.year} {milestone.year === 1 ? 'year' : 'years'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ 
                    marginTop: 12, 
                    paddingTop: 12, 
                    borderTop: `1px solid ${scenario.color}30`,
                    fontSize: 11,
                    color: '#6b7280'
                  }}>
                    Final value at age {Math.round(age + yearsToRetirement)}: {' '}
                    <span style={{ fontWeight: 700, color: scenario.color }}>
                      {fmtSGD(projectionData[projectionData.length - 1][scenario.label])}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Key Insights */}
            <div style={{ 
              marginTop: 20, 
              padding: 16, 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
              borderRadius: 8,
              border: '2px solid #f59e0b'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
                💡 Key Insights from Your Investment Scenarios:
              </div>
              <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
                {(() => {
                  const conservativeFinal = projectionData[projectionData.length - 1][scenarios[0].label];
                  const aggressiveFinal = projectionData[projectionData.length - 1][scenarios[2].label];
                  const difference = aggressiveFinal - conservativeFinal;
                  const percentDiff = ((difference / conservativeFinal) * 100).toFixed(0);
                  
                  return (
                    <>
                      <div style={{ marginBottom: 6 }}>
                        • <strong>Return Impact:</strong> The difference between conservative ({rate1}%) and aggressive ({rate3}%) investing is {fmtSGD(difference)} — that's {percentDiff}% more wealth!
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        • <strong>Time Advantage:</strong> Starting at age {Math.round(age)}, you have {yearsToRetirement} years for compound growth to work its magic
                      </div>
                      <div>
                        • <strong>Monthly Power:</strong> Your current monthly savings of {fmtSGD(monthlySavings)} can grow to between {fmtSGD(conservativeFinal)} and {fmtSGD(aggressiveFinal)} depending on investment choice
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  )}

  {/* Actual Retirement Age with Children */}
  {totalChildrenEducationCost > 0 && profile.children && profile.children.length > 0 && (
    <div style={{
      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
      border: '2px solid #0ea5e9',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 32 }}>🗓️</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, color: '#0c4a6e', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Your Actual Retirement Timeline with Children
          </h4>
          {(() => {
            // Calculate when youngest child finishes uni
            const currentYear = new Date().getFullYear();
            let latestRetirement = { year: 0, age: 0, childName: '' };
            profile.children.forEach(child => {
              if (!child.dobISO) return;
              const childDob = parseDob(child.dobISO);
              if (!childDob) return;
              const today = new Date();
              const ageInMonths = monthsSinceDob(childDob, today.getFullYear(), today.getMonth());
              const currentAge = Math.floor(ageInMonths / 12);
              const uniEndAge = child.gender === 'male' ? 24 : 22;
              const uniEndYear = currentYear + (uniEndAge - currentAge);
              const parentAgeAtUniEnd = age + (uniEndAge - currentAge);
              if (uniEndYear > latestRetirement.year) {
                latestRetirement = {
                  year: uniEndYear,
                  age: parentAgeAtUniEnd,
                  childName: child.name || 'Youngest child'
                };
              }

export default ProfileTab;
