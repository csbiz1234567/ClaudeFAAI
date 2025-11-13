// Retirement projection calculations

export const computeRetirementProjection = (initialAmount, monthlyContribution, annualReturn, yearsToProject) => {
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

    if (m % 12 === 0) {
      projection.push({
        year: m / 12,
        balance: Math.round(balance),
        contributions: Math.round(totalContributions),
        gains: Math.round(balance - totalContributions)
      });
    }
  }

  return projection;
};
