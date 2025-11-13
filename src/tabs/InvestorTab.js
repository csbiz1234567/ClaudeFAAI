import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD, monthNames, parseDob, monthsSinceDob } from '../utils/helpers.js';

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

);
};

export default InvestorTab;
