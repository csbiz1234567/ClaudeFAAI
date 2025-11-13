import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toNum, fmtSGD, monthNames, parseDob, monthsSinceDob } from '../utils/helpers.js';

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

export default WealthToolTab;
