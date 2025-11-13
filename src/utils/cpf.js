// CPF calculation functions for Singapore

export const getCpfRates = (age) => {
  if (age <= 35) return { employee: 0.20, employer: 0.17 };
  if (age <= 45) return { employee: 0.20, employer: 0.17 };
  if (age <= 50) return { employee: 0.20, employer: 0.17 };
  if (age <= 55) return { employee: 0.20, employer: 0.17 };
  if (age <= 60) return { employee: 0.17, employer: 0.155 };
  if (age <= 65) return { employee: 0.115, employer: 0.12 };
  if (age <= 70) return { employee: 0.075, employer: 0.09 };
  return { employee: 0.05, employer: 0.075 };
};

// Returns the CPF allocation rates for OA, SA, MA based on age
export const getCPFRates = (age) => {
  if (age < 35) return { oa: 0.6217, sa: 0.1622, ma: 0.2162 };
  if (age < 45) return { oa: 0.5676, sa: 0.1892, ma: 0.2432 };
  if (age < 50) return { oa: 0.5135, sa: 0.2162, ma: 0.2703 };
  if (age < 55) return { oa: 0.4324, sa: 0.2703, ma: 0.2973 };
  if (age < 60) return { oa: 0.2973, sa: 0.3514, ma: 0.3514 };
  if (age < 65) return { oa: 0.1351, sa: 0.3919, ma: 0.4730 };
  return { oa: 0, sa: 0, ma: 0 };
};

export const getCpfAllocation = (age) => {
  // Simplified 2025 allocation ratios (adjust as needed)
  if (age <= 35) return { oa: 0.6216, sa: 0.1622, ma: 0.2162 };
  if (age <= 45) return { oa: 0.5405, sa: 0.1892, ma: 0.2703 };
  if (age <= 50) return { oa: 0.4595, sa: 0.2162, ma: 0.3243 };
  if (age <= 55) return { oa: 0.3784, sa: 0.2432, ma: 0.3784 };
  if (age <= 60) return { oa: 0.4211, sa: 0.2632, ma: 0.3158 };
  if (age <= 65) return { oa: 0.3478, sa: 0.1739, ma: 0.4783 };
  return { oa: 0.3333, sa: 0.1667, ma: 0.5000 };
};

export const computeCpf = (monthlyIncome, age) => {
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
