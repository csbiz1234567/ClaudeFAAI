# ClaudeFAAI
FA APP
import React, { useState, useMemo, useRef, useEffect } from ‘react’;
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from ‘recharts’;

/* =========================
HELPER FUNCTIONS
========================= */
const toNum = (val, def = 0) => {
const n = parseFloat(String(val).replace(/[^0-9.-]/g, ‘’));
return isNaN(n) ? def : n;
};

const fmtSGD = (amt) => {
const num = typeof amt === ‘number’ ? amt : toNum(amt, 0);
return `SGD $${num.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const monthNames = [
‘Jan’, ‘Feb’, ‘Mar’, ‘Apr’, ‘May’, ‘Jun’,
‘Jul’, ‘Aug’, ‘Sep’, ‘Oct’, ‘Nov’, ‘Dec’
];

const parseDob = (iso) => {
if (!iso) return null;
const d = new Date(iso);
return isNaN(d.getTime()) ? null : d;
};

const monthsSinceDob = (dob, refYear, refMonth) => {
const dobYear = dob.getFullYear();
const dobMonth = dob.getMonth();
return (refYear - dobYear) * 12 + (refMonth - dobMonth);
};

/* =========================
UI COMPONENTS
========================= */
// A card for summary values, color-coded by tone
const Card = ({ title, value, tone = ‘info’, icon }) => {
const toneColors = {
success: { bg: ‘linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)’, border: ‘#10B981’, text: ‘#065F46’ },
info: { bg: ‘linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)’, border: ‘#3B82F6’, text: ‘#1E40AF’ },
warn: { bg: ‘linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)’, border: ‘#F59E0B’, text: ‘#92400E’ },
danger: { bg: ‘linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)’, border: ‘#EF4444’, text: ‘#991B1B’ },
};
const c = toneColors[tone] || toneColors.info;
return (
<div style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
<div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6, textTransform: ‘uppercase’ }}>
{icon && <span style={{ marginRight: 6 }}>{icon}</span>}
{title}
</div>
<div style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{value}</div>
</div>
);
};

// Label+text field combo
const LabeledText = ({ label, value, onChange, type = ‘text’, placeholder = ‘’ }) => (

  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: '2px solid #e5e7eb',
        borderRadius: 8,
        fontSize: 14,
      }}
    />
  </div>
);

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

// Tab button for switching between panels
const TabButton = ({ active, onClick, children }) => (
<button
onClick={onClick}
style={{
padding: ‘12px 20px’,
border: ‘none’,
borderBottom: active ? ‘3px solid #667eea’ : ‘3px solid transparent’,
background: active ? ‘linear-gradient(180deg, #f0f4ff 0%, #fff 100%)’ : ‘transparent’,
cursor: ‘pointer’,
fontSize: 14,
fontWeight: active ? 700 : 500,
color: active ? ‘#667eea’ : ‘#6B7280’,
borderRadius: ‘8px 8px 0 0’,
}}

```
{children}
```

  </button>
);

// Panel that shows only if active
const TabPanel = ({ active, children }) => (

  <div style={{ display: active ? 'block' : 'none' }}>{children}</div>
);

/* =========================
LINE CHART COMPONENT
========================= */

const LineChart = ({
xLabels,
series,
height = 260,
onFormatY = (v) => v,
onFormatX = (v) => v
}) => {
const [hoverIdx, setHoverIdx] = useState(null);
const svgRef = useRef(null);
const width = 800;
const basePad = { top: 20, right: 20, bottom: 40, left: 60 };

const estSlotPx = 60;
const maxLabels = Math.max(2, Math.floor((width - basePad.left - basePad.right) / estSlotPx));
const stride = Math.max(1, Math.ceil((xLabels?.length || 0) / maxLabels));
const xLabelAngle = stride >= 6 ? -60 : stride >= 3 ? -35 : 0;
const pad = { …basePad, bottom: xLabelAngle ? 70 : basePad.bottom };

const chartWidth = width - pad.left - pad.right;
const chartHeight = height - pad.top - pad.bottom;

const allValues = series.flatMap((s) => s.values);
const minVal = Math.min(0, …allValues);
const maxVal = Math.max(…allValues);
const range = maxVal - minVal || 1;

const xStep = chartWidth / Math.max(1, xLabels.length - 1);
const toY = (val) => pad.top + chartHeight - ((val - minVal) / range) * chartHeight;
const toX = (i) => pad.left + i * xStep;

const handleMouseMove = (e) => {
if (!svgRef.current) return;
const rect = svgRef.current.getBoundingClientRect();
const x = e.clientX - rect.left;
const idx = Math.round((x - pad.left) / xStep);
setHoverIdx(idx >= 0 && idx < xLabels.length ? idx : null);
};

const compactToAge = (txt) => {
const ageMatch = String(txt).match(/Age\s*(\d+(?:.\d+)?)/i);
if (ageMatch) return `Age ${Math.floor(parseFloat(ageMatch[1]))}`;
const yearMatch = String(txt).match(/\b(\d{4})\b/);
return yearMatch ? yearMatch[1] : txt;
};

return (
<div style={{ position: ‘relative’, width: ‘100%’, maxWidth: width }}>
<svg
ref={svgRef}
width={width}
height={height}
onMouseMove={handleMouseMove}
onMouseLeave={() => setHoverIdx(null)}
style={{ display: ‘block’, cursor: ‘crosshair’ }}
>
{[0, 0.25, 0.5, 0.75, 1].map((frac) => {
const val = minVal + frac * range;
const y = toY(val);
return (
<g key={frac}>
<line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke=’#E5E7EB’ strokeWidth={1} />
<text x={pad.left - 8} y={y + 4} textAnchor=‘end’ fontSize={11} fill=’#6B7280’>
{onFormatY(val)}
</text>
</g>
);
})}
{xLabels.map((raw, i) => {
const shouldShow = i === 0 || i === xLabels.length - 1 || i % stride === 0;
if (!shouldShow) return null;
const formatted = onFormatX ? onFormatX(raw, i) ?? raw : raw;
const text = stride >= 12 ? compactToAge(formatted || raw, i) : formatted || raw;
const x = toX(i);
const y = height - pad.bottom + (xLabelAngle ? 18 : 16);
return (
<text
key={i}
x={x}
y={y}
fontSize={10}
fill=’#6B7280’
textAnchor={xLabelAngle ? ‘end’ : ‘middle’}
transform={xLabelAngle ? `rotate(${xLabelAngle}, ${x}, ${y})` : undefined}
>
{text}
</text>
);
})}
{series.map((s, idx) => {
const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(’ ‘);
return <path key={idx} d={d} fill='none' stroke={s.stroke} strokeWidth={2} />;
})}
{hoverIdx !== null && (
<line
x1={toX(hoverIdx)}
y1={pad.top}
x2={toX(hoverIdx)}
y2={height - pad.bottom}
stroke=’#9CA3AF’
strokeWidth={1}
strokeDasharray=‘4 2’
/>
)}
</svg>

```
  {hoverIdx !== null && (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: toX(hoverIdx) + 10,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 12,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{xLabels[hoverIdx]}</div>
      {(() => {
        // Find the highest value at this index
        const valuesAtIdx = series.map(s => s.values[hoverIdx]);
        const maxValueAtIdx = Math.max(...valuesAtIdx);
        
        return series.map((s, i) => {
          const isHighest = s.values[hoverIdx] === maxValueAtIdx;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 2, background: s.stroke }} />
              <span style={{ 
                fontWeight: isHighest ? 700 : 400,
                fontSize: isHighest ? 13 : 12
              }}>
                {s.name}: {onFormatY(s.values[hoverIdx])}
                {isHighest && ' 🏆'}
              </span>
            </div>
          );
        });
      })()}
    </div>
  )}

  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, justifyContent: 'center' }}>
    {(() => {
      // Find the highest final value
      const finalValues = series.map(s => s.values[s.values.length - 1]);
      const maxFinalValue = Math.max(...finalValues);
      
      return series.map((s, i) => {
        const finalValue = s.values[s.values.length - 1];
        const isHighest = finalValue === maxFinalValue && maxFinalValue > 0;
        
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 3, background: s.stroke }} />
            <span style={{ 
              fontWeight: isHighest ? 700 : 500,
              fontSize: isHighest ? 16 : 12,
              color: isHighest ? s.stroke : '#374151'
            }}>
              {s.name}
              {isHighest && ' 🏆'}
            </span>
          </div>
        );
      });
    })()}
  </div>
