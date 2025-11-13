import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD, monthNames, parseDob, monthsSinceDob } from '../utils/helpers.js';
import Card from '../components/Card.js';
import LabeledText from '../components/LabeledText.js';
import LabeledSelect from '../components/LabeledSelect.js';

const ChildrenTab = ({ children, setChildren, ageYears }) => {
// Ensure children is always an array
const safeChildren = children || [];

// Add, remove, update logic
const addChild = () => {
setChildren([...safeChildren, { id: Date.now(), name: '', dobISO: '', gender: 'male' }]);
};

const removeChild = (id) => {
setChildren(safeChildren.filter(c => c.id !== id));
};

const updateChild = (id, field, value) => {
setChildren(safeChildren.map(c => c.id === id ? { ...c, [field]: value } : c));
};

// Cost calculation, inflation, milestones
const calculateChildCosts = (child) => {
if (!child.dobISO) return null;
const childDob = parseDob(child.dobISO);
if (!childDob) return null;

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

};

const allChildrenCosts = safeChildren.map(child => ({
child,
costs: calculateChildCosts(child)
})).filter(c => c.costs !== null);

const grandTotal = allChildrenCosts.reduce((sum, c) => sum + c.costs.totalCost, 0);

// Timeline with realistic "when do you retire"
const calculateRetirementTimeline = () => {
if (!ageYears || allChildrenCosts.length === 0) return null;
const currentYear = new Date().getFullYear();

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

};

const retirementTimeline = calculateRetirementTimeline();

// === UI ===
return (
<div style={{ padding: 20 }}>
{/* Welcome */}
<div style={{
background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
border: '1px solid #f59e0b',
borderRadius: 12,
padding: 24,
marginBottom: 20
}}>
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<div style={{ fontSize: 32 }}>👶</div>
<div>
<h3 style={{ margin: 0, color: '#92400e', fontSize: 20 }}>Children & Education Planning</h3>
<p style={{ margin: '4px 0 0', color: '#92400e', fontSize: 14, opacity: 0.8 }}>
Factor in childcare, education costs with inflation up to university
</p>
</div>
</div>
</div>

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

);
};

export default ChildrenTab;
