// Philippine BIR TRAIN Law Tax Table (effective Jan 1, 2023 onwards)
// Based on RA 10963 (TRAIN Law) graduated tax rates
export const TAX_BRACKETS = [
  { min: 0, max: 250000, rate: 0, base: 0 },
  { min: 250001, max: 400000, rate: 0.15, base: 0 },
  { min: 400001, max: 800000, rate: 0.20, base: 22500 },
  { min: 800001, max: 2000000, rate: 0.25, base: 102500 },
  { min: 2000001, max: 8000000, rate: 0.30, base: 402500 },
  { min: 8000001, max: Infinity, rate: 0.35, base: 2202500 },
];

// SSS Contribution Table 2024
// Monthly Salary Credit ranges and corresponding contributions
export const SSS_TABLE = [
  { minSalary: 0, maxSalary: 4249.99, msc: 4000, ee: 180, er: 380 },
  { minSalary: 4250, maxSalary: 4749.99, msc: 4500, ee: 202.5, er: 427.5 },
  { minSalary: 4750, maxSalary: 5249.99, msc: 5000, ee: 225, er: 475 },
  { minSalary: 5250, maxSalary: 5749.99, msc: 5500, ee: 247.5, er: 522.5 },
  { minSalary: 5750, maxSalary: 6249.99, msc: 6000, ee: 270, er: 570 },
  { minSalary: 6250, maxSalary: 6749.99, msc: 6500, ee: 292.5, er: 617.5 },
  { minSalary: 6750, maxSalary: 7249.99, msc: 7000, ee: 315, er: 665 },
  { minSalary: 7250, maxSalary: 7749.99, msc: 7500, ee: 337.5, er: 712.5 },
  { minSalary: 7750, maxSalary: 8249.99, msc: 8000, ee: 360, er: 760 },
  { minSalary: 8250, maxSalary: 8749.99, msc: 8500, ee: 382.5, er: 807.5 },
  { minSalary: 8750, maxSalary: 9249.99, msc: 9000, ee: 405, er: 855 },
  { minSalary: 9250, maxSalary: 9749.99, msc: 9500, ee: 427.5, er: 902.5 },
  { minSalary: 9750, maxSalary: 10249.99, msc: 10000, ee: 450, er: 950 },
  { minSalary: 10250, maxSalary: 10749.99, msc: 10500, ee: 472.5, er: 997.5 },
  { minSalary: 10750, maxSalary: 11249.99, msc: 11000, ee: 495, er: 1045 },
  { minSalary: 11250, maxSalary: 11749.99, msc: 11500, ee: 517.5, er: 1092.5 },
  { minSalary: 11750, maxSalary: 12249.99, msc: 12000, ee: 540, er: 1140 },
  { minSalary: 12250, maxSalary: 12749.99, msc: 12500, ee: 562.5, er: 1187.5 },
  { minSalary: 12750, maxSalary: 13249.99, msc: 13000, ee: 585, er: 1235 },
  { minSalary: 13250, maxSalary: 13749.99, msc: 13500, ee: 607.5, er: 1282.5 },
  { minSalary: 13750, maxSalary: 14249.99, msc: 14000, ee: 630, er: 1330 },
  { minSalary: 14250, maxSalary: 14749.99, msc: 14500, ee: 652.5, er: 1377.5 },
  { minSalary: 14750, maxSalary: 15249.99, msc: 15000, ee: 675, er: 1425 },
  { minSalary: 15250, maxSalary: 15749.99, msc: 15500, ee: 697.5, er: 1472.5 },
  { minSalary: 15750, maxSalary: 16249.99, msc: 16000, ee: 720, er: 1520 },
  { minSalary: 16250, maxSalary: 16749.99, msc: 16500, ee: 742.5, er: 1567.5 },
  { minSalary: 16750, maxSalary: 17249.99, msc: 17000, ee: 765, er: 1615 },
  { minSalary: 17250, maxSalary: 17749.99, msc: 17500, ee: 787.5, er: 1662.5 },
  { minSalary: 17750, maxSalary: 18249.99, msc: 18000, ee: 810, er: 1710 },
  { minSalary: 18250, maxSalary: 18749.99, msc: 18500, ee: 832.5, er: 1757.5 },
  { minSalary: 18750, maxSalary: 19249.99, msc: 19000, ee: 855, er: 1805 },
  { minSalary: 19250, maxSalary: 19749.99, msc: 19500, ee: 877.5, er: 1852.5 },
  { minSalary: 19750, maxSalary: 20249.99, msc: 20000, ee: 900, er: 1900 },
  { minSalary: 20250, maxSalary: 24749.99, msc: 20000, ee: 900, er: 1900 },
  { minSalary: 24750, maxSalary: 29249.99, msc: 25000, ee: 1125, er: 2375 },
  { minSalary: 29250, maxSalary: Infinity, msc: 30000, ee: 1350, er: 2850 },
];

// PhilHealth Contribution Rate 2024: 5% of monthly basic salary (shared equally)
export const PHILHEALTH_RATE = 0.05;
export const PHILHEALTH_FLOOR = 10000; // Minimum salary base
export const PHILHEALTH_CEILING = 100000; // Maximum salary base

// Pag-IBIG Fund Contribution
export const PAGIBIG_EMPLOYEE_RATE_LOW = 0.01; // For salary <= 1,500
export const PAGIBIG_EMPLOYEE_RATE_HIGH = 0.02; // For salary > 1,500
export const PAGIBIG_EMPLOYER_RATE = 0.02;
export const PAGIBIG_MAX_CONTRIBUTION = 200; // Max employee contribution per month (based on 10,000 ceiling)

export function computeIncomeTax(annualTaxableIncome: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (annualTaxableIncome >= bracket.min && annualTaxableIncome <= bracket.max) {
      return bracket.base + (annualTaxableIncome - bracket.min + 1) * bracket.rate;
    }
  }
  const lastBracket = TAX_BRACKETS[TAX_BRACKETS.length - 1];
  return lastBracket.base + (annualTaxableIncome - lastBracket.min + 1) * lastBracket.rate;
}

export function computeSSS(monthlySalary: number): { employee: number; employer: number } {
  for (const row of SSS_TABLE) {
    if (monthlySalary >= row.minSalary && monthlySalary <= row.maxSalary) {
      return { employee: row.ee, employer: row.er };
    }
  }
  const lastRow = SSS_TABLE[SSS_TABLE.length - 1];
  return { employee: lastRow.ee, employer: lastRow.er };
}

export function computePhilHealth(monthlySalary: number): {
  employee: number;
  employer: number;
} {
  const base = Math.min(
    Math.max(monthlySalary, PHILHEALTH_FLOOR),
    PHILHEALTH_CEILING
  );
  const total = base * PHILHEALTH_RATE;
  const share = total / 2;
  return { employee: share, employer: share };
}

export function computePagIBIG(monthlySalary: number): {
  employee: number;
  employer: number;
} {
  const rate =
    monthlySalary <= 1500
      ? PAGIBIG_EMPLOYEE_RATE_LOW
      : PAGIBIG_EMPLOYEE_RATE_HIGH;
  const employee = Math.min(monthlySalary * rate, PAGIBIG_MAX_CONTRIBUTION);
  const employer = Math.min(monthlySalary * PAGIBIG_EMPLOYER_RATE, PAGIBIG_MAX_CONTRIBUTION);
  return { employee, employer };
}