</div>
```

);
};

/* =========================
CPF ENGINE
========================= */
const getCpfRates = (age) => {
if (age <= 35) return { employee: 0.20, employer: 0.17 };
if (age <= 45) return { employee: 0.20, employer: 0.17 };
if (age <= 50) return { employee: 0.20, employer: 0.17 };
if (age <= 55) return { employee: 0.20, employer: 0.17 };
if (age <= 60) return { employee: 0.17, employer: 0.155 };
if (age <= 65) return { employee: 0.115, employer: 0.12 };
if (age <= 70) return { employee: 0.075, employer: 0.09 };
return { employee: 0.05, employer: 0.075 };
};

/* =========================
CPF HELPER FUNCTION
========================= */
// Returns the CPF allocation rates for OA, SA, MA based on age
const getCPFRates = (age) => {
if (age < 35) return { oa: 0.6217, sa: 0.1622, ma: 0.2162 };
if (age < 45) return { oa: 0.5676, sa: 0.1892, ma: 0.2432 };
if (age < 50) return { oa: 0.5135, sa: 0.2162, ma: 0.2703 };
if (age < 55) return { oa: 0.4324, sa: 0.2703, ma: 0.2973 };
if (age < 60) return { oa: 0.2973, sa: 0.3514, ma: 0.3514 };
if (age < 65) return { oa: 0.1351, sa: 0.3919, ma: 0.4730 };
return { oa: 0, sa: 0, ma: 0 };
};

const getCpfAllocation = (age) => {
// Simplified 2025 allocation ratios (adjust as needed)
if (age <= 35) return { oa: 0.6216, sa: 0.1622, ma: 0.2162 };
if (age <= 45) return { oa: 0.5405, sa: 0.1892, ma: 0.2703 };
if (age <= 50) return { oa: 0.4595, sa: 0.2162, ma: 0.3243 };
if (age <= 55) return { oa: 0.3784, sa: 0.2432, ma: 0.3784 };
if (age <= 60) return { oa: 0.4211, sa: 0.2632, ma: 0.3158 };
if (age <= 65) return { oa: 0.3478, sa: 0.1739, ma: 0.4783 };
return { oa: 0.3333, sa: 0.1667, ma: 0.5000 };
};

const computeCpf = (monthlyIncome, age) => {
const rates = getCpfRates(age);
const allocation = getCpfAllocation(age);

const employeeContrib = monthlyIncome * rates.employee;
const employerContrib = monthlyIncome * rates.employer;
const totalContrib = employeeContrib + employerContrib;

return {
employee: employeeContrib,
employer: employerContrib,
total: totalContrib,
oa: totalContrib * allocation.oa,
sa: totalContrib * allocation.sa,
ma: totalContrib * allocation.ma,
takeHome: monthlyIncome - employeeContrib
};
};

/* =========================
RETIREMENT ENGINE
========================= */
const computeRetirementProjection = (initialAmount, monthlyContribution, annualReturn, yearsToProject) => {
const monthlyRate = annualReturn / 12;
const months = yearsToProject * 12;
const projection = [];

let balance = initialAmount;
let totalContributions = initialAmount;

for (let m = 0; m <= months; m++) {
if (m > 0) {
balance = balance * (1 + monthlyRate) + monthlyContribution;
totalContributions += monthlyContribution;
}

```
if (m % 12 === 0) {
  projection.push({
    year: m / 12,
    balance: Math.round(balance),
    contributions: Math.round(totalContributions),
    gains: Math.round(balance - totalContributions)
  });
}
```

}

return projection;
};

/* =========================
DISCLAIMER TAB (MAS Compliance)
========================= */
const DisclaimerTab = () => {
const [hasAgreed, setHasAgreed] = useState(false);

useEffect(() => {
// Check if user has already agreed in this session
const agreed = sessionStorage.getItem(‘disclaimer_agreed’);
if (agreed === ‘true’) {
setHasAgreed(true);
}
}, []);

useEffect(() => {
if (hasAgreed) {
sessionStorage.setItem(‘disclaimer_agreed’, ‘true’);
}
}, [hasAgreed]);

return (
<div style={{ padding: 24, maxWidth: 900, margin: ‘0 auto’ }}>
{/* Simple Header */}
<div style={{
background: ‘#ffffff’,
border: ‘2px solid #1f2937’,
borderRadius: 12,
padding: 32,
marginBottom: 32,
textAlign: ‘center’
}}>
<div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
<h1 style={{ margin: 0, color: ‘#1f2937’, fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
Before You Begin
</h1>
<p style={{ margin: 0, color: ‘#6b7280’, fontSize: 16, lineHeight: 1.6, maxWidth: 600, marginLeft: ‘auto’, marginRight: ‘auto’ }}>
This is a planning tool to help you explore financial scenarios. Please take a moment to understand what it is—and what it isn’t.
</p>
</div>

```
  {/* Main Disclaimer Content */}
  <div style={{ 
    background: '#ffffff', 
    borderRadius: 12, 
    padding: 32,
    border: '2px solid #e5e7eb',
    marginBottom: 24
  }}>
    
    {/* What This Is */}
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
        What This Tool Is
      </h2>
      <ul style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginLeft: 20, marginTop: 12 }}>
        <li>An <strong>educational calculator</strong> to explore financial scenarios and understand how different decisions might impact your future</li>
        <li>A <strong>starting point</strong> for conversations with qualified financial advisers</li>
        <li>Based on <strong>simplified assumptions</strong> about CPF rates, investment returns, and life events that may not match reality</li>
      </ul>
    </div>

    {/* What This Isn't */}
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
        What This Tool Isn't
      </h2>
      <ul style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginLeft: 20, marginTop: 12 }}>
        <li><strong>Not financial advice</strong> — We're not licensed financial advisers, and this doesn't replace professional guidance</li>
        <li><strong>Not a guarantee</strong> — Projections are estimates based on assumptions that may change</li>
        <li><strong>Not a promise of results</strong> — Actual market performance, policy changes, and personal circumstances will differ</li>
      </ul>
    </div>

    {/* Important Points */}
    <div style={{ 
      padding: 24, 
      background: '#f9fafb', 
      borderRadius: 10, 
      border: '2px solid #d1d5db',
      marginBottom: 24
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: 16 }}>
        Please Remember
      </h3>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
        <p style={{ marginTop: 0, marginBottom: 12 }}>
          <strong>Capital is non-guaranteed.</strong> Past performance doesn't guarantee future results. Investments carry risk, and capital may be lost.
        </p>
        <p style={{ marginTop: 0, marginBottom: 12 }}>
          <strong>Consult professionals.</strong> Before making any financial decisions, speak with licensed financial advisers, tax professionals, and legal advisors who can assess your specific situation.
        </p>
        <p style={{ marginTop: 0, marginBottom: 0 }}>
          <strong>You're responsible.</strong> Any decisions you make based on this tool are your own. We're not liable for any outcomes, losses, or damages.
        </p>
      </div>
    </div>

    {/* Agreement Checkbox */}
    <div style={{ 
      padding: 24, 
      background: '#ffffff', 
      borderRadius: 10, 
      border: '2px solid #1f2937',
    }}>
      <label style={{ display: 'flex', gap: 16, cursor: 'pointer', alignItems: 'start' }}>
        <input
          type="checkbox"
          checked={hasAgreed}
          onChange={(e) => setHasAgreed(e.target.checked)}
          style={{ width: 24, height: 24, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
            I understand and agree
          </div>
          <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
            I acknowledge this is an educational tool, not financial advice. I'll consult licensed professionals before making financial decisions. 
            I understand capital is non-guaranteed and I'm responsible for verifying information and any decisions I make. 
            The developers have no liability for outcomes or losses.
          </div>
        </div>
      </label>
    </div>
  </div>

  {/* Status Message */}
  {hasAgreed ? (
    <div style={{ 
      padding: 24, 
      background: '#ffffff', 
      borderRadius: 12, 
      border: '2px solid #1f2937',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <p style={{ margin: 0, fontSize: 18, color: '#1f2937', fontWeight: 600, marginBottom: 8 }}>
        Ready to start
      </p>
      <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>
        Head to the <strong>Profile</strong> tab to begin your financial planning
      </p>
    </div>
  ) : (
    <div style={{ 
      padding: 24, 
      background: '#ffffff', 
      borderRadius: 12, 
      border: '2px solid #d1d5db',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
      <p style={{ margin: 0, fontSize: 16, color: '#4b5563' }}>
        Please read and check the box above to continue
      </p>
    </div>
  )}

  {/* Footer */}
  <div style={{ 
    marginTop: 24,
    padding: 16, 
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af'
  }}>
    <p style={{ margin: 0 }}>
      Last Updated: November 13, 2025 | Singapore Financial Advisory App v1.0
    </p>
  </div>
</div>
```

);
};

/* =========================
TAB COMPONENTS (Outside main component to prevent re-creation)
========================= */
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

```
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
```

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

```
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
            });

            if (latestRetirement.year === 0) return null;
            const standardRetirementAge = toNum(profile.retirementAge, 65);
            const delayedYears = Math.max(0, latestRetirement.age - standardRetirementAge);

            return (
              <div style={{ fontSize: 14, color: '#0c4a6e', lineHeight: 1.7 }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: 14, borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    📅 Standard Retirement Plan: Age {standardRetirementAge}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    This is when most people retire, but with children, your timeline may differ.
                  </div>
                </div>
                <div style={{
                  background: delayedYears > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  padding: 14,
                  borderRadius: 8,
                  border: delayedYears > 0 ? '2px solid #f59e0b' : '2px solid #10b981'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>
                    {delayedYears > 0 ? '⚠️' : '✅'} Your Realistic Retirement: Age {latestRetirement.age} ({latestRetirement.year})
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    {latestRetirement.childName} finishes university in {latestRetirement.year} when you'll be {latestRetirement.age} years old.
                  </div>
                  {delayedYears > 0 ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                      ⏰ That's {delayedYears} {delayedYears === 1 ? 'year' : 'years'} later than standard retirement! 
                      Plan your savings to last from age {latestRetirement.age}, not {standardRetirementAge}.
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                      🎉 Great news! You can retire at or before standard retirement age while supporting your children's education.
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.9 }}>
                    💡 <strong>Pro Tip:</strong> Check the Children tab for a detailed timeline showing exactly when each education cost hits!
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  )}
</div>
```

);
};

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

```
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
```

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
background: ‘linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)’,
border: ‘2px solid #3b82f6’,
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: ‘0 4px 12px rgba(59, 130, 246, 0.15)’
}}>
<h3 style={{ marginTop: 0, color: ‘#1e40af’, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
💼 Your Current CPF Balances
</h3>
<p style={{ margin: ‘0 0 20px 0’, color: ‘#3b82f6’, fontSize: 13 }}>
Enter your current CPF account balances to see accurate projections
</p>

```
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
```

);
};

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

```
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
```

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
{ key: ‘housing’, label: ‘Housing’ },
{ key: ‘food’, label: ‘Food & Dining’ },
{ key: ‘transport’, label: ‘Transport’ },
{ key: ‘insurance’, label: ‘Insurance’ },
{ key: ‘entertainment’, label: ‘Entertainment’ },
{ key: ‘others’, label: ‘Others’ }
];

const pieColors = [’#3b82f6’, ‘#10b981’, ‘#f59e0b’, ‘#ef4444’, ‘#8b5cf6’, ‘#6b7280’];
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
background: ‘linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)’,
border: ‘2px solid #10b981’,
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: ‘0 4px 12px rgba(16, 185, 129, 0.3)’
}}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 12 }}>
<div style={{ fontSize: 32 }}>💸</div>
<div style={{ flex: 1 }}>
<h3 style={{ margin: 0, color: ‘#065f46’, fontSize: 20 }}>
{profile.name ? `${profile.name}'s Lifetime Cashflow Projection` : ‘Lifetime Cashflow Projection’}
</h3>
<p style={{ margin: ‘4px 0 0’, color: ‘#065f46’, fontSize: 14, opacity: 0.8 }}>
Track monthly income, expenses, savings, and withdrawals from age {currentAge} to {projectToAge}
</p>
</div>
</div>
</div>

```
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
```

);
};

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

```
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
```

);
};

const PropertyTab = ({ age, cpfData }) => {
// Property Details
const [propertyPrice, setPropertyPrice] = useState(’’);
const [propertyType, setPropertyType] = useState(‘hdb’); // hdb, condo, landed
const [propertyAge, setPropertyAge] = useState(’’);
const [annualValue, setAnnualValue] = useState(’’);

// Loan Details
const [downPaymentPercent, setDownPaymentPercent] = useState(‘25’);
const [loanTenure, setLoanTenure] = useState(‘25’);
const [interestRate, setInterestRate] = useState(‘3.5’);
const [useCpfOa, setUseCpfOa] = useState(true);
const [cpfOaAmount, setCpfOaAmount] = useState(’’);

// Additional Costs
const [bsdWaiver, setBsdWaiver] = useState(false);
const [isFirstTimer, setIsFirstTimer] = useState(true);

// Calculate BSD (Buyer’s Stamp Duty)
const calculateBSD = (price) => {
const p = toNum(price);
if (p <= 0) return 0;

```
let bsd = 0;
if (p <= 180000) {
  bsd = p * 0.01;
} else if (p <= 360000) {
  bsd = 1800 + (p - 180000) * 0.02;
} else if (p <= 1000000) {
  bsd = 1800 + 3600 + (p - 360000) * 0.03;
} else if (p <= 1500000) {
  bsd = 1800 + 3600 + 19200 + (p - 1000000) * 0.04;
} else {
  bsd = 1800 + 3600 + 19200 + 20000 + (p - 1500000) * 0.05;
}

// First-timer HDB waiver
if (bsdWaiver && propertyType === 'hdb' && isFirstTimer) {
  return 0;
}

return bsd;
```

};

// Calculate ABSD (Additional Buyer’s Stamp Duty)
const calculateABSD = (price) => {
if (isFirstTimer && propertyType === ‘hdb’) return 0;
if (isFirstTimer && propertyType !== ‘hdb’) return 0;

```
// Second property onwards
const p = toNum(price);
if (propertyType === 'hdb') return p * 0.20; // 20% for 2nd HDB
return p * 0.20; // 20% for 2nd private
```

};

// Calculate Property Tax
const calculatePropertyTax = () => {
const av = toNum(annualValue);
if (av <= 0) return 0;

```
let tax = 0;
if (propertyType === 'hdb') {
  // Owner-occupied HDB rates
  if (av <= 8000) {
    tax = 0;
  } else if (av <= 30000) {
    tax = (av - 8000) * 0.04;
  } else if (av <= 40000) {
    tax = 880 + (av - 30000) * 0.05;
  } else if (av <= 55000) {
    tax = 880 + 500 + (av - 40000) * 0.07;
  } else if (av <= 70000) {
    tax = 880 + 500 + 1050 + (av - 55000) * 0.10;
  } else if (av <= 85000) {
    tax = 880 + 500 + 1050 + 1500 + (av - 70000) * 0.14;
  } else {
    tax = 880 + 500 + 1050 + 1500 + 2100 + (av - 85000) * 0.18;
  }
} else {
  // Owner-occupied residential (condo/landed) rates
  if (av <= 8000) {
    tax = 0;
  } else if (av <= 55000) {
    tax = (av - 8000) * 0.04;
  } else if (av <= 70000) {
    tax = 1880 + (av - 55000) * 0.06;
  } else if (av <= 85000) {
    tax = 1880 + 900 + (av - 70000) * 0.08;
  } else if (av <= 100000) {
    tax = 1880 + 900 + 1200 + (av - 85000) * 0.10;
  } else {
    tax = 1880 + 900 + 1200 + 1500 + (av - 100000) * 0.12;
  }
}

return tax;
```

};

// Calculate total upfront costs
const price = toNum(propertyPrice);
const downPayment = price * (toNum(downPaymentPercent) / 100);
const bsd = calculateBSD(price);
const absd = calculateABSD(price);
const legalFees = price > 0 ? Math.min(3000, price * 0.004) : 0;
const valuationFee = 500;
const totalUpfrontCash = downPayment + bsd + absd + legalFees + valuationFee;

// CPF OA usage
const cpfOaUsed = useCpfOa ? Math.min(toNum(cpfOaAmount), downPayment) : 0;
const cashNeeded = totalUpfrontCash - cpfOaUsed;

// Loan calculations
const loanAmount = price - downPayment;
const monthlyRate = toNum(interestRate) / 100 / 12;
const numPayments = toNum(loanTenure) * 12;
const monthlyPayment = loanAmount > 0 && monthlyRate > 0
? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
: 0;
const totalPayment = monthlyPayment * numPayments;
const totalInterest = totalPayment - loanAmount;

// Property tax
const annualPropertyTax = calculatePropertyTax();
const monthlyPropertyTax = annualPropertyTax / 12;

// Total monthly cost
const totalMonthlyCost = monthlyPayment + monthlyPropertyTax;

// Affordability check
const takeHome = cpfData?.takeHome || 0;
const affordabilityRatio = takeHome > 0 ? (totalMonthlyCost / takeHome) * 100 : 0;

// Generate amortization schedule (first 5 years)
const generateAmortization = () => {
const schedule = [];
let remainingBalance = loanAmount;

```
for (let month = 1; month <= Math.min(60, numPayments); month++) {
  const interestPayment = remainingBalance * monthlyRate;
  const principalPayment = monthlyPayment - interestPayment;
  remainingBalance -= principalPayment;
  
  if (month % 12 === 0) {
    schedule.push({
      year: month / 12,
      age: Math.round(age + (month / 12)),
      monthlyPayment,
      yearlyPayment: monthlyPayment * 12,
      principalPaid: principalPayment * 12,
      interestPaid: interestPayment * 12,
      remainingBalance
    });
  }
}

return schedule;
```

};

const amortization = generateAmortization();

return (
<div style={{ padding: 20 }}>
{/* Header */}
<div style={{
background: ‘linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)’,
border: ‘2px solid #f59e0b’,
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: ‘0 4px 12px rgba(245, 158, 11, 0.15)’
}}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 12 }}>
<div style={{ fontSize: 32 }}>🏠</div>
<div>
<h3 style={{ margin: 0, color: ‘#92400e’, fontSize: 20, fontWeight: 700 }}>
Property & Mortgage Calculator
</h3>
<p style={{ margin: ‘4px 0 0’, color: ‘#92400e’, fontSize: 13 }}>
Calculate property tax, loan payments, and plan your show funds
</p>
</div>
</div>
</div>

```
  {/* Property Details Section */}
  <div style={{ 
    background: '#fff', 
    borderRadius: 12, 
    padding: 24, 
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }}>
    <h3 style={{ marginTop: 0, color: '#1F2937', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
      🏘️ Property Details
    </h3>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <div>
        <LabeledText
          label="Property Price (SGD)"
          value={propertyPrice}
          onChange={setPropertyPrice}
          placeholder="800000"
        />
      </div>
      
      <div>
        <LabeledSelect
          label="Property Type"
          value={propertyType}
          onChange={setPropertyType}
          options={[
            { label: '🏢 HDB Flat', value: 'hdb' },
            { label: '🏙️ Condominium', value: 'condo' },
            { label: '🏡 Landed Property', value: 'landed' }
          ]}
        />
      </div>
      
      <div>
        <LabeledText
          label="Property Age (years)"
          value={propertyAge}
          onChange={setPropertyAge}
          placeholder="10"
        />
      </div>
      
      <div>
        <LabeledText
          label="Annual Value (SGD)"
          value={annualValue}
          onChange={setAnnualValue}
          placeholder="24000"
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          Used for property tax calculation
        </div>
      </div>
    </div>
    
    <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={isFirstTimer}
          onChange={(e) => setIsFirstTimer(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        <span>First-time homebuyer</span>
      </label>
      
      {isFirstTimer && propertyType === 'hdb' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={bsdWaiver}
            onChange={(e) => setBsdWaiver(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span>Apply BSD waiver (first-time HDB)</span>
        </label>
      )}
    </div>
  </div>
  
  {/* Loan Details Section */}
  <div style={{ 
    background: '#fff', 
    borderRadius: 12, 
    padding: 24, 
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }}>
    <h3 style={{ marginTop: 0, color: '#1F2937', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
      💰 Loan Details
    </h3>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <div>
        <LabeledText
          label="Down Payment (%)"
          value={downPaymentPercent}
          onChange={setDownPaymentPercent}
          placeholder="25"
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          Min: 25% for HDB, 25% for private
        </div>
      </div>
      
      <div>
        <LabeledText
          label="Loan Tenure (years)"
          value={loanTenure}
          onChange={setLoanTenure}
          placeholder="25"
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          Max: 25 years for HDB, 30 for private
        </div>
      </div>
      
      <div>
        <LabeledText
          label="Interest Rate (% p.a.)"
          value={interestRate}
          onChange={setInterestRate}
          placeholder="3.5"
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          Current avg: 3.5% - 4.5%
        </div>
      </div>
    </div>
    
    <div style={{ marginTop: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer', marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={useCpfOa}
          onChange={(e) => setUseCpfOa(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        <span>Use CPF OA for down payment</span>
      </label>
      
      {useCpfOa && (
        <div style={{ marginLeft: 24 }}>
          <LabeledText
            label="CPF OA Amount Available (SGD)"
            value={cpfOaAmount}
            onChange={setCpfOaAmount}
            placeholder="100000"
          />
        </div>
      )}
    </div>
  </div>
  
  {/* Upfront Costs Breakdown */}
  {price > 0 && (
    <div style={{ 
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
      borderRadius: 12, 
      padding: 24, 
      marginBottom: 20,
      border: '2px solid #3b82f6',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
    }}>
      <h3 style={{ marginTop: 0, color: '#1e40af', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        💵 Upfront Costs Breakdown
      </h3>
      
      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fff', borderRadius: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>Down Payment ({downPaymentPercent}%)</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(downPayment)}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fff', borderRadius: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>
            Buyer's Stamp Duty (BSD)
            {bsdWaiver && <span style={{ color: '#10b981', fontSize: 12, marginLeft: 8 }}>✓ Waived</span>}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(bsd)}</span>
        </div>
        
        {absd > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fef2f2', borderRadius: 6, border: '1px solid #fca5a5' }}>
            <span style={{ fontSize: 14, color: '#991b1b' }}>Additional Buyer's Stamp Duty (ABSD)</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{fmtSGD(absd)}</span>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fff', borderRadius: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>Legal Fees</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(legalFees)}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fff', borderRadius: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>Valuation Fee</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(valuationFee)}</span>
        </div>
      </div>
      
      <div style={{ borderTop: '2px solid #3b82f6', paddingTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af' }}>Total Upfront Costs</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#1e40af' }}>{fmtSGD(totalUpfrontCash)}</span>
        </div>
        
        {useCpfOa && cpfOaUsed > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#065f46' }}>Less: CPF OA Used</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>-{fmtSGD(cpfOaUsed)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#f0fdf4', borderRadius: 8, border: '2px solid #10b981' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#065f46' }}>💰 Cash Needed (Show Funds)</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>{fmtSGD(cashNeeded)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )}
  
  {/* Monthly Payment Summary */}
  {price > 0 && loanAmount > 0 && (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Card
          title="Monthly Loan Payment"
          value={fmtSGD(monthlyPayment)}
          tone="info"
          icon="🏦"
        />
        <Card
          title="Monthly Property Tax"
          value={fmtSGD(monthlyPropertyTax)}
          tone="warn"
          icon="🏛️"
        />
        <Card
          title="Total Monthly Cost"
          value={fmtSGD(totalMonthlyCost)}
          tone={affordabilityRatio <= 30 ? 'success' : affordabilityRatio <= 40 ? 'warn' : 'danger'}
          icon="💳"
        />
        <Card
          title="Affordability Ratio"
          value={`${affordabilityRatio.toFixed(1)}%`}
          tone={affordabilityRatio <= 30 ? 'success' : affordabilityRatio <= 40 ? 'warn' : 'danger'}
          icon="📊"
        />
      </div>
      
      {/* Affordability Alert */}
      {takeHome > 0 && (
        <div style={{
          padding: 16,
          background: affordabilityRatio <= 30 ? '#f0fdf4' : affordabilityRatio <= 40 ? '#fef3c7' : '#fef2f2',
          border: `2px solid ${affordabilityRatio <= 30 ? '#10b981' : affordabilityRatio <= 40 ? '#f59e0b' : '#ef4444'}`,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: affordabilityRatio <= 30 ? '#065f46' : affordabilityRatio <= 40 ? '#92400e' : '#991b1b', marginBottom: 8 }}>
            {affordabilityRatio <= 30 ? '✅ Affordable!' : affordabilityRatio <= 40 ? '⚠️ Moderate Stretch' : '🚨 High Risk'}
          </div>
          <div style={{ fontSize: 13, color: affordabilityRatio <= 30 ? '#065f46' : affordabilityRatio <= 40 ? '#92400e' : '#991b1b', lineHeight: 1.6 }}>
            {affordabilityRatio <= 30 
              ? `Your housing cost is ${affordabilityRatio.toFixed(1)}% of take-home income. This is healthy and leaves room for other expenses.`
              : affordabilityRatio <= 40
              ? `Your housing cost is ${affordabilityRatio.toFixed(1)}% of take-home income. This is manageable but tight. Consider a smaller property or longer tenure.`
              : `Your housing cost is ${affordabilityRatio.toFixed(1)}% of take-home income. This is risky! You may struggle with other expenses. Consider a cheaper property.`
            }
          </div>
        </div>
      )}
      
      {/* Loan Summary */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, color: '#1F2937', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          📊 Loan Summary
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Loan Amount</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>{fmtSGD(loanAmount)}</div>
          </div>
          
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Total Interest Paid</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{fmtSGD(totalInterest)}</div>
          </div>
          
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Total Payment</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>{fmtSGD(totalPayment)}</div>
          </div>
          
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Interest as % of Loan</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
              {((totalInterest / loanAmount) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Amortization Schedule */}
      {amortization.length > 0 && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#1F2937', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            📅 Amortization Schedule (First 5 Years)
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, borderBottom: '2px solid #e5e7eb' }}>Year</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, borderBottom: '2px solid #e5e7eb' }}>Your Age</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 700, borderBottom: '2px solid #e5e7eb' }}>Yearly Payment</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 700, borderBottom: '2px solid #e5e7eb' }}>Principal</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 700, borderBottom: '2px solid #e5e7eb' }}>Interest</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 700, borderBottom: '2px solid #e5e7eb' }}>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {amortization.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>Year {row.year}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{row.age}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{fmtSGD(row.yearlyPayment)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmtSGD(row.principalPaid)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{fmtSGD(row.interestPaid)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#5b21b6' }}>{fmtSGD(row.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
            💡 Notice how in early years, most of your payment goes to interest (red). Over time, more goes to principal (green).
          </div>
        </div>
      )}
    </>
  )}
</div>
```

);
};

const InvestorTab = () => {
const [portfolioValue, setPortfolioValue] = useState(‘500000’);
const [portfolioType, setPortfolioType] = useState(‘stock-picking’); // stock-picking, diversified, index

const value = toNum(portfolioValue, 0);

// Volatility scenarios based on portfolio type
const volatilityScenarios = {
‘stock-picking’: {
name: ‘Stock Picking (5-10 stocks)’,
best: 0.30,      // +30% best case
normal: 0.15,    // +15% normal bull market
mild: -0.10,     // -10% correction
moderate: -0.20, // -20% moderate drawdown
severe: -0.35,   // -35% bear market
crash: -0.50,    // -50% severe crash
color: ‘#dc2626’,
recovery: ‘2-5+ years’
},
‘diversified’: {
name: ‘Diversified Portfolio (20-50 stocks)’,
best: 0.25,
normal: 0.12,
mild: -0.08,
moderate: -0.15,
severe: -0.25,
crash: -0.35,
color: ‘#f59e0b’,
recovery: ‘1-3 years’
},
‘index’: {
name: ‘Index Fund (S&P 500)’,
best: 0.20,
normal: 0.10,
mild: -0.05,
moderate: -0.10,
severe: -0.20,
crash: -0.30,
color: ‘#10b981’,
recovery: ‘6-18 months’
}
};

const scenario = volatilityScenarios[portfolioType];

const calculations = {
best: { value: value * (1 + scenario.best), change: value * scenario.best },
normal: { value: value * (1 + scenario.normal), change: value * scenario.normal },
mild: { value: value * (1 + scenario.mild), change: value * scenario.mild },
moderate: { value: value * (1 + scenario.moderate), change: value * scenario.moderate },
severe: { value: value * (1 + scenario.severe), change: value * scenario.severe },
crash: { value: value * (1 + scenario.crash), change: value * scenario.crash }
};

return (
<div style={{ padding: 20 }}>
{/* Header Banner */}
<div style={{
background: ‘linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)’,
border: ‘2px solid #4f46e5’,
borderRadius: 12,
padding: 24,
marginBottom: 20,
boxShadow: ‘0 4px 12px rgba(79, 70, 229, 0.3)’
}}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 12 }}>
<div style={{ fontSize: 48 }}>📈</div>
<div style={{ flex: 1 }}>
<h3 style={{ margin: 0, color: ‘#fff’, fontSize: 24, fontWeight: 700 }}>
Investor Education: Self-Directed vs Professional Management
</h3>
<p style={{ margin: ‘4px 0 0’, color: ‘#c7d2fe’, fontSize: 14 }}>
Understanding the realities of managing your own investments
</p>
</div>
</div>
</div>

```
  {/* NEW: Interactive Portfolio Volatility Calculator */}
  <div style={{ background: '#fff', border: '3px solid #dc2626', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
    <h3 style={{ marginTop: 0, color: '#991b1b', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
      💰 Your Portfolio Risk Calculator
    </h3>
    <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14 }}>
      See exactly how much money you could gain or lose based on realistic market volatility
    </p>
    
    {/* Input Section */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Your Portfolio Value (SGD)
        </label>
        <input
          type="text"
          value={portfolioValue}
          onChange={(e) => setPortfolioValue(e.target.value)}
          placeholder="500000"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 700,
            color: '#1F2937'
          }}
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Investment Strategy
        </label>
        <select 
          value={portfolioType} 
          onChange={(e) => setPortfolioType(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px 16px', 
            border: '2px solid #e5e7eb', 
            borderRadius: 8, 
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <option value="stock-picking">🎯 Stock Picking (5-10 stocks)</option>
          <option value="diversified">📊 Diversified (20-50 stocks)</option>
          <option value="index">🏛️ Index Fund (S&P 500)</option>
        </select>
      </div>
    </div>

    {/* Current Value Display */}
    <div style={{ 
      padding: 20, 
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
      borderRadius: 12, 
      marginBottom: 20,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 14, color: '#dbeafe', marginBottom: 8, fontWeight: 600 }}>
        CURRENT PORTFOLIO VALUE
      </div>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
        {fmtSGD(value)}
      </div>
      <div style={{ fontSize: 13, color: '#bfdbfe' }}>
        Strategy: {scenario.name}
      </div>
    </div>

    {/* Scenario Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
      {/* Best Case */}
      <div style={{ 
        padding: 16, 
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
        borderRadius: 10,
        border: '2px solid #10b981'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#065f46', marginBottom: 6, textTransform: 'uppercase' }}>
          🚀 Best Case (+{(scenario.best * 100).toFixed(0)}%)
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#065f46', marginBottom: 4 }}>
          {fmtSGD(calculations.best.value)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
          +{fmtSGD(calculations.best.change)}
        </div>
      </div>

      {/* Normal Bull */}
      <div style={{ 
        padding: 16, 
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
        borderRadius: 10,
        border: '2px solid #3b82f6'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#1e40af', marginBottom: 6, textTransform: 'uppercase' }}>
          📈 Normal Bull (+{(scenario.normal * 100).toFixed(0)}%)
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1e40af', marginBottom: 4 }}>
          {fmtSGD(calculations.normal.value)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6' }}>
          +{fmtSGD(calculations.normal.change)}
        </div>
      </div>

      {/* Mild Correction */}
      <div style={{ 
        padding: 16, 
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
        borderRadius: 10,
        border: '2px solid #f59e0b'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 6, textTransform: 'uppercase' }}>
          ⚠️ Mild Drop ({(scenario.mild * 100).toFixed(0)}%)
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>
          {fmtSGD(calculations.mild.value)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
          {fmtSGD(calculations.mild.change)}
        </div>
      </div>

      {/* Moderate Drawdown */}
      <div style={{ 
        padding: 16, 
        background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)', 
        borderRadius: 10,
        border: '2px solid #f97316'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#7c2d12', marginBottom: 6, textTransform: 'uppercase' }}>
          ⚠️ Moderate ({(scenario.moderate * 100).toFixed(0)}%)
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#7c2d12', marginBottom: 4 }}>
          {fmtSGD(calculations.moderate.value)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ea580c' }}>
          {fmtSGD(calculations.moderate.change)}
        </div>
      </div>

      {/* Severe Bear Market */}
      <div style={{ 
        padding: 16, 
        background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)', 
        borderRadius: 10,
        border: '2px solid #ef4444'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 6, textTransform: 'uppercase' }}>
          🔴 Severe Bear ({(scenario.severe * 100).toFixed(0)}%)
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>
          {fmtSGD(calculations.severe.value)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
          {fmtSGD(calculations.severe.change)}
        </div>
      </div>

      {/* Crash Scenario */}
      <div style={{ 
        padding: 16, 
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', 
        borderRadius: 10,
        border: '3px solid #450a0a',
        boxShadow: '0 4px 12px rgba(127, 29, 29, 0.5)'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#fee2e2', marginBottom: 6, textTransform: 'uppercase' }}>
          💀 CRASH ({(scenario.crash * 100).toFixed(0)}%)
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          {fmtSGD(calculations.crash.value)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fecaca' }}>
          {fmtSGD(calculations.crash.change)}
        </div>
      </div>
    </div>

    {/* Recovery Time Alert */}
    <div style={{ 
      padding: 16, 
      background: '#fee2e2', 
      borderRadius: 8, 
      border: '2px solid #dc2626',
      marginBottom: 16
    }}>
      <div style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.6, fontWeight: 600, textAlign: 'center' }}>
        ⏱️ Average Recovery Time for {scenario.name}: <strong>{scenario.recovery}</strong>
      </div>
    </div>

    {/* Visual Bar Chart */}
    <div style={{ background: '#f9fafb', padding: 20, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16, textAlign: 'center' }}>
        📊 Gain/Loss Visualization
      </div>
      
      {Object.entries(calculations).map(([key, calc], idx) => {
        const percent = (calc.change / value) * 100;
        const isPositive = percent >= 0;
        const barColor = isPositive 
          ? (key === 'best' ? '#10b981' : '#3b82f6')
          : (key === 'crash' ? '#7f1d1d' : key === 'severe' ? '#dc2626' : key === 'moderate' ? '#f97316' : '#f59e0b');
        
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>
                {percent >= 0 ? '+' : ''}{percent.toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 32, background: '#e5e7eb', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                left: isPositive ? '50%' : `${50 + percent}%`,
                width: `${Math.abs(percent)}%`,
                height: '100%',
                background: barColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                transition: 'all 0.3s ease'
              }}>
                {fmtSGD(Math.abs(calc.change))}
              </div>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 2,
                background: '#374151'
              }} />
            </div>
          </div>
        );
      })}
    </div>

    {/* Critical Warning */}
    <div style={{ 
      marginTop: 20,
      padding: 20, 
      background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)', 
      borderRadius: 10,
      border: '3px solid #991b1b',
      boxShadow: '0 4px 12px rgba(127, 29, 29, 0.4)'
    }}>
      <div style={{ fontSize: 16, color: '#fff', lineHeight: 1.7, fontWeight: 700, textAlign: 'center' }}>
        ⚠️ CRITICAL REALITY CHECK ⚠️
      </div>
      <div style={{ fontSize: 14, color: '#fecaca', lineHeight: 1.7, marginTop: 12, textAlign: 'center' }}>
        {portfolioType === 'stock-picking' && (
          <>
            With stock picking, a <strong>-50% crash ({fmtSGD(calculations.crash.change)})</strong> is NOT rare—it's NORMAL 
            during bear markets. Can you emotionally handle watching <strong>{fmtSGD(Math.abs(calculations.crash.change))}</strong> vanish? 
            Most can't. They panic sell at the bottom and never recover.
          </>
        )}
        {portfolioType === 'diversified' && (
          <>
            Even with diversification, a <strong>-35% crash ({fmtSGD(calculations.crash.change)})</strong> happened in 2020 (COVID), 
            2008 (Financial Crisis), and 2000 (Dot-com). Will you hold strong or panic sell at <strong>{fmtSGD(calculations.crash.value)}</strong>?
          </>
        )}
        {portfolioType === 'index' && (
          <>
            Index funds are the SAFEST choice, but even they dropped <strong>-30% in 2020</strong> and <strong>-50% in 2008</strong>. 
            The difference? They ALWAYS recovered. Your stock picks might not.
          </>
        )}
      </div>
    </div>
  </div>

  {/* Retail vs Institutional Investors */}
  <div style={{ background: '#fff', border: '2px solid #ef4444', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#991b1b', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      ⚔️ The Uneven Playing Field: You vs Wall Street
    </h3>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
      {/* Retail Investor */}
      <div style={{ padding: 20, background: '#fef2f2', borderRadius: 8, border: '2px solid #ef4444' }}>
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>👤</div>
        <h4 style={{ margin: 0, color: '#991b1b', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
          YOU (Retail Investor)
        </h4>
        <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 8 }}>❌ Limited capital ($10K-$500K)</div>
          <div style={{ marginBottom: 8 }}>❌ Part-time research (evenings/weekends)</div>
          <div style={{ marginBottom: 8 }}>❌ Bloomberg Terminal: $2,000/month</div>
          <div style={{ marginBottom: 8 }}>❌ Emotional decision-making</div>
          <div style={{ marginBottom: 8 }}>❌ Delayed market data (15-20 min)</div>
          <div style={{ marginBottom: 8 }}>❌ No direct company access</div>
          <div style={{ marginBottom: 8 }}>❌ Higher transaction costs</div>
          <div style={{ marginBottom: 8 }}>❌ Limited diversification</div>
        </div>
      </div>

      {/* Institutional Investor */}
      <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 8, border: '2px solid #10b981' }}>
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>🏢</div>
        <h4 style={{ margin: 0, color: '#065f46', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
          FUNDS (Institutional Investors)
        </h4>
        <div style={{ fontSize: 13, color: '#065f46', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 8 }}>✅ Billions in capital</div>
          <div style={{ marginBottom: 8 }}>✅ 50+ full-time analysts</div>
          <div style={{ marginBottom: 8 }}>✅ Advanced AI/ML systems</div>
          <div style={{ marginBottom: 8 }}>✅ Disciplined processes</div>
          <div style={{ marginBottom: 8 }}>✅ Real-time data feeds</div>
          <div style={{ marginBottom: 8 }}>✅ Direct CEO/CFO meetings</div>
          <div style={{ marginBottom: 8 }}>✅ Institutional pricing</div>
          <div style={{ marginBottom: 8 }}>✅ Global diversification</div>
        </div>
      </div>
    </div>

    <div style={{ padding: 16, background: '#fee2e2', borderRadius: 8, border: '1px solid #ef4444' }}>
      <div style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.6, textAlign: 'center', fontWeight: 600 }}>
        💡 <strong>Reality Check:</strong> You're competing against supercomputers, PhDs, and billion-dollar war chests. 
        It's like playing chess against a grandmaster while blindfolded.
      </div>
    </div>
  </div>

  {/* Stock Picking Risks */}
  <div style={{ background: '#fff', border: '2px solid #f59e0b', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#92400e', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      🎯 The Concentration Risk: Why Stock Picking is Dangerous
    </h3>
    
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.7, marginBottom: 16 }}>
        Most retail investors hold 5-15 stocks. This creates <strong>extreme concentration risk</strong>. 
        Professional fund managers hold 50-200+ stocks to mitigate single-stock disasters.
      </div>

      {/* Risk Comparison */}
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
            ⚠️ Your Portfolio (5-10 stocks)
          </div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
            • One company scandal = -20% to -60% portfolio loss<br/>
            • CEO resignation = Instant -15%<br/>
            • Earnings miss = -10% to -30%<br/>
            • Industry disruption = Complete wipeout<br/>
            • Example: Enron, Wirecard, FTX investors lost 100%
          </div>
        </div>

        <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #10b981' }}>
          <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
            ✅ Diversified Fund (100+ stocks)
          </div>
          <div style={{ fontSize: 13, color: '#065f46', lineHeight: 1.6 }}>
            • One company fails = -1% to -2% impact<br/>
            • Scandal contained to 1-2% of portfolio<br/>
            • Industry risk spread across sectors<br/>
            • Systematic rebalancing<br/>
            • Example: If you held Enron in S&P 500 = -0.3% loss
          </div>
        </div>
      </div>
    </div>

    <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #f59e0b' }}>
      <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        📊 <strong>Statistical Reality:</strong> Over 10 years, approximately 85-90% of individual stock pickers 
        underperform the S&P 500 index. Even professional fund managers struggle to beat the market consistently.
      </div>
    </div>
  </div>

  {/* Volatility Impact - Real Dollar Risk */}
  <div style={{ background: '#fff', border: '2px solid #dc2626', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#991b1b', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      💥 The Real Cost of Volatility: What Happens to YOUR $500,000?
    </h3>
    
    <div style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.7, marginBottom: 16 }}>
      Let's stop talking percentages and show you the actual dollar impact on a $500,000 portfolio during normal market volatility:
    </div>

    {/* Volatility Comparison Table */}
    <div style={{ background: '#fef2f2', padding: 20, borderRadius: 8, border: '2px solid #ef4444', marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 16, textAlign: 'center' }}>
        📉 Market Correction Scenario: Your $500,000 Portfolio
      </div>
      
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Diversified Fund */}
        <div style={{ padding: 16, background: '#fff', borderRadius: 8, border: '2px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#065f46' }}>
                ✅ Diversified Fund (S&P 500 / World Index)
              </div>
              <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>
                Normal market correction: 10-20% drawdown
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ textAlign: 'center', padding: 12, background: '#f0fdf4', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#065f46', marginBottom: 4 }}>10% Correction</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>-$50,000</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>→ $450,000</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f0fdf4', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#065f46', marginBottom: 4 }}>15% Correction</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>-$75,000</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>→ $425,000</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f0fdf4', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#065f46', marginBottom: 4 }}>20% Correction</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>-$100,000</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>→ $400,000</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 10, background: '#f0fdf4', borderRadius: 6, textAlign: 'center', fontSize: 12, color: '#065f46' }}>
            ✅ <strong>Typical recovery time:</strong> 6-18 months (due to diversification)
          </div>
        </div>

        {/* Stock Picking */}
        <div style={{ padding: 16, background: '#fff', borderRadius: 8, border: '2px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b' }}>
                🚨 Stock Picking Portfolio (5-10 stocks)
              </div>
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                High concentration risk: 30-50% drawdowns common
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ textAlign: 'center', padding: 12, background: '#fee2e2', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#991b1b', marginBottom: 4 }}>30% Drop</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>-$150,000</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>→ $350,000</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#fee2e2', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#991b1b', marginBottom: 4 }}>40% Drop</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>-$200,000</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>→ $300,000</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#fee2e2', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#991b1b', marginBottom: 4 }}>50% Crash</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>-$250,000</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>→ $250,000</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 10, background: '#fee2e2', borderRadius: 6, textAlign: 'center', fontSize: 12, color: '#991b1b' }}>
            ⚠️ <strong>Recovery time:</strong> 2-5+ years (if stocks recover at all)
          </div>
        </div>
      </div>
    </div>

    {/* Real Examples */}
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 12 }}>
        📚 Real Historical Examples (What Actually Happened):
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {[
          { company: 'Meta (Facebook)', year: '2022', drop: '-77%', impact: 'From $500K → $115K', time: '2 years to recover' },
          { company: 'Zoom', year: '2021-2023', drop: '-90%', impact: 'From $500K → $50K', time: 'Still not recovered' },
          { company: 'Netflix', year: '2022', drop: '-75%', impact: 'From $500K → $125K', time: '18 months to recover' },
          { company: 'Tesla', year: '2022', drop: '-73%', impact: 'From $500K → $135K', time: '10 months to recover' },
          { company: 'Shopify', year: '2021-2022', drop: '-82%', impact: 'From $500K → $90K', time: 'Still not recovered' },
          { company: 'Sea Limited', year: '2021-2023', drop: '-90%', impact: 'From $500K → $50K', time: 'Still not recovered' }
        ].map((example, idx) => (
          <div key={idx} style={{ padding: 12, background: '#fef2f2', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>{example.company} ({example.year})</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{example.time}</div>
            </div>
            <div style={{ textAlign: 'center', marginRight: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{example.drop}</div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 140 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#991b1b' }}>{example.impact}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Key Insight */}
    <div style={{ background: '#fee2e2', padding: 20, borderRadius: 8, border: '2px solid #ef4444' }}>
      <div style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.7, textAlign: 'center', fontWeight: 600 }}>
        💔 <strong>The Brutal Reality:</strong> A 50% loss requires a 100% gain just to break even. 
        <br/>
        Lose $250,000 from $500K → $250K? You need to DOUBLE your money just to get back to where you started.
        <br/><br/>
        Meanwhile, diversified funds with 10-20% corrections recover in months, not years.
        <br/><br/>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Can you afford to lose $100K-$250K because you wanted to "pick winners"?</span>
      </div>
    </div>
  </div>

  {/* Research Requirements */}
  <div style={{ background: '#fff', border: '2px solid #8b5cf6', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#5b21b6', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      🔬 What Professional Research Actually Requires
    </h3>
    
    <div style={{ fontSize: 14, color: '#5b21b6', lineHeight: 1.7, marginBottom: 16 }}>
      If you want to pick individual stocks seriously, here's what institutional analysts do <strong>for EACH stock</strong>:
    </div>

    <div style={{ display: 'grid', gap: 12 }}>
      {[
        { title: 'Financial Analysis (20-40 hours)', items: ['10-K & 10-Q SEC filings', 'Cash flow modeling', 'Ratio analysis (P/E, P/B, ROE, ROIC)', 'Peer comparison', 'Historical trends (5-10 years)'] },
        { title: 'Industry Research (15-30 hours)', items: ['Porter\'s Five Forces', 'Competitive landscape mapping', 'Market size & growth projections', 'Regulatory environment', 'Technology disruption risks'] },
        { title: 'Management Assessment (10-20 hours)', items: ['Track record analysis', 'Insider trading patterns', 'Compensation structures', 'Capital allocation history', 'Conference call transcripts'] },
        { title: 'Valuation Models (15-25 hours)', items: ['DCF (Discounted Cash Flow)', 'Comparable company analysis', 'Precedent transactions', 'Scenario analysis', 'Sensitivity testing'] }
      ].map((section, idx) => (
        <div key={idx} style={{ padding: 16, background: '#faf5ff', borderRadius: 8, border: '1px solid #c4b5fd' }}>
          <div style={{ fontWeight: 700, color: '#5b21b6', marginBottom: 8, fontSize: 14 }}>
            {section.title}
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#6b21a8', lineHeight: 1.6 }}>
            {section.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div style={{ marginTop: 16, padding: 16, background: '#ede9fe', borderRadius: 8, border: '2px solid #8b5cf6' }}>
      <div style={{ fontSize: 14, color: '#5b21b6', lineHeight: 1.6, textAlign: 'center', fontWeight: 600 }}>
        ⏰ <strong>Total Time:</strong> 60-115 hours of research PER STOCK. With 10 stocks, that's 600-1,150 hours (15-29 work weeks) 
        of analysis. Do you have this time? Can you do this better than professionals?
      </div>
    </div>
  </div>

  {/* Emotional Pitfalls */}
  <div style={{ background: '#fff', border: '2px solid #dc2626', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#991b1b', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      🧠 Psychological Warfare: Your Brain is Your Enemy
    </h3>
    
    <div style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.7, marginBottom: 16 }}>
      Even if you have the time and skills, human psychology works against successful investing:
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
      {[
        { title: '😱 Loss Aversion', desc: 'The pain of losing $1,000 is 2x stronger than the joy of gaining $1,000. You\'ll panic sell at bottoms.' },
        { title: '📰 Recency Bias', desc: 'You overweight recent news. Stock up 20% = "buy more!" Stock down 20% = "sell everything!" Both wrong.' },
        { title: '🎰 Gambler\'s Fallacy', desc: '"It\'s been down for 3 months, it MUST go up soon!" Nope. Markets have no memory.' },
        { title: '🤝 Herd Mentality', desc: 'Everyone buying crypto/meme stocks? You FOMO in at the top. Classic retail mistake.' },
        { title: '🎯 Confirmation Bias', desc: 'You only read news that confirms your thesis. Ignore red flags. Echo chamber thinking.' },
        { title: '💎 Sunk Cost Fallacy', desc: '"I\'m down 40%, I can\'t sell now!" Actually, that\'s the BEST time to reassess objectively.' }
      ].map((bias, idx) => (
        <div key={idx} style={{ padding: 14, background: '#fee2e2', borderRadius: 8, border: '1px solid #fca5a5' }}>
          <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6, fontSize: 14 }}>
            {bias.title}
          </div>
          <div style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>
            {bias.desc}
          </div>
        </div>
      ))}
    </div>

    <div style={{ marginTop: 16, padding: 16, background: '#fef2f2', borderRadius: 8, border: '2px solid #dc2626' }}>
      <div style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.6, textAlign: 'center', fontWeight: 600 }}>
        🎭 <strong>The Professional Advantage:</strong> Institutional investors use systematic processes, algorithms, 
        and teams to remove emotion. You're fighting your own brain WHILE trying to beat the market.
      </div>
    </div>
  </div>

  {/* The Better Alternative */}
  <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '2px solid #10b981', borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <h3 style={{ marginTop: 0, color: '#065f46', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      ✅ The Smart Alternative: Low-Cost Index Funds & ETFs
    </h3>
    
    <div style={{ fontSize: 14, color: '#065f46', lineHeight: 1.7, marginBottom: 16 }}>
      Here's what the world's best investors recommend:
    </div>

    <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
      <div style={{ padding: 16, background: '#fff', borderRadius: 8, borderLeft: '4px solid #10b981' }}>
        <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 4 }}>
          Warren Buffett (World's Greatest Investor)
        </div>
        <div style={{ fontSize: 13, color: '#065f46', fontStyle: 'italic' }}>
          "A low-cost index fund is the most sensible equity investment for the great majority of investors. 
          By periodically investing in an index fund, the know-nothing investor can actually outperform most investment professionals."
        </div>
      </div>

      <div style={{ padding: 16, background: '#fff', borderRadius: 8, borderLeft: '4px solid #10b981' }}>
        <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 4 }}>
          Jack Bogle (Founder of Vanguard)
        </div>
        <div style={{ fontSize: 13, color: '#065f46', fontStyle: 'italic' }}>
          "Don't look for the needle in the haystack. Just buy the haystack!"
        </div>
      </div>
    </div>

    <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '2px solid #10b981' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#065f46', marginBottom: 12 }}>
        Why Index Funds Win:
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {[
          '✅ Instant diversification (500-3,000+ stocks)',
          '✅ Ultra-low fees (0.03-0.2% vs 1-2% for active funds)',
          '✅ No research required',
          '✅ No emotional decisions',
          '✅ Automatically rebalanced',
          '✅ Tax efficient',
          '✅ Proven track record: beats 85-90% of stock pickers over 10+ years',
          '✅ Set it and forget it'
        ].map((benefit, idx) => (
          <div key={idx} style={{ fontSize: 13, color: '#065f46', lineHeight: 1.6 }}>
            {benefit}
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Robo-Advisors Section */}
  <div style={{ background: '#fff', border: '2px solid #6366f1', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#4338ca', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      🤖 Robo-Advisors vs DIY vs Advised Solutions
    </h3>
    
    <div style={{ fontSize: 14, color: '#4338ca', lineHeight: 1.7, marginBottom: 16 }}>
      "What's the difference between robo-advisors, DIY investing, and working with a financial advisor?"
      <br/>
      Let's compare the three approaches objectively:
    </div>

    {/* Three-Way Comparison */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginBottom: 20 }}>
      {/* DIY */}
      <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8, border: '2px solid #3b82f6' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e40af', marginBottom: 12, textAlign: 'center' }}>
          🔧 DIY Investing
        </div>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 8 }}><strong>What you get:</strong></div>
          <div style={{ marginBottom: 8 }}>• Full control over choices</div>
          <div style={{ marginBottom: 8 }}>• Lowest cost structure</div>
          <div style={{ marginBottom: 8 }}>• Direct ownership</div>
          <div style={{ marginBottom: 8 }}>• Learn by doing</div>
          <div style={{ marginBottom: 12 }}></div>
          <div style={{ marginBottom: 8 }}><strong>What you don't get:</strong></div>
          <div style={{ marginBottom: 8 }}>• No guidance on strategy</div>
          <div style={{ marginBottom: 8 }}>• No insurance protection</div>
          <div style={{ marginBottom: 8 }}>• No tax optimization advice</div>
          <div style={{ marginBottom: 8 }}>• All research is on you</div>
          <div style={{ marginBottom: 8 }}>• Emotional discipline required</div>
        </div>
      </div>

      {/* Robo-Advisors */}
      <div style={{ padding: 16, background: '#f5f3ff', borderRadius: 8, border: '2px solid #8b5cf6' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#6b21a8', marginBottom: 12, textAlign: 'center' }}>
          🤖 Robo-Advisors
        </div>
        <div style={{ fontSize: 13, color: '#6b21a8', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 8 }}><strong>What you get:</strong></div>
          <div style={{ marginBottom: 8 }}>• Automated rebalancing</div>
          <div style={{ marginBottom: 8 }}>• Algorithm-based portfolios</div>
          <div style={{ marginBottom: 8 }}>• Low entry barrier</div>
          <div style={{ marginBottom: 8 }}>• Easy setup process</div>
          <div style={{ marginBottom: 12 }}></div>
          <div style={{ marginBottom: 8 }}><strong>What you don't get:</strong></div>
          <div style={{ marginBottom: 8 }}>• No human advisor relationship</div>
          <div style={{ marginBottom: 8 }}>• No insurance integration</div>
          <div style={{ marginBottom: 8 }}>• Limited customization</div>
          <div style={{ marginBottom: 8 }}>• No holistic planning</div>
          <div style={{ marginBottom: 8 }}>• Generic risk profiling</div>
        </div>
      </div>

      {/* Advised Solutions */}
      <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '2px solid #10b981' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#065f46', marginBottom: 12, textAlign: 'center' }}>
          👨‍💼 Advised Solutions
        </div>
        <div style={{ fontSize: 13, color: '#065f46', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 8 }}><strong>What you get:</strong></div>
          <div style={{ marginBottom: 8 }}>• Personal advisor relationship</div>
          <div style={{ marginBottom: 8 }}>• Holistic financial planning</div>
          <div style={{ marginBottom: 8 }}>• Insurance + investment integration</div>
          <div style={{ marginBottom: 8 }}>• Tax optimization strategies</div>
          <div style={{ marginBottom: 8 }}>• Estate planning guidance</div>
          <div style={{ marginBottom: 8 }}>• Regular portfolio reviews</div>
          <div style={{ marginBottom: 8 }}>• Behavioral coaching</div>
          <div style={{ marginBottom: 8 }}>• Life event planning</div>
        </div>
      </div>
    </div>

    {/* Key Differentiators */}
    <div style={{ background: '#fefce8', padding: 20, borderRadius: 8, border: '2px solid #eab308', marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#854d0e', marginBottom: 12 }}>
        🎯 The Key Questions to Ask Yourself:
      </div>
      <div style={{ fontSize: 13, color: '#854d0e', lineHeight: 1.8 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Do you need insurance protection?</strong> (life, critical illness, disability)
          <br/>→ DIY and robo-advisors don't include this. You'll need separate policies.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Do you want holistic planning?</strong> (retirement, children's education, estate)
          <br/>→ Robo-advisors give you portfolios, not comprehensive life planning.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Do you value human guidance?</strong> (especially during market crashes)
          <br/>→ Apps don't call you to prevent panic selling. Advisors do.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Do you need tax efficiency?</strong> (CPF top-ups, SRS, insurance tax relief)
          <br/>→ Advisors help optimize across your entire financial picture.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Is your time valuable?</strong> (doctors, business owners, executives)
          <br/>→ Delegating to a professional might be your best ROI.
        </div>
      </div>
    </div>

    {/* Real-World Scenarios */}
    <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 8, border: '1px solid #3b82f6', marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e40af', marginBottom: 12 }}>
        💼 Real-World Scenario: Market Crash 2020
      </div>
      <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.8 }}>
        <strong>DIY Investors:</strong> Many panicked and sold at -30% losses, missing the recovery.
        <br/>
        <strong>Robo-Advisor Users:</strong> Algorithm kept positions, but many still manually withdrew out of fear.
        <br/>
        <strong>Advised Clients:</strong> Advisors called, reassured, prevented emotional selling. Result: Full recovery + gains.
        <br/><br/>
        <strong>The behavioral value</strong> of having someone to call during volatility often outweighs cost differences over decades.
      </div>
    </div>

    {/* When Each Makes Sense */}
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #3b82f6' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>
          ✅ DIY Makes Sense If:
        </div>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
          • You enjoy research and have time to invest
          <br/>
          • You have strong emotional discipline
          <br/>
          • You're comfortable being your own advisor
          <br/>
          • Insurance needs are already covered separately
          <br/>
          • Simple financial situation (young, no dependents)
        </div>
      </div>

      <div style={{ padding: 16, background: '#f5f3ff', borderRadius: 8, border: '1px solid #8b5cf6' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#6b21a8', marginBottom: 8 }}>
          ✅ Robo-Advisors Make Sense If:
        </div>
        <div style={{ fontSize: 13, color: '#6b21a8', lineHeight: 1.6 }}>
          • You want automation without DIY effort
          <br/>
          • Small starting amounts (under $10K)
          <br/>
          • Don't need insurance or holistic planning
          <br/>
          • Comfortable with algorithm-only decisions
          <br/>
          • Tech-savvy and self-directed
        </div>
      </div>

      <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #10b981' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
          ✅ Working with an Advisor Makes Sense If:
        </div>
        <div style={{ fontSize: 13, color: '#065f46', lineHeight: 1.6 }}>
          • You value comprehensive financial planning
          <br/>
          • You need integrated insurance + investment solutions
          <br/>
          • Complex situation (multiple income streams, estate planning)
          <br/>
          • You want behavioral coaching during volatility
          <br/>
          • Time-poor professionals (your time = high opportunity cost)
          <br/>
          • You prefer human relationships over apps
        </div>
      </div>
    </div>

    <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '2px solid #10b981' }}>
      <div style={{ fontSize: 14, color: '#065f46', lineHeight: 1.6, textAlign: 'center', fontWeight: 600 }}>
        💡 <strong>The Truth:</strong> There's no "best" option - only what's best for YOUR situation. 
        A 25-year-old with $5K needs different solutions than a 45-year-old with family, business, and complex needs. 
        The right approach depends on your life stage, goals, and value of professional guidance.
      </div>
    </div>
  </div>

  {/* Singapore-Specific Options */}
  <div style={{ background: '#fff', border: '2px solid #3b82f6', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)' }}>
    <h3 style={{ marginTop: 0, color: '#1e40af', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
      🇸🇬 Singapore DIY Investment Options (The Cost-Effective Way)
    </h3>
    
    <div style={{ fontSize: 14, color: '#1e40af', lineHeight: 1.7, marginBottom: 16 }}>
      If you're ready to save on fees and go DIY, here are Singapore-accessible low-cost options:
    </div>

    <div style={{ display: 'grid', gap: 12 }}>
      {[
        { name: 'STI ETF (ES3)', type: 'Singapore Stocks', expense: '0.30%', desc: 'Straits Times Index - Top 30 Singapore companies' },
        { name: 'SPDR S&P 500 (SPY / VOO)', type: 'US Stocks', expense: '0.03-0.09%', desc: '500 largest US companies - Global diversification' },
        { name: 'iShares MSCI World (IWDA)', type: 'Global Stocks', expense: '0.20%', desc: '1,500+ companies across 23 developed countries' },
        { name: 'Vanguard Total World (VT)', type: 'Everything', expense: '0.07%', desc: '9,000+ stocks worldwide - Ultimate diversification' }
      ].map((fund, idx) => (
        <div key={idx} style={{ padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 14 }}>{fund.name}</div>
              <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>{fund.type}</div>
            </div>
            <div style={{ padding: '4px 8px', background: '#10b981', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff' }}>
              {fund.expense} fee
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#1e40af' }}>
            {fund.desc}
          </div>
        </div>
      ))}
    </div>

    <div style={{ marginTop: 16, padding: 16, background: '#dbeafe', borderRadius: 8, border: '1px solid #3b82f6' }}>
      <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
        💡 <strong>Platform Options:</strong> Interactive Brokers, Saxo Markets, FSMOne, Syfe, Endowus, StashAway. 
        Compare fees carefully - some charge custody fees, others don't.
      </div>
    </div>
  </div>

  {/* Final Reality Check */}
  <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '2px solid #4f46e5', borderRadius: 12, padding: 24 }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
      <h3 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        The Bottom Line
      </h3>
      <div style={{ fontSize: 15, color: '#c7d2fe', lineHeight: 1.8, maxWidth: 800, margin: '0 auto' }}>
        <strong style={{ color: '#fff' }}>Stock picking is a full-time profession</strong>, not a hobby. 
        Even professionals with unlimited resources struggle to beat the market. 
        <br/><br/>
        <strong style={{ color: '#fff' }}>If you're a doctor, engineer, or business owner</strong> - stick to your expertise 
        and let index funds handle your investments. Your time is worth more building your career than trying to beat Wall Street.
        <br/><br/>
        <strong style={{ color: '#fff' }}>Want to pick stocks anyway?</strong> Limit it to 5-10% of your portfolio as "play money." 
        Keep the other 90-95% in diversified, low-cost index funds.
      </div>
    </div>
  </div>
</div>
```

);
};

/* =========================
WEALTH TOOL (ILP) TAB
========================= */
const WealthToolTab = () => {
const [annualPremium, setAnnualPremium] = useState(’’);
const [projectionYears, setProjectionYears] = useState(‘40’);
const [growthRate, setGrowthRate] = useState(‘5’);

// Premium band calculation based on annualised regular premium
const getPremiumBand = (premium) => {
if (premium < 12000) return 1;
if (premium < 24000) return 2;
if (premium < 36000) return 3;
if (premium < 48000) return 4;
return 5;
};

// Initial bonus rates based on premium band
const getBonusRates = (band) => {
const rates = {
1: { year1: 1.23, year2: 1.00 },
2: { year1: 1.45, year2: 1.20 },
3: { year1: 1.58, year2: 1.35 },
4: { year1: 1.63, year2: 1.40 },
5: { year1: 1.72, year2: 1.48 }
};
return rates[band] || rates[1];
};

// Get loyalty bonus rate based on band and policy year
const getLoyaltyBonusRate = (band, policyYear) => {
// Policy years 1-40: based on premium band
if (policyYear <= 40) {
const rates = {
1: 0.0092,
2: 0.0092,
3: 0.0098,
4: 0.0099,
5: 0.0099
};
return rates[band] || 0.0092;
}
// Policy year 41+: flat 0.30% for all bands
return 0.0030;
};

// Calculate ILP projection
const ilpProjection = useMemo(() => {
const premium = toNum(annualPremium);
if (!premium || premium <= 0) return null;

```
const years = toNum(projectionYears, 20);
const rate = toNum(growthRate, 5) / 100;
const band = getPremiumBand(premium);
const bonusRates = getBonusRates(band);
const premiumPaymentTerm = 30; // 30-year premium payment term

const projection = [];
let bonusAccountUnits = 0;
let flexibleAccountUnits = 0;
let accumulationUnits = 0; // For loyalty bonus calculation
let cumulativeInvested = 0;

for (let year = 1; year <= years; year++) {
  // Calculate bonus multiplier for this year
  let bonusMultiplier = 1.0;
  let accountType = 'Flexible Account';
  let premiumPaid = 0;
  let loyaltyBonusUnits = 0;
  
  // Only pay premium during premium payment term
  if (year <= premiumPaymentTerm) {
    if (year === 1) {
      bonusMultiplier = bonusRates.year1;
      accountType = 'Bonus Account';
    } else if (year === 2) {
      bonusMultiplier = bonusRates.year2;
      accountType = 'Bonus Account';
    }

    // Premium with bonus
    const effectivePremium = premium * bonusMultiplier;
    premiumPaid = premium;
    cumulativeInvested += premium; // Only actual cash invested

    // Units purchased (assuming $1 per unit at start)
    const unitsPurchased = effectivePremium;
    
    // Allocate to correct account
    if (year <= 2) {
      bonusAccountUnits += unitsPurchased;
    } else {
      flexibleAccountUnits += unitsPurchased;
    }
    
    accumulationUnits += unitsPurchased;
  }

  const totalUnits = bonusAccountUnits + flexibleAccountUnits;

  // Unit value grows by growth rate
  const unitValue = Math.pow(1 + rate, year);
  
  // Calculate Accumulation Units Account value (for loyalty bonus calculation)
  const accumulationValue = accumulationUnits * unitValue;
  
  // Calculate loyalty bonus AFTER premium payment term (year 31+)
  if (year > premiumPaymentTerm) {
    const loyaltyRate = getLoyaltyBonusRate(band, year);
    // Loyalty bonus = rate × Accumulation Units Account value at end of previous year
    const previousYearAccValue = year > 1 ? projection[year - 2].accumulationValue : 0;
    loyaltyBonusUnits = (previousYearAccValue * loyaltyRate) / unitValue;
    accumulationUnits += loyaltyBonusUnits;
  }
  
  // Calculate values for each account
  const bonusAccountValue = bonusAccountUnits * unitValue;
  const flexibleAccountValue = flexibleAccountUnits * unitValue;
  const portfolioValue = (bonusAccountUnits + flexibleAccountUnits + loyaltyBonusUnits) * unitValue;

  projection.push({
    year,
    premium: premiumPaid,
    bonusMultiplier,
    effectivePremium: premiumPaid * bonusMultiplier,
    cumulativeInvested,
    unitsPurchased: premiumPaid > 0 ? premiumPaid * bonusMultiplier : 0,
    accountType: year > premiumPaymentTerm ? 'No Premium (Loyalty Only)' : accountType,
    bonusAccountUnits,
    flexibleAccountUnits,
    loyaltyBonusUnits,
    accumulationUnits,
    totalUnits: bonusAccountUnits + flexibleAccountUnits + loyaltyBonusUnits,
    unitValue,
    bonusAccountValue,
    flexibleAccountValue,
    accumulationValue,
    loyaltyBonusRate: year > premiumPaymentTerm ? getLoyaltyBonusRate(band, year) : 0,
    portfolioValue,
    gain: portfolioValue - cumulativeInvested,
    roi: cumulativeInvested > 0 ? ((portfolioValue - cumulativeInvested) / cumulativeInvested) * 100 : 0
  });
}

return { projection, band, bonusRates, premiumPaymentTerm };
```

}, [annualPremium, projectionYears, growthRate]);

return (
<div style={{ padding: 24 }}>
<div style={{ background: ‘#fff’, borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: ‘0 1px 3px rgba(0,0,0,0.1)’ }}>
<h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: ‘#1F2937’ }}>
💎 Wealth Tool - ILP Projection
</h2>

```
    {/* Input Section */}
    <div style={{ background: '#F3F4F6', borderRadius: 10, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <LabeledText 
          label="Annual Premium (SGD)" 
          value={annualPremium} 
          onChange={setAnnualPremium} 
          type="number"
          placeholder="e.g. 24000"
        />
        <LabeledText 
          label="Projection Years" 
          value={projectionYears} 
          onChange={setProjectionYears} 
          type="number"
          placeholder="e.g. 20"
        />
        <LabeledText 
          label="Expected Growth Rate (%)" 
          value={growthRate} 
          onChange={setGrowthRate} 
          type="number"
          placeholder="e.g. 5"
        />
      </div>
    </div>

    {ilpProjection && (
      <>
        {/* Premium Band Info */}
        <div style={{ 
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
          border: '2px solid #3B82F6', 
          borderRadius: 10, 
          padding: 20, 
          marginBottom: 24 
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1E40AF', marginBottom: 6, textTransform: 'uppercase' }}>
                Premium Band
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1E40AF' }}>
                Band {ilpProjection.band}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1E40AF', marginBottom: 6, textTransform: 'uppercase' }}>
                Year 1 Bonus
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10B981' }}>
                {(ilpProjection.bonusRates.year1 * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1E40AF', marginBottom: 6, textTransform: 'uppercase' }}>
                Year 2 Bonus
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10B981' }}>
                {(ilpProjection.bonusRates.year2 * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Card 
            title="Total Invested" 
            value={fmtSGD(ilpProjection.projection[ilpProjection.projection.length - 1].cumulativeInvested)} 
            tone="info" 
            icon="💰" 
          />
          <Card 
            title="Bonus Account" 
            value={fmtSGD(ilpProjection.projection[ilpProjection.projection.length - 1].bonusAccountValue)} 
            tone="success" 
            icon="🎁" 
          />
          <Card 
            title="Flexible Account" 
            value={fmtSGD(ilpProjection.projection[ilpProjection.projection.length - 1].flexibleAccountValue)} 
            tone="info" 
            icon="💎" 
          />
          <Card 
            title="Total Portfolio" 
            value={fmtSGD(ilpProjection.projection[ilpProjection.projection.length - 1].portfolioValue)} 
            tone="success" 
            icon="📈" 
          />
          <Card 
            title="Total Gain" 
            value={fmtSGD(ilpProjection.projection[ilpProjection.projection.length - 1].gain)} 
            tone={ilpProjection.projection[ilpProjection.projection.length - 1].gain >= 0 ? 'success' : 'danger'} 
            icon="💵" 
          />
          <Card 
            title="ROI" 
            value={`${ilpProjection.projection[ilpProjection.projection.length - 1].roi.toFixed(1)}%`} 
            tone={ilpProjection.projection[ilpProjection.projection.length - 1].roi >= 0 ? 'success' : 'danger'} 
            icon="📊" 
          />
        </div>

        {/* Projection Chart */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
            Portfolio Growth Projection (Bonus vs Flexible Account)
          </h3>
          <LineChart
            xLabels={ilpProjection.projection.map(p => `Year ${p.year}`)}
            series={[
              { 
                label: 'Total Portfolio', 
                values: ilpProjection.projection.map(p => p.portfolioValue), 
                stroke: '#3B82F6' 
              },
              { 
                label: 'Bonus Account', 
                values: ilpProjection.projection.map(p => p.bonusAccountValue), 
                stroke: '#10B981' 
              },
              { 
                label: 'Flexible Account', 
                values: ilpProjection.projection.map(p => p.flexibleAccountValue), 
                stroke: '#F59E0B' 
              },
              { 
                label: 'Total Invested', 
                values: ilpProjection.projection.map(p => p.cumulativeInvested), 
                stroke: '#6B7280' 
              }
            ]}
            height={300}
            onFormatY={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
        </div>

        {/* Year-by-Year Breakdown Table */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
            Year-by-Year Breakdown
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: 12,
              background: '#fff',
              border: '1px solid #E5E7EB'
            }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Year</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Init Bonus</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Premium Paid</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Units Bought</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Loyalty Rate</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Loyalty Units</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Total Units</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Unit Value</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Portfolio Value</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {ilpProjection.projection.map((p, idx) => (
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid #E5E7EB',
                    background: p.year <= 2 ? '#F0F9FF' : 
                               p.year > ilpProjection.premiumPaymentTerm ? '#FEF3C7' : '#fff'
                  }}>
                    <td style={{ padding: '8px', fontWeight: p.year <= 2 ? 600 : 400 }}>
                      {p.year}
                      {p.year <= 2 && <span style={{ marginLeft: 4, fontSize: 11 }}>🎁</span>}
                      {p.year > ilpProjection.premiumPaymentTerm && <span style={{ marginLeft: 4, fontSize: 11 }}>🏆</span>}
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      textAlign: 'center',
                      fontSize: 9,
                      fontWeight: 600,
                      color: p.accountType.includes('No Premium') ? '#F59E0B' : 
                             p.accountType === 'Bonus Account' ? '#10B981' : '#3B82F6'
                    }}>
                      {p.accountType.includes('No Premium') ? 'LOYALTY' : 
                       p.accountType === 'Bonus Account' ? 'BONUS' : 'FLEX'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: p.bonusMultiplier > 1 ? '#10B981' : '#6B7280', fontWeight: p.bonusMultiplier > 1 ? 600 : 400 }}>
                      {p.bonusMultiplier > 1 ? `${(p.bonusMultiplier * 100).toFixed(0)}%` : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {p.premium > 0 ? fmtSGD(p.premium) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                      {p.unitsPurchased > 0 ? p.unitsPurchased.toFixed(2) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: p.loyaltyBonusRate > 0 ? '#F59E0B' : '#6B7280' }}>
                      {p.loyaltyBonusRate > 0 ? `${(p.loyaltyBonusRate * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#F59E0B', fontWeight: p.loyaltyBonusUnits > 0 ? 600 : 400 }}>
                      {p.loyaltyBonusUnits > 0 ? p.loyaltyBonusUnits.toFixed(2) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{p.totalUnits.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${p.unitValue.toFixed(4)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#1F2937' }}>{fmtSGD(p.portfolioValue)}</td>
                    <td style={{ 
                      padding: '8px', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: p.gain >= 0 ? '#10B981' : '#EF4444'
                    }}>
                      {p.gain >= 0 ? '+' : ''}{fmtSGD(p.gain)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Premium Band Reference Table */}
        <div style={{ background: '#F3F4F6', borderRadius: 10, padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
            📊 Premium Band Reference
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: 13,
              background: '#fff'
            }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Band</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Annual Premium Range</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Year 1 Bonus</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Year 2 Bonus</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>1</td>
                  <td style={{ padding: '10px' }}>&lt; SGD 12,000</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>123%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>100%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>2</td>
                  <td style={{ padding: '10px' }}>SGD 12,000 to &lt; 24,000</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>145%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>120%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>3</td>
                  <td style={{ padding: '10px' }}>SGD 24,000 to &lt; 36,000</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>158%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>135%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>4</td>
                  <td style={{ padding: '10px' }}>SGD 36,000 to &lt; 48,000</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>163%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>140%</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>5</td>
                  <td style={{ padding: '10px' }}>&gt;= SGD 48,000</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>172%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>148%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
            <strong>Note:</strong> Initial bonus is allocated as additional units to the Bonus Account. 
            Years 1 and 2 premiums (with bonuses) go to the <strong style={{ color: '#10B981' }}>Bonus Account</strong>. 
            Year 3 onwards premiums go to the <strong style={{ color: '#F59E0B' }}>Flexible Account</strong>. 
            No bonus for recurring single premiums or top-up premiums.
          </div>
        </div>

        {/* Account Structure Info */}
        <div style={{ background: '#F0F9FF', border: '2px solid #3B82F6', borderRadius: 8, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', marginBottom: 8 }}>
            📚 Account Structure
          </div>
          <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#10B981' }}>🎁 Bonus Account:</strong> Contains Years 1 & 2 premiums with initial bonuses applied. 
              These units benefit from the welcome bonus rates based on your premium band.
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#F59E0B' }}>💎 Flexible Account:</strong> Contains Year 3-30 premiums without bonuses. 
              Regular premiums during premium payment term are allocated here at 100%.
            </div>
            <div>
              <strong style={{ color: '#F59E0B' }}>🏆 Loyalty Bonus (Year 31+):</strong> After the 30-year premium payment term, 
              annual loyalty bonuses are paid based on your Accumulation Units Account value. No more premiums required!
            </div>
          </div>
        </div>

        {/* Loyalty Bonus Structure */}
        <div style={{ background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: 8, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 12 }}>
            🏆 Loyalty Bonus Structure
          </div>
          <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6, marginBottom: 12 }}>
            After completing the <strong>30-year premium payment term</strong>, you'll receive annual loyalty bonuses 
            for as long as your policy remains in force. The bonus is calculated as:
          </div>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            padding: 12, 
            borderRadius: 6, 
            marginBottom: 12,
            border: '1px solid #F59E0B'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', textAlign: 'center' }}>
              Loyalty Bonus = Loyalty Rate × Accumulation Units Account Value (at policy anniversary)
            </div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <strong>Loyalty Bonus Rates (Policy Years 31-40):</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 8 }}>
              <div style={{ textAlign: 'center', padding: 6, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: '#78350F' }}>Band 1-2</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>0.92%</div>
              </div>
              <div style={{ textAlign: 'center', padding: 6, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: '#78350F' }}>Band 3</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>0.98%</div>
              </div>
              <div style={{ textAlign: 'center', padding: 6, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: '#78350F' }}>Band 4-5</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>0.99%</div>
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: 11, color: '#78350F' }}>
            <strong>Policy Year 41+:</strong> Flat rate of <strong>0.30% per annum</strong> for all bands.
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: 8, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 8 }}>
            ⚠️ Important Disclaimer
          </div>
          <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
            This projection is for illustrative purposes only and does not guarantee future performance. 
            Actual returns may vary based on fund performance, fees, charges, and market conditions. 
            Capital is non-guaranteed. Please refer to the product summary and policy contract for full details.
          </div>
        </div>
      </>
    )}

    {!ilpProjection && (
      <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💎</div>
        <p style={{ fontSize: 16, marginBottom: 8 }}>Enter your annual premium to see ILP projections</p>
        <p style={{ fontSize: 14 }}>The tool will calculate your premium band and apply the corresponding bonuses</p>
      </div>
    )}
  </div>
</div>
```

);
};

const CrmTab = ({
clients,
profile,
selectedClientId,
newClient,
saveClient,
loadClient,
deleteClient,
setFollowUp,
completeFollowUp
}) => {
const getDaysUntilBirthday = (dob) => {
if (!dob) return null;
const dobDate = parseDob(dob);
if (!dobDate) return null;

```
const today = new Date();
const thisYear = today.getFullYear();
let nextBirthday = new Date(thisYear, dobDate.getMonth(), dobDate.getDate());

if (nextBirthday < today) {
  nextBirthday = new Date(thisYear + 1, dobDate.getMonth(), dobDate.getDate());
}

const diffTime = nextBirthday - today;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
return diffDays;
```

};

return (
<div style={{ padding: 20 }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’, marginBottom: 20 }}>
<h2 style={{ fontSize: 20, fontWeight: 700, color: ‘#1F2937’ }}>Client Management</h2>
<button
onClick={newClient}
style={{
padding: ‘10px 20px’,
background: ‘linear-gradient(135deg, #667eea 0%, #764ba2 100%)’,
color: ‘#fff’,
border: ‘none’,
borderRadius: 8,
fontSize: 14,
fontWeight: 600,
cursor: ‘pointer’,
boxShadow: ‘0 2px 4px rgba(102, 126, 234, 0.3)’
}}
>
+ New Client
</button>
</div>

```
  <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
    <button
      onClick={saveClient}
      style={{
        width: '100%',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
      }}
    >
      💾 Save Current Client
    </button>
    {selectedClientId && (
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
        Editing: {profile.name || 'Unnamed Client'}
      </p>
    )}
  </div>
  
  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
    {clients.length === 0 ? (
      <div style={{ background: '#F9FAFB', padding: 48, borderRadius: 12, border: '2px dashed #E5E7EB', textAlign: 'center' }}>
        <p style={{ color: '#6B7280', fontSize: 14 }}>No clients yet. Click "New Client" to get started.</p>
      </div>
    ) : (
      clients.map(client => {
        const daysUntilBday = getDaysUntilBirthday(client.profile.dob);
        const showBdayAlert = daysUntilBday !== null && daysUntilBday <= 30;
        const needsFollowUp = client.followUp.nextDate && 
          new Date(client.followUp.nextDate) <= new Date() && 
          client.followUp.status === 'pending';
        
        return (
          <div 
            key={client.id} 
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: selectedClientId === client.id ? '2px solid #667eea' : '2px solid #E5E7EB',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                  {client.profile.name || 'Unnamed Client'}
                </h3>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                  {client.profile.email} • {client.profile.phone}
                </p>
                {client.profile.dob && (
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                    DOB: {new Date(client.profile.dob).toLocaleDateString()}
                  </p>
                )}
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                  Last updated: {new Date(client.lastUpdated).toLocaleDateString()}
                </p>
                
                {showBdayAlert && (
                  <div style={{ marginTop: 12, padding: 10, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #F59E0B', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                      🎂 Birthday in {daysUntilBday} day{daysUntilBday !== 1 ? 's' : ''}!
                    </span>
                  </div>
                )}
                
                {needsFollowUp && (
                  <div style={{ marginTop: 12, padding: 10, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '2px solid #EF4444', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>⏰ Follow-up due!</span>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => loadClient(client)}
                  style={{
                    padding: '8px 16px',
                    background: '#3B82F6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Follow-up Actions:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  onClick={() => setFollowUp(client.id, 3)}
                  style={{
                    padding: '6px 12px',
                    background: '#E5E7EB',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Zoom Met (+3 days)
                </button>
                <button
                  onClick={() => setFollowUp(client.id, 4)}
                  style={{
                    padding: '6px 12px',
                    background: '#E5E7EB',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  No Reply (+4 days)
                </button>
                <button
                  onClick={() => setFollowUp(client.id, 7)}
                  style={{
                    padding: '6px 12px',
                    background: '#E5E7EB',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Still No Reply (+7 days)
                </button>
                {client.followUp.status === 'pending' && (
                  <button
                    onClick={() => completeFollowUp(client.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Followed Up
                  </button>
                )}
              </div>
              {client.followUp.nextDate && (
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                  Next follow-up: {new Date(client.followUp.nextDate).toLocaleDateString()} 
                  {client.followUp.status === 'completed' && ' (Completed)'}
                </p>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
</div>
```

);
};

/* =========================
CHILDREN PLANNING TAB
========================= */

const ChildrenTab = ({ children, setChildren, ageYears }) => {
// Ensure children is always an array
const safeChildren = children || [];

// Add, remove, update logic
const addChild = () => {
setChildren([…safeChildren, { id: Date.now(), name: ‘’, dobISO: ‘’, gender: ‘male’ }]);
};

const removeChild = (id) => {
setChildren(safeChildren.filter(c => c.id !== id));
};

const updateChild = (id, field, value) => {
setChildren(safeChildren.map(c => c.id === id ? { …c, [field]: value } : c));
};

// Cost calculation, inflation, milestones
const calculateChildCosts = (child) => {
if (!child.dobISO) return null;
const childDob = parseDob(child.dobISO);
if (!childDob) return null;

```
const today = new Date();
const ageInMonths = monthsSinceDob(childDob, today.getFullYear(), today.getMonth());
const currentAge = Math.floor(ageInMonths / 12);

const uniStartAge = child.gender === 'male' ? 21 : 19;
const uniEndAge = uniStartAge + 3;

const stages = [
  {
    name: 'PSLE to O-Levels (Ages 12-16)',
    start: 12,
    end: 16,
    monthlyCost: 800,
    yearlyCost: 9600,
    description: 'Tuition (Math, Science, English), enrichment, school fees',
    breakdown: '5 years × $800/month = $48,000 total (before inflation)'
  },
  {
    name: `University (Ages ${uniStartAge}-${uniEndAge})${child.gender === 'male' ? ' - After NS' : ''}`,
    start: uniStartAge,
    end: uniEndAge,
    monthlyCost: 0,
    yearlyCost: 8750,
    description: 'Tuition fees (subsidized), living allowance, textbooks',
    breakdown: '4 years × $8,750/year = $35,000 total (before inflation)',
    hasLoanOption: true
  }
];

let totalCost = 0;
let totalCostWithLoan = 0;
let breakdown = [];
const inflationRate = 0.03;

stages.forEach(stage => {
  if (currentAge <= stage.end) {
    const yearsUntilStart = Math.max(0, stage.start - currentAge);
    const duration = stage.end - Math.max(stage.start, currentAge) + 1;
    if (duration > 0) {
      let stageCost = 0;
      for (let year = 0; year < duration; year++) {
        const yearsFromNow = yearsUntilStart + year;
        const inflatedCost = stage.yearlyCost * Math.pow(1 + inflationRate, yearsFromNow);
        stageCost += inflatedCost;
      }
      totalCost += stageCost;

      // Loan simulation if university
      let loanTotalCost = stageCost;
      let loanInterest = 0;
      if (stage.hasLoanOption) {
        // Bank loan: 4% interest, 10-year repayment
        const loanAmount = stageCost;
        const annualRate = 0.04;
        const years = 10;
        const monthlyRate = annualRate / 12;
        const numPayments = years * 12;
        const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        loanTotalCost = monthlyPayment * numPayments;
        loanInterest = loanTotalCost - loanAmount;
      }

      totalCostWithLoan += loanTotalCost;
      breakdown.push({
        stage: stage.name,
        yearsUntilStart,
        duration,
        cost: stageCost,
        description: stage.description,
        breakdownText: stage.breakdown,
        currentYearlyCost: stage.yearlyCost,
        inflatedFirstYearCost: stage.yearlyCost * Math.pow(1 + inflationRate, yearsUntilStart),
        hasLoanOption: !!stage.hasLoanOption,
        loanTotalCost: stage.hasLoanOption ? loanTotalCost : 0,
        loanInterest: stage.hasLoanOption ? loanInterest : 0
      });
    }
  }
});

return { totalCost, totalCostWithLoan, breakdown, currentAge };
```

};

const allChildrenCosts = safeChildren.map(child => ({
child,
costs: calculateChildCosts(child)
})).filter(c => c.costs !== null);

const grandTotal = allChildrenCosts.reduce((sum, c) => sum + c.costs.totalCost, 0);

// Timeline with realistic “when do you retire”
const calculateRetirementTimeline = () => {
if (!ageYears || allChildrenCosts.length === 0) return null;
const currentYear = new Date().getFullYear();

```
let latestUniEndYear = 0;
const timeline = allChildrenCosts.map(({ child, costs }) => {
  const uniStage = costs.breakdown.find(s => s.stage.includes('University'));
  const psleStage = costs.breakdown.find(s => s.stage.includes('PSLE'));
  if (!uniStage) return null;
  const uniEndAge = child.gender === 'male' ? 24 : 22;
  const uniEndYear = currentYear + (uniEndAge - costs.currentAge);
  if (uniEndYear > latestUniEndYear) {
    latestUniEndYear = uniEndYear;
  }
  return {
    child,
    currentAge: costs.currentAge,
    psleStart: psleStage ? currentYear + psleStage.yearsUntilStart : null,
    psleEnd: psleStage ? currentYear + psleStage.yearsUntilStart + 4 : null,
    psleCost: psleStage ? psleStage.cost : 0,
    uniStart: currentYear + uniStage.yearsUntilStart,
    uniEnd: uniEndYear,
    uniCost: uniStage.cost,
  };
}).filter(t => t !== null);

const retirementAge = ageYears + (latestUniEndYear - currentYear);

return {
  timeline, retirementYear: latestUniEndYear, retirementAge, currentYear
};
```

};

const retirementTimeline = calculateRetirementTimeline();

// === UI ===
return (
<div style={{ padding: 20 }}>
{/* Welcome */}
<div style={{
background: ‘linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)’,
border: ‘1px solid #f59e0b’,
borderRadius: 12,
padding: 24,
marginBottom: 20
}}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 12 }}>
<div style={{ fontSize: 32 }}>👶</div>
<div>
<h3 style={{ margin: 0, color: ‘#92400e’, fontSize: 20 }}>Children & Education Planning</h3>
<p style={{ margin: ‘4px 0 0’, color: ‘#92400e’, fontSize: 14, opacity: 0.8 }}>
Factor in childcare, education costs with inflation up to university
</p>
</div>
</div>
</div>

```
  {/* Add Child Button */}
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20
  }}>
    <button
      onClick={addChild}
      style={{
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
      }}
    >+ Add Child</button>
  </div>

  {/* NEW: Visual Education Timeline Chart */}
  {safeChildren.length > 0 && ageYears > 0 && safeChildren.some(c => c.dobISO) && (
    <div style={{
      background: '#fff',
      border: '2px solid #3b82f6',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
    }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: '#1e40af', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          📊 Parent's Age at Children's Education Milestones
        </h3>
        <p style={{ margin: 0, color: '#3b82f6', fontSize: 14 }}>
          Visual timeline showing your age when each child reaches key education stages
        </p>
      </div>

      {(() => {
        const currentYear = new Date().getFullYear();
        
        // Calculate all milestones for all children
        const allMilestones = safeChildren
          .filter(c => c.dobISO)
          .map((child) => {
            const childDob = parseDob(child.dobISO);
            if (!childDob) return null;
            
            const today = new Date();
            const ageInMonths = monthsSinceDob(childDob, today.getFullYear(), today.getMonth());
            const currentChildAge = Math.floor(ageInMonths / 12);
            
            const milestones = [
              {
                name: 'PSLE',
                childAge: 12,
                icon: '📝',
                color: '#06b6d4',
                description: 'Primary School Leaving Exam'
              },
              {
                name: 'O-Levels',
                childAge: 16,
                icon: '📚',
                color: '#8b5cf6',
                description: 'GCE O-Level Examinations'
              },
              ...(child.gender === 'male' ? [{
                name: 'NS/Army',
                childAge: 18,
                icon: '🎖️',
                color: '#059669',
                description: 'National Service (2 years)'
              }] : []),
              {
                name: 'University Start',
                childAge: child.gender === 'male' ? 21 : 19,
                icon: '🎓',
                color: '#f59e0b',
                description: child.gender === 'male' ? 'After NS completion' : 'Direct entry'
              },
              {
                name: 'University End',
                childAge: child.gender === 'male' ? 24 : 22,
                icon: '🎉',
                color: '#10b981',
                description: 'Graduation'
              }
            ];
            
            return milestones
              .filter(m => currentChildAge < m.childAge) // Only future milestones
              .map(milestone => {
                const yearsFromNow = milestone.childAge - currentChildAge;
                const yearOfMilestone = currentYear + yearsFromNow;
                const parentAgeAtMilestone = ageYears + yearsFromNow;
                
                return {
                  childName: child.name || 'Unnamed Child',
                  childGender: child.gender,
                  currentChildAge,
                  milestone: milestone.name,
                  childAgeAtMilestone: milestone.childAge,
                  parentAgeAtMilestone: Math.round(parentAgeAtMilestone),
                  yearOfMilestone,
                  yearsFromNow,
                  icon: milestone.icon,
                  color: milestone.color,
                  description: milestone.description
                };
              });
          })
          .filter(m => m !== null)
          .flat()
          .sort((a, b) => a.yearsFromNow - b.yearsFromNow);
        
        if (allMilestones.length === 0) {
          return (
            <div style={{ padding: 16, background: '#f3f4f6', borderRadius: 8, textAlign: 'center', color: '#6b7280' }}>
              All children have completed their education milestones!
            </div>
          );
        }
        
        // Group by parent age for visualization
        const groupedByParentAge = allMilestones.reduce((acc, m) => {
          const key = m.parentAgeAtMilestone;
          if (!acc[key]) acc[key] = [];
          acc[key].push(m);
          return acc;
        }, {});
        
        const parentAges = Object.keys(groupedByParentAge).map(Number).sort((a, b) => a - b);
        const minParentAge = Math.min(...parentAges);
        const maxParentAge = Math.max(...parentAges);
        
        return (
          <>
            {/* Timeline Visualization */}
            <div style={{ marginBottom: 24, overflowX: 'auto' }}>
              <div style={{ minWidth: 600 }}>
                {/* Timeline Header */}
                <div style={{ 
                  display: 'flex', 
                  marginBottom: 12, 
                  paddingBottom: 8,
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <div style={{ width: 120, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    Your Age
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    Milestones
                  </div>
                </div>
                
                {/* Timeline Rows */}
                {parentAges.map(parentAge => {
                  const milestonesAtAge = groupedByParentAge[parentAge];
                  const year = milestonesAtAge[0].yearOfMilestone;
                  
                  return (
                    <div key={parentAge} style={{ 
                      display: 'flex', 
                      marginBottom: 16,
                      padding: 12,
                      background: 'linear-gradient(90deg, #f9fafb 0%, #fff 100%)',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb'
                    }}>
                      {/* Parent Age Column */}
                      <div style={{ width: 120 }}>
                        <div style={{ 
                          fontSize: 24, 
                          fontWeight: 700, 
                          color: '#1e40af',
                          marginBottom: 4
                        }}>
                          {parentAge}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          Year {year}
                        </div>
                      </div>
                      
                      {/* Milestones Column */}
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {milestonesAtAge.map((m, idx) => (
                          <div key={idx} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: `${m.color}15`,
                            border: `2px solid ${m.color}`,
                            borderRadius: 8,
                            minWidth: 200
                          }}>
                            <div style={{ fontSize: 20, marginRight: 8 }}>{m.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontSize: 13, 
                                fontWeight: 600, 
                                color: m.color,
                                marginBottom: 2
                              }}>
                                {m.childName} - {m.milestone}
                              </div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>
                                Child age: {m.childAgeAtMilestone} • {m.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {/* Card 1: Next Milestone */}
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: 8,
                border: '2px solid #3b82f6'
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 8, textTransform: 'uppercase' }}>
                  ⏰ Next Milestone
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                  {allMilestones[0].childName}'s {allMilestones[0].milestone}
                </div>
                <div style={{ fontSize: 13, color: '#1e40af' }}>
                  In {allMilestones[0].yearsFromNow} {allMilestones[0].yearsFromNow === 1 ? 'year' : 'years'} ({allMilestones[0].yearOfMilestone})
                </div>
                <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 8 }}>
                  You'll be {allMilestones[0].parentAgeAtMilestone} years old
                </div>
              </div>
              
              {/* Card 2: Final Milestone */}
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                borderRadius: 8,
                border: '2px solid #10b981'
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: 8, textTransform: 'uppercase' }}>
                  🎯 All Done By
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46', marginBottom: 4 }}>
                  Age {maxParentAge} ({allMilestones[allMilestones.length - 1].yearOfMilestone})
                </div>
                <div style={{ fontSize: 13, color: '#065f46' }}>
                  {allMilestones[allMilestones.length - 1].childName}'s graduation
                </div>
                <div style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>
                  Then you can truly retire! 🎉
                </div>
              </div>
              
              {/* Card 3: Peak Education Years */}
              {(() => {
                // Find the year(s) with most milestones
                const milestoneCounts = {};
                allMilestones.forEach(m => {
                  const key = m.parentAgeAtMilestone;
                  milestoneCounts[key] = (milestoneCounts[key] || 0) + 1;
                });
                const peakAge = Object.keys(milestoneCounts).reduce((a, b) => 
                  milestoneCounts[a] > milestoneCounts[b] ? a : b
                );
                const peakCount = milestoneCounts[peakAge];
                
                return (
                  <div style={{
                    padding: 16,
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: 8,
                    border: '2px solid #f59e0b'
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8, textTransform: 'uppercase' }}>
                      📅 Busiest Year
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
                      Age {peakAge}
                    </div>
                    <div style={{ fontSize: 13, color: '#92400e' }}>
                      {peakCount} milestone{peakCount > 1 ? 's' : ''} in one year
                    </div>
                    <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
                      Plan finances accordingly! 💰
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Key Insights */}
            <div style={{
              marginTop: 20,
              padding: 16,
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: 8,
              border: '1px solid #3b82f6'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>
                💡 Key Planning Insights:
              </div>
              <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.7 }}>
                <div style={{ marginBottom: 6 }}>
                  • <strong>Retirement Timeline:</strong> You'll be fully free from education expenses at age {maxParentAge}, so plan your retirement savings to last from that age onwards.
                </div>
                <div style={{ marginBottom: 6 }}>
                  • <strong>Financial Peak:</strong> Your highest education expense periods are highlighted above - ensure adequate savings or income during those years.
                </div>
                <div>
                  • <strong>Current Focus:</strong> Your next milestone is in {allMilestones[0].yearsFromNow} {allMilestones[0].yearsFromNow === 1 ? 'year' : 'years'}. Start preparing financially now!
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  )}

  {/* List/Editor for Children */}
  {safeChildren.map((child, idx) => {
    const costs = calculateChildCosts(child);
    return (
      <div key={child.id} style={{
        background: '#fefce8', border: '1px solid #facc15', borderRadius: 12, padding: 24, marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0, color: '#854d0e' }}>👦 Child {idx + 1}</h4>
          <button
            onClick={() => removeChild(child.id)}
            style={{
              padding: '6px 12px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >Remove</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <LabeledText
            label="Child's Name"
            value={child.name}
            onChange={(v) => updateChild(child.id, 'name', v)}
            placeholder='e.g., Emma'
          />
          <LabeledText
            label='Date of Birth'
            value={child.dobISO}
            onChange={(v) => updateChild(child.id, 'dobISO', v)}
            type='date'
          />
          <LabeledSelect
            label='Gender'
            value={child.gender}
            onChange={(v) => updateChild(child.id, 'gender', v)}
            options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' }
            ]}
          />
        </div>
        {costs && (
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '2px solid #facc15' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#854d0e', marginBottom: 4 }}>
                Current Age: {costs.currentAge} years
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ca8a04' }}>
                Total Education Cost: {fmtSGD(costs.totalCost)}
              </div>
              <div style={{ fontSize: 11, color: '#854d0e', marginTop: 2, fontStyle: 'italic' }}>
                (Inflation-adjusted at 3% annual)
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#854d0e', marginBottom: 8 }}>📚 Education Stages Breakdown:</div>
            {costs.breakdown.map((stage, i) => (
              <div key={i} style={{
                background: stage.stage.includes('PSLE') ? '#f0f9ff' : '#fef3c7',
                padding: 12, borderRadius: 6, marginBottom: 8,
                border: `1px solid ${stage.stage.includes('PSLE') ? '#bfdbfe' : '#fde68a'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: stage.stage.includes('PSLE') ? '#1e40af' : '#92400e', marginBottom: 2 }}>
                      {stage.stage}
                    </div>
                    <div style={{ fontSize: 11, color: stage.stage.includes('PSLE') ? '#1e40af' : '#92400e', opacity: 0.8 }}>{stage.description}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: stage.stage.includes('PSLE') ? '#1e40af' : '#92400e', marginLeft: 12 }}>
                    {fmtSGD(stage.cost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })}

  {/* Grand Total */}
  {allChildrenCosts.length > 0 && (
    <div style={{
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      border: '2px solid #ef4444',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#991b1b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>💰 Total Children Education Costs</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>{fmtSGD(grandTotal)}</div>
        <div style={{ fontSize: 12, color: '#991b1b', opacity: 0.9 }}>
          For {safeChildren.length} {safeChildren.length === 1 ? 'child' : 'children'} • Inflation-adjusted to completion
        </div>
      </div>
    </div>
  )}

  {/* Retirement Timeline */}
  {retirementTimeline && (
    <div style={{
      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
      border: '2px solid #0ea5e9',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20
    }}>
      <h3 style={{ marginTop: 0, color: '#0c4a6e', fontSize: 18, fontWeight: 700 }}>
        📅 Family Education Timeline
      </h3>
      <div style={{ fontSize: 14, color: '#0c4a6e', marginBottom: 16 }}>
        Based on your children's ages, here's when education costs will hit and when you can realistically retire:
      </div>
      {retirementTimeline.timeline.map((t, idx) => (
        <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.7)', padding: 14, borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0c4a6e', marginBottom: 8 }}>
            {t.child.name || `Child ${idx + 1}`} (Currently {t.currentAge} years old)
          </div>
          <div style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.7 }}>
            {t.psleStart && (
              <div>📚 PSLE-O Levels: {t.psleStart}-{t.psleEnd} ({fmtSGD(t.psleCost)})</div>
            )}
            <div>🎓 University: {t.uniStart}-{t.uniEnd} ({fmtSGD(t.uniCost)})</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 16, padding: 16, background: '#fff', borderRadius: 8, border: '2px solid #0ea5e9' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0c4a6e', marginBottom: 8 }}>
          🗓️ Your Realistic Retirement Year: {retirementTimeline.retirementYear}
        </div>
        <div style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.6 }}>
          You'll be <strong>{retirementTimeline.retirementAge} years old</strong> when your youngest child completes university. 
          Plan your retirement savings to sustain from this age, not earlier!
        </div>
      </div>
    </div>
  )}
</div>
```

);
};

/* =========================
MAIN APP COMPONENT
========================= */
export default function SingaporeFAApp() {
// State Management
const [activeTab, setActiveTab] = useState(‘disclaimer’);
const [clients, setClients] = useState(() => {
const saved = localStorage.getItem(‘fa_clients’);
return saved ? JSON.parse(saved) : [];
});
const [selectedClientId, setSelectedClientId] = useState(null);

// Profile State
const [profile, setProfile] = useState({
name: ‘’,
dob: ‘’,
gender: ‘male’,
employmentStatus: ‘employed’,
email: ‘’,
phone: ‘’,
monthlyIncome: ‘’,
grossSalary: ‘’,
takeHome: ‘’,
retirementAge: ‘65’,
customRetirementExpense: ‘’,
referenceYear: new Date().getFullYear(),
referenceMonth: new Date().getMonth(),
children: []
});

// Cashflow State
const [expenses, setExpenses] = useState({
housing: ‘’,
food: ‘’,
transport: ‘’,
insurance: ‘’,
entertainment: ‘’,
others: ‘’
});

// Custom Expenses State
const [customExpenses, setCustomExpenses] = useState([]);

// Retirement State
const [retirement, setRetirement] = useState({
initialSavings: ‘’,
scenario: ‘moderate’,
investmentPercent: ‘100’ // Default 100% of savings goes to retirement investment
});

// Save to localStorage
useEffect(() => {
localStorage.setItem(‘fa_clients’, JSON.stringify(clients));
}, [clients]);

// Computed Values
const age = useMemo(() => {
const dob = parseDob(profile.dob);
if (!dob) return 0;
const months = monthsSinceDob(dob, profile.referenceYear, profile.referenceMonth);
return Math.floor(months / 12);
}, [profile.dob, profile.referenceYear, profile.referenceMonth]);

const cpfData = useMemo(() => {
const income = toNum(profile.grossSalary || profile.monthlyIncome);
if (income === 0 || age === 0) return null;
return computeCpf(income, age);
}, [profile.grossSalary, profile.monthlyIncome, age]);

const cashflowData = useMemo(() => {
if (!cpfData && !profile.takeHome) return null;
const takeHome = toNum(profile.takeHome) || (cpfData ? cpfData.takeHome : 0);

```
// Calculate total expenses including custom expenses
let totalExpenses = Object.values(expenses).reduce((sum, val) => sum + toNum(val), 0);
if (customExpenses) {
  customExpenses.forEach(exp => {
    totalExpenses += toNum(exp.amount, 0);
  });
}

const monthlySavings = takeHome - totalExpenses;
const annualSavings = monthlySavings * 12;

return {
  takeHome,
  totalExpenses,
  monthlySavings,
  annualSavings,
  savingsRate: takeHome > 0 ? (monthlySavings / takeHome * 100) : 0
};
```

}, [cpfData, profile.takeHome, expenses, customExpenses]);

const retirementProjection = useMemo(() => {
if (!cashflowData) return null;

```
const scenarios = {
  conservative: 0.025,
  moderate: 0.05,
  aggressive: 0.08
};

const rate = scenarios[retirement.scenario];
const initial = toNum(retirement.initialSavings);

// Apply investment percentage to monthly savings
const investmentPercent = toNum(retirement.investmentPercent, 100);
const monthly = cashflowData.monthlySavings * (investmentPercent / 100);

const years = Math.max(0, toNum(profile.retirementAge) - age);

if (years <= 0) return null;

return computeRetirementProjection(initial, monthly, rate, years);
```

}, [cashflowData, retirement, profile.retirementAge, age]);

// CRM Functions
const saveClient = () => {
const clientData = {
id: selectedClientId || Date.now().toString(),
profile,
expenses,
customExpenses,
retirement,
lastUpdated: new Date().toISOString(),
followUp: {
nextDate: null,
status: ‘none’
}
};

```
if (selectedClientId) {
  setClients(clients.map(c => c.id === selectedClientId ? clientData : c));
} else {
  setClients([...clients, clientData]);
}

alert('Client saved successfully!');
```

};

const loadClient = (client) => {
setSelectedClientId(client.id);
setProfile({
…client.profile,
children: client.profile.children || []
});
setExpenses(client.expenses);
setCustomExpenses(client.customExpenses || []);
setRetirement(client.retirement);
setActiveTab(‘profile’);
};

const deleteClient = (clientId) => {
if (confirm(‘Are you sure you want to delete this client?’)) {
setClients(clients.filter(c => c.id !== clientId));
if (selectedClientId === clientId) {
setSelectedClientId(null);
}
}
};

const newClient = () => {
setSelectedClientId(null);
setProfile({
name: ‘’,
dob: ‘’,
gender: ‘male’,
employmentStatus: ‘employed’,
email: ‘’,
phone: ‘’,
monthlyIncome: ‘’,
grossSalary: ‘’,
takeHome: ‘’,
retirementAge: ‘65’,
customRetirementExpense: ‘’,
referenceYear: new Date().getFullYear(),
referenceMonth: new Date().getMonth(),
children: []
});
setExpenses({
housing: ‘’,
food: ‘’,
transport: ‘’,
insurance: ‘’,
entertainment: ‘’,
others: ‘’
});
setCustomExpenses([]);
setRetirement({
initialSavings: ‘’,
scenario: ‘moderate’,
investmentPercent: ‘100’
});
setActiveTab(‘profile’);
};

const setFollowUp = (clientId, days) => {
const nextDate = new Date();
nextDate.setDate(nextDate.getDate() + days);

```
setClients(clients.map(c => 
  c.id === clientId 
    ? { ...c, followUp: { nextDate: nextDate.toISOString(), status: 'pending' } }
    : c
));
```

};

const completeFollowUp = (clientId) => {
setClients(clients.map(c =>
c.id === clientId
? { …c, followUp: { …c.followUp, status: ‘completed’ } }
: c
));
};

// Tab Configuration
const tabs = [
{ id: ‘disclaimer’, label: ‘Disclaimer’, icon: ‘⚠️’ },
{ id: ‘profile’, label: ‘Profile’, icon: ‘👤’ },
{ id: ‘children’, label: ‘Children’, icon: ‘👶’ },
{ id: ‘cpf’, label: ‘CPF’, icon: ‘💰’ },
{ id: ‘cashflow’, label: ‘Cashflow’, icon: ‘📊’ },
{ id: ‘retirement’, label: ‘Retirement’, icon: ‘🏖️’ },
{ id: ‘investor’, label: ‘Investor’, icon: ‘📈’ },
{ id: ‘wealth’, label: ‘Wealth Tool’, icon: ‘💎’ },
{ id: ‘crm’, label: ‘CRM’, icon: ‘📋’ }
];

return (
<div style={{ minHeight: ‘100vh’, background: ‘#F9FAFB’, fontFamily: ‘Inter, system-ui, sans-serif’ }}>
{/* Header */}
<div style={{ background: ‘#fff’, borderBottom: ‘1px solid #E5E7EB’, position: ‘sticky’, top: 0, zIndex: 10, boxShadow: ‘0 1px 3px rgba(0,0,0,0.1)’ }}>
<div style={{ maxWidth: 1280, margin: ‘0 auto’, padding: ‘16px 24px’ }}>
<h1 style={{ fontSize: 24, fontWeight: 700, color: ‘#1F2937’, marginBottom: 4 }}>Singapore Financial Advisory App</h1>
<p style={{ fontSize: 13, color: ‘#6B7280’ }}>Enterprise-grade modular financial planning system</p>
</div>

```
    {/* Tabs */}
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ marginRight: 8 }}>{tab.icon}</span>
            {tab.label}
          </TabButton>
        ))}
      </div>
    </div>
  </div>
  
  {/* Content */}
  <div style={{ maxWidth: 1280, margin: '0 auto' }}>
    <TabPanel active={activeTab === 'disclaimer'}>
      <DisclaimerTab />
    </TabPanel>
    <TabPanel active={activeTab === 'profile'}>
      <ProfileTab 
        profile={profile} 
        setProfile={setProfile} 
        age={age} 
        cpfData={cpfData}
        expenses={expenses}
        setExpenses={setExpenses}
        customExpenses={customExpenses}
        setCustomExpenses={setCustomExpenses}
        cashflowData={cashflowData}
      />
    </TabPanel>
    <TabPanel active={activeTab === 'children'}>
      <ChildrenTab 
        children={profile.children || []} 
        setChildren={(children) => setProfile({ ...profile, children })} 
        ageYears={age} 
      />
    </TabPanel>
    <TabPanel active={activeTab === 'cpf'}>
      <CpfTab 
        cpfData={cpfData} 
        age={age} 
      />
    </TabPanel>
    <TabPanel active={activeTab === 'cashflow'}>
      <CashflowTab 
        cpfData={cpfData} 
        expenses={expenses} 
        setExpenses={setExpenses} 
        cashflowData={cashflowData}
        profile={profile}
        customExpenses={customExpenses}
        setCustomExpenses={setCustomExpenses}
      />
    </TabPanel>
    <TabPanel active={activeTab === 'retirement'}>
      <RetirementTab 
        cashflowData={cashflowData} 
        retirement={retirement} 
        setRetirement={setRetirement} 
        retirementProjection={retirementProjection} 
        profile={profile} 
        age={age} 
      />
    </TabPanel>
    <TabPanel active={activeTab === 'investor'}>
      <InvestorTab />
    </TabPanel>
    <TabPanel active={activeTab === 'wealth'}>
      <WealthToolTab />
    </TabPanel>
    <TabPanel active={activeTab === 'crm'}>
      <CrmTab 
        clients={clients} 
        profile={profile} 
        selectedClientId={selectedClientId} 
        newClient={newClient} 
        saveClient={saveClient} 
        loadClient={loadClient} 
        deleteClient={deleteClient} 
        setFollowUp={setFollowUp} 
        completeFollowUp={completeFollowUp} 
      />
    </TabPanel>
  </div>
  
  {/* Footer */}
  <div style={{ background: '#fff', borderTop: '1px solid #E5E7EB', marginTop: 48 }}>
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#6B7280' }}>
        Singapore FA App v1.0 | Modular Architecture | Ready for Supabase Integration
      </p>
    </div>
  </div>
</div>
```

);
}