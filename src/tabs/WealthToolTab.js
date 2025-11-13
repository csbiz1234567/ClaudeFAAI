import React, { useState, useMemo } from 'react';
import { toNum, fmtSGD, parseDob } from '../utils/helpers.js';
import Card from '../components/Card.js';
import LineChart from '../components/LineChart.js';
import LabeledText from '../components/LabeledText.js';

const WealthToolTab = () => {
const [annualPremium, setAnnualPremium] = useState('');
const [projectionYears, setProjectionYears] = useState('40');
const [growthRate, setGrowthRate] = useState('5');

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

}, [annualPremium, projectionYears, growthRate]);

return (
<div style={{ padding: 24 }}>
<div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
<h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#1F2937' }}>
💎 Wealth Tool - ILP Projection
</h2>

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

const today = new Date();
const thisYear = today.getFullYear();
let nextBirthday = new Date(thisYear, dobDate.getMonth(), dobDate.getDate());

if (nextBirthday < today) {
  nextBirthday = new Date(thisYear + 1, dobDate.getMonth(), dobDate.getDate());
}

const diffTime = nextBirthday - today;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
return diffDays;

};

return (
<div style={{ padding: 20 }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
<h2 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>Client Management</h2>
<button
onClick={newClient}
style={{
padding: '10px 20px',
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
color: '#fff',
border: 'none',
borderRadius: 8,
fontSize: 14,
fontWeight: 600,
cursor: 'pointer',
boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
}}
>
+ New Client
</button>
</div>

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

);
};


export default WealthToolTab;
