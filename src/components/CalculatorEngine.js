'use client';
import { useState, useCallback, useEffect } from 'react';

// ---- Precision Helpers ----
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ---- Formatter ----
function fmt(n, decimals = 0) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  if (n >= 1e15) return BigInt(Math.round(n)).toLocaleString('en-IN');
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtR(n) { return '₹' + fmt(round2(n), 2); }
function fmtR0(n) { return '₹' + fmt(Math.round(n)); }

// ---- Flag Emoji Helper ----
function getFlagEmoji(currencyCode) {
  if (!currencyCode) return '🏳️';
  const cc = currencyCode.toUpperCase();
  const custom = { EUR: '🇪🇺', BTC: '₿', ETH: 'Ξ', DOGE: 'Ð', USDC: '💵', XRP: '✕' };
  if (custom[cc]) return custom[cc];
  if (cc.length >= 2) {
    const code = cc.substring(0, 2);
    return String.fromCodePoint(code.charCodeAt(0) + 127397, code.charCodeAt(1) + 127397);
  }
  return '🏳️';
}

// =====================================================
// ---- Calculator Logic Functions ----
// =====================================================

// ---- 1. CURRENCY CONVERTER (Dynamic Cross-Rate via USD Base) ----
function calcCurrency(vals, rates) {
  const amount = +vals.amount;
  if (!amount) return null;
  const from = vals.from || 'INR', to = vals.to || 'USD';
  
  const safeRates = rates || { USD: 1.0, INR: 92.34 };
  const fromRate = safeRates[from] || safeRates['INR'] || 92.34;
  const toRate = safeRates[to] || safeRates['USD'] || 1.0;

  // Cross-rate: convert from → USD → to
  const amountInUSD = amount / fromRate;
  const result = round2(amountInUSD * toRate);

  // Compute direct exchange rate for display
  const directRate = toRate / fromRate;

  return { main: fmt(result, 2) + ' ' + to, label: `${fmt(amount, 2)} ${from} =`, items: [
    { label: `1 ${from}`, val: `${(directRate).toFixed(6)} ${to}` },
    { label: `1 ${to}`, val: `${(1 / directRate).toFixed(6)} ${from}` },
    { label: 'Live Rates', val: 'Via CurrencyFreaks' },
    { label: '⚠️ Indicative', val: 'Verify with bank/RBI' },
  ] };
}

// ---- 1.A CRYPTO CONVERTER ----
function calcCrypto(vals, rates) {
  const amount = +vals.amount;
  if (!amount) return null;
  const token = vals.token || 'BTC', currency = vals.currency || 'USD';
  
  const safeRates = rates || { USD: 1.0, INR: 92.34, BTC: 0.000015, ETH: 0.0003 };
  const tokenRate = safeRates[token];
  const fiatRate = safeRates[currency] || safeRates['USD'] || 1.0;
  
  if (!tokenRate || !fiatRate) return { main: 'Data Unavailable', label: 'Error', items: [] };

  // API gives 1 USD = X Tokens. 
  // Formula: USD = Amount / TokenRate. Result Fiat = USD * FiatRate for fiat.
  // Wait, if it's token to fiat:
  // Math: amount of Token in USD = amount / tokenRate
  // amount of Token in targeted fiat = (amount / tokenRate) * fiatRate
  const valInUSD = amount / tokenRate;
  const result = valInUSD * fiatRate;
  const directExchange = fiatRate / tokenRate;

  // Render extremely large numbers correctly
  const fmtNoSci = (n, dp) => n < 1e15 ? n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp, useGrouping: true }) : BigInt(Math.round(n)).toLocaleString('en-IN');

  return { main: fmtNoSci(result, 2) + ' ' + currency, label: `${fmtNoSci(amount, 6)} ${token} =`, items: [
    { label: `1 ${token}`, val: `${fmtNoSci(directExchange, 2)} ${currency}` },
    { label: 'Live Rates', val: 'Via CurrencyFreaks' },
    { label: '⚠️ Volatile', val: 'Crypto rates change rapidly' },
  ] };
}

// ---- 2. SIP CALCULATOR (Step-Up + Amortization Table) ----
function calcSIP(vals) {
  const P = +vals.monthly, annualRate = +vals.rate, years = +vals.years;
  const enableStepUp = vals.enableStepUp === 'yes';
  const stepUpPct = enableStepUp ? (+vals.stepUp || 0) : 0;
  const i = annualRate / 12 / 100;
  const totalMonths = years * 12;
  if (!P || !annualRate || !totalMonths) return null;

  if (stepUpPct === 0) {
    // Standard SIP: M = P × [(1+i)^n − 1] / i × (1+i)
    const total = round2(P * ((Math.pow(1 + i, totalMonths) - 1) / i) * (1 + i));
    const invested = round2(P * totalMonths);

    // Yearly amortization
    const headers = ['Year', 'Monthly SIP', 'Invested (Cum.)', 'Corpus'];
    const rows = [];
    for (let yr = 1; yr <= years; yr++) {
      const n = yr * 12;
      const corpus = round2(P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i));
      rows.push([yr, fmtR0(P), fmtR0(P * n), fmtR0(corpus)]);
    }

    return { main: fmtR0(total), label: 'Estimated Corpus', items: [
      { label: 'Monthly SIP', val: fmtR0(P) },
      { label: 'Total Invested', val: fmtR0(invested) },
      { label: 'Est. Returns', val: fmtR0(total - invested) },
      { label: 'Duration', val: years + ' years' },
    ], table: { title: 'Year-wise SIP Breakdown', headers, rows } };
  } else {
    // Step-Up SIP: investment increases by stepUpPct% every year
    let totalInvested = 0, corpus = 0, currentSIP = P;
    const headers = ['Year', 'Monthly SIP', 'Invested (Cum.)', 'Corpus'];
    const rows = [];

    for (let yr = 1; yr <= years; yr++) {
      for (let m = 0; m < 12; m++) {
        corpus = (corpus + currentSIP) * (1 + i);
        totalInvested += currentSIP;
      }
      rows.push([yr, fmtR0(currentSIP), fmtR0(totalInvested), fmtR0(corpus)]);
      currentSIP = round2(currentSIP * (1 + stepUpPct / 100));
    }
    corpus = round2(corpus);
    totalInvested = round2(totalInvested);

    return { main: fmtR0(corpus), label: 'Estimated Corpus (Step-Up)', items: [
      { label: 'Starting SIP', val: fmtR0(P) },
      { label: 'Final Year SIP', val: fmtR0(currentSIP / (1 + stepUpPct / 100)) },
      { label: 'Total Invested', val: fmtR0(totalInvested) },
      { label: 'Est. Returns', val: fmtR0(corpus - totalInvested) },
      { label: 'Step-Up', val: stepUpPct + '% / year' },
    ], table: { title: 'Year-wise Step-Up SIP Breakdown', headers, rows } };
  }
}

// ---- 3. HOME LOAN EMI (Reducing Balance + Amortization) ----
function calcEMI(vals) {
  const P = +vals.principal, annualRate = +vals.rate, yearsNum = +vals.years;
  const R = annualRate / 12 / 100, N = yearsNum * 12;
  if (!P || !R || !N) return null;
  const emi = round2(P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1));
  const totalPayable = round2(emi * N);
  const totalInterest = round2(totalPayable - P);

  // Yearly amortization table
  const headers = ['Year', 'Principal Paid', 'Interest Paid', 'Balance'];
  const rows = [];
  let balance = P;
  for (let yr = 1; yr <= yearsNum; yr++) {
    let yearPrincipal = 0, yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const interestPart = round2(balance * R);
      const principalPart = round2(emi - interestPart);
      yearPrincipal += principalPart;
      yearInterest += interestPart;
      balance = round2(balance - principalPart);
    }
    if (balance < 0) balance = 0;
    rows.push([yr, fmtR0(yearPrincipal), fmtR0(yearInterest), fmtR0(balance)]);
  }

  return { main: fmtR0(emi), label: 'Monthly EMI', items: [
    { label: 'Loan Amount', val: fmtR0(P) },
    { label: 'Total Interest', val: fmtR0(totalInterest) },
    { label: 'Total Payable', val: fmtR0(totalPayable) },
    { label: 'Tenure', val: N + ' months' },
  ], table: { title: 'Yearly Amortization Schedule', headers, rows } };
}

// ---- 4. INCOME TAX 2026 (New vs Old Regime Comparison) ----
function calcTax(vals) {
  const income = +vals.income;
  if (!income) return null;

  // --- NEW REGIME FY 2026-27 ---
  const newStdDeduction = 75000;
  const newTaxable = Math.max(income - newStdDeduction, 0);
  const newSlabs = [[300000, 0], [400000, 0.05], [300000, 0.10], [200000, 0.15], [300000, 0.20], [Infinity, 0.30]];
  let newTax = 0, rem = newTaxable;
  for (const [lim, rate] of newSlabs) { const t = Math.min(rem, lim); newTax += t * rate; rem -= t; if (rem <= 0) break; }
  if (newTaxable <= 700000) newTax = 0; // Section 87A rebate
  const newCess = round2(newTax * 0.04);
  const newTotal = round2(newTax + newCess);

  // --- OLD REGIME FY 2026-27 ---
  const oldStdDeduction = 50000;
  const deductions80C = Math.min(+vals.ded80c || 0, 150000);
  const deductions80D = +vals.ded80d || 0;
  const hraExempt = +vals.hraExempt || 0;
  const homeLoan24b = Math.min(+vals.homeLoan || 0, 200000);
  const totalOldDeductions = oldStdDeduction + deductions80C + deductions80D + hraExempt + homeLoan24b;
  const oldTaxable = Math.max(income - totalOldDeductions, 0);
  const oldSlabs = [[250000, 0], [250000, 0.05], [500000, 0.20], [Infinity, 0.30]];
  let oldTax = 0; rem = oldTaxable;
  for (const [lim, rate] of oldSlabs) { const t = Math.min(rem, lim); oldTax += t * rate; rem -= t; if (rem <= 0) break; }
  if (oldTaxable <= 500000) oldTax = 0; // Section 87A old
  const oldCess = round2(oldTax * 0.04);
  const oldTotal = round2(oldTax + oldCess);

  const better = newTotal <= oldTotal ? '✅ New Regime' : '✅ Old Regime';
  const savings = Math.abs(newTotal - oldTotal);

  return { main: better + ' saves ' + fmtR0(savings), label: 'Recommendation', items: [
    { label: 'New Regime Tax', val: fmtR0(newTotal) },
    { label: 'Old Regime Tax', val: fmtR0(oldTotal) },
    { label: 'New Taxable', val: fmtR0(newTaxable) },
    { label: 'Old Taxable', val: fmtR0(oldTaxable) },
    { label: 'New Cess (4%)', val: fmtR0(newCess) },
    { label: 'Old Cess (4%)', val: fmtR0(oldCess) },
    { label: 'Old Deductions', val: fmtR0(totalOldDeductions) },
  ] };
}

// ---- 5. BIGHA TO SQ FT (State-Wise with Punjab, Haryana, MP) ----
function calcBigha(vals) {
  const value = +vals.value, from = vals.from;
  if (!value) return null;
  const toSqFt = {
    bighaUP: 26910.66,
    bighaBihar: 27220,
    bighaWB: 14400,
    bighaRaj: 27225,
    bighaMP: 12446.58,
    bighaHaryana: 27225,
    bighaPunjab: 27225,
    acre: 43560,
    hectare: 107639,
    gaj: 9,
    sqm: 10.764,
  };
  const sqft = round2(value * (toSqFt[from] || 1));
  return { main: fmt(sqft, 2) + ' sq ft', label: 'Equivalent Area', items: [
    { label: 'Acres', val: (sqft / 43560).toFixed(4) },
    { label: 'Hectares', val: (sqft / 107639).toFixed(4) },
    { label: 'Gaj (sq yd)', val: fmt(round2(sqft / 9), 2) },
    { label: 'Sq Meters', val: (sqft / 10.764).toFixed(2) },
    { label: 'Bigha (UP)', val: (sqft / 26910.66).toFixed(4) },
  ] };
}

// ---- 6. GOLD/SILVER RATE (Dynamic Live Prices) ----
function calcGold(vals, rates) {
  const weight = +vals.weight, making = +vals.making || 0;
  const metalType = vals.metalType || 'XAU';
  const purityVal = +(vals.purity || 91.67);
  if (!weight) return null;

  const safeRates = rates || { INR: 92.34, XAU: 2450.00, XAG: 30.50 };
  const usdRate = safeRates['INR'] || 92.34;
  const metalUSDPerOz = safeRates[metalType] || (metalType === 'XAU' ? 2450 : 30.50);
  const metalINRPerGram = (metalUSDPerOz / 31.1034768) * usdRate;

  const rate = +vals.rate || metalINRPerGram; 
  const purity = purityVal / 100;

  const metalVal = round2(weight * rate * purity);
  const makingAmt = round2(metalVal * making / 100);

  const gstMetal = round2(metalVal * 0.03);
  const gstMaking = round2(makingAmt * 0.05);

  const total = round2(metalVal + makingAmt + gstMetal + gstMaking);
  const label = metalType === 'XAU' ? 'Gold' : 'Silver';

  return { main: fmtR(total), label: `Total ${label} Cost`, items: [
    { label: `${label} Value`, val: fmtR(metalVal) },
    { label: 'Rate (₹/gm)', val: fmtR(rate) },
    { label: `Making (${making}%)`, val: fmtR(makingAmt) },
    { label: 'GST (Metal 3%)', val: fmtR(gstMetal) },
    { label: 'GST (Making 5%)', val: fmtR(gstMaking) },
    { label: 'Live Rates', val: 'Via CurrencyFreaks' },
  ] };
}

// ---- 7. SALARY / TAKE-HOME (FY 2026-27 New Regime) ----
function calcSalary(vals) {
  const ctc = +vals.ctc;
  if (!ctc) return null;
  const basic = round2(ctc * 0.4);
  const hra = round2(basic * 0.5);
  const gratuity = round2(basic * 0.0481);
  const empPF = round2(basic * 0.12);
  const professionalTax = 2500;
  const special = round2(ctc - basic - hra - gratuity);

  // Tax under New Regime FY 2026-27
  const stdDeduction = 75000;
  const taxable = Math.max(ctc - empPF - stdDeduction, 0);
  const slabs = [[300000, 0], [400000, 0.05], [300000, 0.10], [200000, 0.15], [300000, 0.20], [Infinity, 0.30]];
  let tax = 0, rem = taxable;
  for (const [limit, rate] of slabs) { const t = Math.min(rem, limit); tax += t * rate; rem -= t; if (rem <= 0) break; }
  if (taxable <= 700000) tax = 0; // 87A rebate
  tax = round2(tax + tax * 0.04); // + 4% cess

  const annualNet = round2(ctc - empPF - gratuity - tax - professionalTax);
  const monthly = round2(annualNet / 12);

  return { main: fmtR0(monthly), label: 'Monthly In-Hand (est.)', items: [
    { label: 'Annual CTC', val: fmtR0(ctc) },
    { label: 'Monthly Basic', val: fmtR0(basic / 12) },
    { label: 'Monthly HRA', val: fmtR0(hra / 12) },
    { label: 'Monthly PF (12%)', val: fmtR0(empPF / 12) },
    { label: 'Annual Tax', val: fmtR0(tax) },
    { label: 'Gratuity (4.81%)', val: fmtR0(gratuity) },
    { label: 'Prof. Tax', val: fmtR0(professionalTax) },
    { label: 'Special Allow.', val: fmtR0(special) },
  ] };
}

// ---- 8. FD CALCULATOR (Quarterly Compounding + TDS + Yearly Table) ----
function calcFD(vals) {
  const P = +vals.principal, r = +vals.rate / 100, n = +vals.compound || 4, t = +vals.years;
  if (!P || !r || !t) return null;
  const A = round2(P * Math.pow(1 + r / n, n * t));
  const interest = round2(A - P);
  const effectiveRate = round2((Math.pow(1 + r / n, n) - 1) * 100);

  // TDS calculation
  const annualInterest = round2(interest / t);
  const tdsApplies = annualInterest > 40000;
  const tds = tdsApplies ? round2(annualInterest * 0.10) : 0;

  // Yearly breakdown
  const headers = ['Year', 'Opening', 'Interest', 'Closing'];
  const rows = [];
  for (let yr = 1; yr <= t; yr++) {
    const opening = round2(P * Math.pow(1 + r / n, n * (yr - 1)));
    const closing = round2(P * Math.pow(1 + r / n, n * yr));
    const yrInterest = round2(closing - opening);
    rows.push([yr, fmtR0(opening), fmtR0(yrInterest), fmtR0(closing)]);
  }

  return { main: fmtR(A), label: 'Maturity Amount', items: [
    { label: 'Principal', val: fmtR0(P) },
    { label: 'Interest Earned', val: fmtR(interest) },
    { label: 'Effective Rate', val: effectiveRate.toFixed(2) + '%' },
    { label: 'Tenure', val: t + ' years' },
    { label: 'Avg Annual Interest', val: fmtR0(annualInterest) },
    { label: 'TDS (10%)', val: tdsApplies ? fmtR0(tds) + '/yr' : 'Not applicable (< ₹40K)' },
  ], table: { title: 'Yearly FD Breakdown', headers, rows } };
}

// ---- 9. CAGR CALCULATOR (Enhanced) ----
function calcCAGR(vals) {
  const begin = +vals.begin, end = +vals.end, years = +vals.years;
  if (!begin || !end || !years) return null;
  const cagr = round2((Math.pow(end / begin, 1 / years) - 1) * 100);
  const absoluteReturn = round2((end - begin) / begin * 100);
  const doublingTime = cagr > 0 ? round2(72 / cagr) : Infinity;
  const totalGain = round2(end - begin);

  return { main: cagr.toFixed(2) + '%', label: 'CAGR (Compound Annual Growth Rate)', items: [
    { label: 'Absolute Return', val: absoluteReturn.toFixed(2) + '%' },
    { label: 'Total Gain', val: fmtR(totalGain) },
    { label: 'Doubling Time', val: doublingTime === Infinity ? 'N/A' : doublingTime.toFixed(1) + ' years (Rule of 72)' },
    { label: 'Beginning Value', val: fmtR0(begin) },
    { label: 'Ending Value', val: fmtR0(end) },
    { label: 'Period', val: years + ' years' },
  ] };
}

// ---- 10. FIRE CALCULATOR (Enhanced) ----
function calcFIRE(vals) {
  const monthlyExpense = +vals.expense, inflation = +vals.inflation / 100;
  const savings = +vals.savings, monthly = +vals.sip, ret = +vals.rate / 100;
  if (!monthlyExpense) return null;

  const annualExpense = monthlyExpense * 12;
  // Inflation-adjusted expenses 25 years from now
  const futureAnnualExpense = round2(annualExpense * Math.pow(1 + inflation, 25));

  // FIRE corpus at different SWR rates
  const corpus4pct = round2(futureAnnualExpense * 25); // 4% rule
  const corpus3pct = round2(futureAnnualExpense / 0.03); // 3% rule
  const corpus2_5pct = round2(futureAnnualExpense / 0.025); // 2.5% rule

  // Years to reach 4% FIRE corpus
  let yrs = 0, total = savings;
  while (total < corpus4pct && yrs < 100) {
    total = total * (1 + ret) + monthly * 12;
    yrs++;
  }

  return { main: fmt(yrs) + ' years', label: 'Years to FIRE (4% Rule)', items: [
    { label: 'Target Corpus (4%)', val: fmtR0(corpus4pct) },
    { label: 'Target Corpus (3%)', val: fmtR0(corpus3pct) },
    { label: 'Target Corpus (2.5%)', val: fmtR0(corpus2_5pct) },
    { label: 'Future Annual Expenses', val: fmtR0(futureAnnualExpense) },
    { label: 'Current Savings', val: fmtR0(savings) },
    { label: 'Monthly SIP', val: fmtR0(monthly) },
    { label: 'Safe Withdrawal (4%/yr)', val: fmtR0(corpus4pct * 0.04 / 12) + '/month' },
  ] };
}

// =====================================================
// ---- OTHER CALCULATOR FUNCTIONS (Unchanged logic, precision-wrapped) ----
// =====================================================

function calcGST(vals) {
  const amt = +vals.amount, rate = +vals.rate;
  if (!amt || !rate) return null;
  if (vals.mode === 'add') {
    const gst = round2(amt * rate / 100);
    return { main: fmtR(amt + gst), label: 'Total (incl. GST)', items: [
      { label: 'Base Price', val: fmtR(amt) },
      { label: `GST (${rate}%)`, val: fmtR(gst) },
      { label: `CGST (${rate/2}%)`, val: fmtR(gst / 2) },
      { label: `SGST (${rate/2}%)`, val: fmtR(gst / 2) },
    ] };
  } else {
    const base = round2(amt * 100 / (100 + rate));
    const gst = round2(amt - base);
    return { main: fmtR(base), label: 'Base Price (excl. GST)', items: [
      { label: 'Inclusive Price', val: fmtR(amt) },
      { label: `GST (${rate}%)`, val: fmtR(gst) },
      { label: `CGST`, val: fmtR(gst / 2) },
      { label: `SGST`, val: fmtR(gst / 2) },
    ] };
  }
}

function calcLumpsum(vals) {
  const P = +vals.principal, r = +vals.rate / 100, n = +vals.years;
  if (!P || !r || !n) return null;
  const A = round2(P * Math.pow(1 + r, n));
  return { main: fmtR0(A), label: 'Estimated Corpus', items: [
    { label: 'Invested', val: fmtR0(P) },
    { label: 'Gains', val: fmtR0(A - P) },
    { label: 'Return Multiple', val: (A / P).toFixed(2) + 'x' },
    { label: 'Duration', val: n + ' years' },
  ] };
}

function calcStamp(vals) {
  const price = +vals.price, stampRate = +vals.stampRate, regRate = +vals.regRate || 1;
  if (!price || !stampRate) return null;
  const stamp = round2(price * stampRate / 100), reg = round2(price * regRate / 100);
  return { main: fmtR0(stamp + reg), label: 'Total Registration Cost', items: [
    { label: 'Property Value', val: fmtR0(price) },
    { label: 'Stamp Duty (' + stampRate + '%)', val: fmtR0(stamp) },
    { label: 'Registration (' + regRate + '%)', val: fmtR0(reg) },
    { label: 'Total to Buyer', val: fmtR0(price + stamp + reg) },
  ] };
}

function calcConstruction(vals) {
  const area = +vals.area, rate = +vals.rate;
  if (!area || !rate) return null;
  const total = round2(area * rate);
  return { main: fmtR0(total), label: 'Estimated Cost', items: [
    { label: 'Area', val: fmt(area) + ' sq ft' },
    { label: 'Rate', val: fmtR0(rate) + '/sq ft' },
    { label: 'Civil Work (60%)', val: fmtR0(total * 0.6) },
    { label: 'Finishing (40%)', val: fmtR0(total * 0.4) },
  ] };
}

function calcRentVsBuy(vals) {
  const price = +vals.price, down = +vals.down, rate = +vals.rate, rent = +vals.rent, years = +vals.years, appr = +vals.appreciation || 5;
  if (!price || !rent || !years) return null;
  const loan = price - down, R = rate / 12 / 100, N = years * 12;
  const emi = loan > 0 && R > 0 ? round2(loan * R * Math.pow(1+R,N)/(Math.pow(1+R,N)-1)) : 0;
  const buyTotal = round2(emi * N + down);
  const propertyVal = round2(price * Math.pow(1 + appr/100, years));
  const buyCost = round2(buyTotal - propertyVal);
  const rentTotal = round2(rent * 12 * ((Math.pow(1.05, years) - 1) / 0.05));
  return { main: buyCost < rentTotal ? '🏠 Buy is better' : '🏢 Rent is better', label: 'Verdict', items: [
    { label: 'Total EMI + Down', val: fmtR0(buyTotal) },
    { label: 'Property Value (future)', val: fmtR0(propertyVal) },
    { label: 'Net Buy Cost', val: fmtR0(buyCost) },
    { label: 'Total Rent Cost', val: fmtR0(rentTotal) },
  ] };
}

function calcCGPA(vals) {
  const cgpa = +vals.cgpa;
  if (!cgpa || cgpa > 10) return null;
  const pct = cgpa * 9.5;
  let grade = pct >= 90 ? 'O (Outstanding)' : pct >= 80 ? 'A+ (Excellent)' : pct >= 70 ? 'A (Very Good)' : pct >= 60 ? 'B+ (Good)' : pct >= 50 ? 'B (Above Average)' : pct >= 45 ? 'C (Average)' : 'P (Pass)';
  return { main: pct.toFixed(2) + '%', label: 'Equivalent Percentage', items: [
    { label: 'CGPA', val: cgpa.toFixed(2) },
    { label: 'Grade', val: grade },
    { label: 'Class', val: pct >= 60 ? 'First Division' : pct >= 50 ? 'Second Division' : 'Third Division' },
  ] };
}

function calcAttendance(vals) {
  const total = +vals.total, attended = +vals.attended, required = +vals.required || 75;
  if (!total || attended === undefined) return null;
  const pct = (attended / total) * 100;
  const canMiss = Math.floor((attended - required / 100 * total) / (1 - required / 100));
  const mustAttend = Math.ceil((required / 100 * total - attended) / (1 - required / 100));
  return { main: pct.toFixed(2) + '%', label: 'Current Attendance', items: [
    { label: 'Attended / Total', val: attended + ' / ' + total },
    { label: 'Status', val: pct >= required ? '✅ Safe' : '⚠️ Below required' },
    { label: pct >= required ? 'Can miss' : 'Must attend', val: (pct >= required ? Math.max(canMiss, 0) : Math.max(mustAttend, 0)) + ' classes' },
  ] };
}

function calcAge(vals) {
  const dob = new Date(vals.dob);
  if (isNaN(dob)) return null;
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();
  if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((today - dob) / (1000 * 60 * 60 * 24));
  return { main: years + ' years', label: 'Your Age', items: [
    { label: 'Years, Months, Days', val: `${years}y ${months}m ${days}d` },
    { label: 'Total Days', val: fmt(totalDays) },
    { label: 'Next Birthday', val: (() => { const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate()); if (next <= today) next.setFullYear(next.getFullYear() + 1); return Math.ceil((next - today) / (1000*60*60*24)) + ' days'; })() },
  ] };
}

function calcUnit(vals) {
  const value = +vals.value, type = vals.type;
  if (!value || !type) return null;
  const conversions = {
    'kg-lb': v => [{ label: 'Pounds (lb)', val: (v * 2.20462).toFixed(4) }, { label: 'Ounces (oz)', val: (v * 35.274).toFixed(2) }, { label: 'Grams', val: fmt(v * 1000) }, { label: 'Quintal', val: (v / 100).toFixed(4) }],
    'lb-kg': v => [{ label: 'Kilograms', val: (v * 0.453592).toFixed(4) }, { label: 'Grams', val: (v * 453.592).toFixed(2) }, { label: 'Ounces', val: (v * 16).toFixed(2) }],
    'km-mi': v => [{ label: 'Miles', val: (v * 0.621371).toFixed(4) }, { label: 'Meters', val: fmt(v * 1000) }, { label: 'Feet', val: fmt(v * 3280.84, 2) }],
    'mi-km': v => [{ label: 'Kilometers', val: (v * 1.60934).toFixed(4) }, { label: 'Meters', val: fmt(v * 1609.34, 2) }, { label: 'Feet', val: fmt(v * 5280) }],
    'c-f': v => [{ label: '°Fahrenheit', val: (v * 9/5 + 32).toFixed(2) }, { label: 'Kelvin', val: (v + 273.15).toFixed(2) }],
    'f-c': v => [{ label: '°Celsius', val: ((v - 32) * 5/9).toFixed(2) }, { label: 'Kelvin', val: ((v - 32) * 5/9 + 273.15).toFixed(2) }],
  };
  const fn = conversions[type];
  if (!fn) return null;
  const items = fn(value);
  return { main: items[0].val, label: items[0].label, items: items.slice(1) };
}

function calcInvoice(vals) {
  const qty = +vals.qty || 1, rate = +vals.rate, gstRate = +vals.gstRate || 18;
  if (!rate) return null;
  const subtotal = round2(qty * rate), gst = round2(subtotal * gstRate / 100);
  return { main: fmtR(subtotal + gst), label: 'Invoice Total', items: [
    { label: 'Subtotal', val: fmtR(subtotal) },
    { label: `GST (${gstRate}%)`, val: fmtR(gst) },
    { label: 'CGST', val: fmtR(gst / 2) },
    { label: 'SGST', val: fmtR(gst / 2) },
  ] };
}

function calcPPF(vals) {
  const annual = +vals.annual, rate = +vals.rate / 100 || 0.071, years = +vals.years || 15;
  if (!annual) return null;
  let total = 0;
  for (let i = 0; i < years; i++) { total = (total + annual) * (1 + rate); }
  total = round2(total);
  const invested = round2(annual * years);
  return { main: fmtR0(total), label: 'Maturity Amount', items: [
    { label: 'Total Invested', val: fmtR0(invested) },
    { label: 'Interest Earned', val: fmtR0(total - invested) },
    { label: '80C Savings/yr', val: fmtR0(Math.min(annual, 150000) * 0.312) },
  ] };
}

function calcPercentage(vals) {
  const mode = vals.mode || 'of';
  if (mode === 'of') {
    const pct = +vals.pct, num = +vals.num;
    if (!num) return null;
    return { main: fmt(round2(pct / 100 * num), 2), label: `${pct}% of ${fmt(num)}`, items: [] };
  } else if (mode === 'change') {
    const old = +vals.old, newVal = +vals.newVal;
    if (!old) return null;
    const change = round2(((newVal - old) / old) * 100);
    return { main: change.toFixed(2) + '%', label: change >= 0 ? 'Increase' : 'Decrease', items: [{ label: 'Difference', val: fmt(newVal - old, 2) }] };
  } else {
    const x = +vals.x, y = +vals.y;
    if (!y) return null;
    return { main: round2(x / y * 100).toFixed(2) + '%', label: `${x} is this % of ${y}`, items: [] };
  }
}

function calcBMI(vals) {
  const w = +vals.weight, h = +vals.height / 100;
  if (!w || !h) return null;
  const bmi = w / (h * h);
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 23 ? 'Normal (Asian)' : bmi < 27.5 ? 'Overweight (Asian)' : 'Obese (Asian)';
  const idealLow = (18.5 * h * h).toFixed(1), idealHigh = (22.9 * h * h).toFixed(1);
  return { main: bmi.toFixed(1), label: 'BMI — ' + cat, items: [
    { label: 'Category', val: cat },
    { label: 'Healthy Range', val: idealLow + ' – ' + idealHigh + ' kg' },
    { label: 'Height', val: (+vals.height) + ' cm' },
  ] };
}

function calcDiscount(vals) {
  const mrp = +vals.mrp, disc = +vals.discount, gstRate = +vals.gstRate || 0;
  if (!mrp) return null;
  const discAmt = round2(mrp * disc / 100), after = round2(mrp - discAmt);
  const gst = round2(after * gstRate / 100);
  return { main: fmtR(after + gst), label: 'Final Price', items: [
    { label: 'MRP', val: fmtR(mrp) },
    { label: 'You Save', val: fmtR(discAmt) + ' (' + disc + '%)' },
    { label: 'After Discount', val: fmtR(after) },
    ...(gstRate > 0 ? [{ label: `GST (${gstRate}%)`, val: fmtR(gst) }] : []),
  ] };
}

function calcGenericEMI(vals) {
  const P = +vals.principal, R = +vals.rate / 12 / 100, N = +vals.months;
  if (!P || !R || !N) return null;
  const emi = round2(P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1));

  // Amortization table
  const yearsCount = Math.ceil(N / 12);
  const headers = ['Year', 'Principal Paid', 'Interest Paid', 'Balance'];
  const rows = [];
  let balance = P;
  for (let yr = 1; yr <= yearsCount; yr++) {
    let yearPrincipal = 0, yearInterest = 0;
    const monthsInYear = Math.min(12, N - (yr - 1) * 12);
    for (let m = 0; m < monthsInYear; m++) {
      if (balance <= 0) break;
      const interestPart = round2(balance * R);
      const principalPart = round2(emi - interestPart);
      yearPrincipal += principalPart;
      yearInterest += interestPart;
      balance = round2(balance - principalPart);
    }
    if (balance < 0) balance = 0;
    rows.push([yr, fmtR0(yearPrincipal), fmtR0(yearInterest), fmtR0(balance)]);
  }

  return { main: fmtR0(emi), label: 'Monthly EMI', items: [
    { label: 'Loan Amount', val: fmtR0(P) },
    { label: 'Total Interest', val: fmtR0(round2(emi * N - P)) },
    { label: 'Total Payable', val: fmtR0(round2(emi * N)) },
  ], table: { title: 'Yearly Amortization Schedule', headers, rows } };
}

function calcSI(vals) {
  const P = +vals.principal, R = +vals.rate, T = +vals.time;
  if (!P || !R || !T) return null;
  const si = round2(P * R * T / 100);
  return { main: fmtR(si), label: 'Simple Interest', items: [
    { label: 'Principal', val: fmtR0(P) },
    { label: 'Total Amount', val: fmtR0(P + si) },
    { label: 'Duration', val: T + ' years' },
  ] };
}

function calcNPS(vals) {
  const monthly = +vals.monthly, years = +vals.years, ret = +vals.rate / 100, annuityRate = +vals.annuityRate / 100 || 0.06;
  if (!monthly || !years) return null;
  const r = ret / 12;
  const corpus = round2(monthly * ((Math.pow(1 + r, years * 12) - 1) / r) * (1 + r));
  const lumpsum = round2(corpus * 0.6), annuityAmt = round2(corpus * 0.4);
  const monthlyPension = round2(annuityAmt * annuityRate / 12);
  return { main: fmtR0(corpus), label: 'Total Corpus at 60', items: [
    { label: 'Lump Sum (60%)', val: fmtR0(lumpsum) },
    { label: 'Annuity (40%)', val: fmtR0(annuityAmt) },
    { label: 'Monthly Pension', val: fmtR0(monthlyPension) },
    { label: 'Tax Saving/yr', val: fmtR0(Math.min(monthly * 12, 50000) * 0.312) },
  ] };
}

function calcFuel(vals) {
  const dist = +vals.distance, mileage = +vals.mileage, price = +vals.price;
  if (!dist || !mileage || !price) return null;
  const fuel = round2(dist / mileage), cost = round2(fuel * price);
  return { main: fmtR(cost), label: 'Trip Fuel Cost', items: [
    { label: 'Fuel Needed', val: fuel.toFixed(2) + ' L' },
    { label: 'Cost per KM', val: '₹' + round2(price / mileage).toFixed(2) },
    { label: 'Distance', val: dist + ' km' },
  ] };
}

function calcCalorie(vals) {
  const w = +vals.weight, h = +vals.height, a = +vals.age, g = vals.gender || 'male', act = +vals.activity || 1.55;
  if (!w || !h || !a) return null;
  const bmr = g === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const tdee = round2(bmr * act);
  return { main: fmt(tdee), label: 'Daily Calories (TDEE)', items: [
    { label: 'BMR', val: fmt(Math.round(bmr)) + ' kcal' },
    { label: 'Weight Loss', val: fmt(Math.round(tdee - 500)) + ' kcal/day' },
    { label: 'Weight Gain', val: fmt(Math.round(tdee + 300)) + ' kcal/day' },
  ] };
}

function calcSpeed(vals) {
  const mode = vals.mode || 'speed';
  if (mode === 'speed') {
    const d = +vals.distance, t = +vals.time;
    if (!d || !t) return null;
    return { main: (d / t).toFixed(2) + ' km/h', label: 'Speed', items: [{ label: 'm/s', val: ((d * 1000) / (t * 3600)).toFixed(2) }] };
  } else if (mode === 'distance') {
    const s = +vals.speed, t = +vals.time;
    if (!s || !t) return null;
    return { main: (s * t).toFixed(2) + ' km', label: 'Distance', items: [] };
  } else {
    const d = +vals.distance, s = +vals.speed;
    if (!d || !s) return null;
    return { main: (d / s).toFixed(2) + ' hours', label: 'Time', items: [{ label: 'Minutes', val: ((d / s) * 60).toFixed(1) }] };
  }
}

function calcNumBase(vals) {
  const input = (vals.input || '').trim(), base = +vals.base || 10;
  if (!input) return null;
  try {
    // Use BigInt for arbitrary-precision integer conversion
    let dec;
    if (base === 16) dec = BigInt('0x' + input);
    else if (base === 8) dec = BigInt('0o' + input);
    else if (base === 2) dec = BigInt('0b' + input);
    else dec = BigInt(input);
    return { main: dec.toString(10), label: 'Decimal', items: [
      { label: 'Binary', val: dec.toString(2) },
      { label: 'Octal', val: dec.toString(8) },
      { label: 'Hexadecimal', val: dec.toString(16).toUpperCase() },
    ] };
  } catch {
    return { main: 'Invalid input', label: 'Error', items: [] };
  }
}

function calcData(vals) {
  const value = +vals.value, unit = vals.unit || 'MB';
  if (!value) return null;
  const toBytes = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4, Mb: 125000, Gb: 125000000 };
  const bytes = value * (toBytes[unit] || 1);
  // Avoid scientific notation: use toFixed for large numbers, then strip trailing zeros
  const fmtNoSci = (n, dp) => n < 1e15 ? n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp, useGrouping: true }) : BigInt(Math.round(n)).toLocaleString('en-IN');
  return { main: (bytes / toBytes.GB).toFixed(4) + ' GB', label: 'Equivalent', items: [
    { label: 'Bytes', val: fmtNoSci(bytes, 0) },
    { label: 'KB', val: fmtNoSci(bytes / 1024, 2) },
    { label: 'MB', val: fmtNoSci(bytes / 1024**2, 4) },
    { label: 'TB', val: fmtNoSci(bytes / 1024**4, 6) },
  ] };
}

function calcRD(vals) {
  const R = +vals.monthly, n = +vals.months, rate = +vals.rate / 400;
  if (!R || !n) return null;
  let total = 0;
  for (let i = 0; i < n; i++) { total += R * Math.pow(1 + rate, ((n - i) * 4 / 12)); }
  total = round2(total);
  return { main: fmtR0(total), label: 'Maturity Amount', items: [
    { label: 'Total Deposited', val: fmtR0(R * n) },
    { label: 'Interest Earned', val: fmtR0(total - R * n) },
  ] };
}

function calcHRA(vals) {
  const basic = +vals.basic, hra = +vals.hra, rent = +vals.rent, metro = vals.metro === 'yes';
  if (!basic || !hra || !rent) return null;
  const a = hra, b = round2(basic * (metro ? 0.5 : 0.4)), c = round2(Math.max(rent - basic * 0.1, 0));
  const exempt = Math.min(a, b, c);
  return { main: fmtR0(exempt), label: 'Exempt HRA (Annual)', items: [
    { label: 'Actual HRA', val: fmtR0(a) },
    { label: metro ? '50% of Basic' : '40% of Basic', val: fmtR0(b) },
    { label: 'Rent − 10% Basic', val: fmtR0(c) },
    { label: 'Taxable HRA', val: fmtR0(hra - exempt) },
  ] };
}

function calcGratuity(vals) {
  const basic = +vals.basic, years = +vals.years;
  if (!basic || !years) return null;
  const gratuity = round2(basic * 15 * Math.floor(years) / 26);
  const exempt = Math.min(gratuity, 2000000);
  return { main: fmtR0(gratuity), label: 'Gratuity Amount', items: [
    { label: 'Years (rounded)', val: Math.floor(years) },
    { label: 'Tax-Free Limit', val: fmtR0(2000000) },
    { label: 'Taxable Amt', val: fmtR0(Math.max(gratuity - exempt, 0)) },
  ] };
}

function calcInflation(vals) {
  const amount = +vals.amount, rate = +vals.rate, years = +vals.years;
  if (!amount || !rate || !years) return null;
  const future = round2(amount * Math.pow(1 + rate / 100, years));
  const realValue = round2(amount / Math.pow(1 + rate / 100, years));
  return { main: fmtR0(future), label: 'You\'ll Need This Much', items: [
    { label: 'Today\'s Value', val: fmtR0(amount) },
    { label: 'Purchasing Power (future)', val: fmtR0(realValue) },
    { label: 'Inflation Loss', val: fmtR0(amount - realValue) },
  ] };
}

function calcCompound(vals) {
  const P = +vals.principal, r = +vals.rate / 100, t = +vals.time, n = +vals.compound || 4;
  if (!P || !r || !t) return null;
  const A = round2(P * Math.pow(1 + r / n, n * t));
  const si = round2(P * r * t);
  return { main: fmtR(A), label: 'Maturity (CI)', items: [
    { label: 'CI', val: fmtR(A - P) },
    { label: 'SI (comparison)', val: fmtR(si) },
    { label: 'CI − SI Diff', val: fmtR(A - P - si) },
    { label: 'Effective Rate', val: (round2((Math.pow(1 + r / n, n) - 1) * 100)).toFixed(2) + '%' },
  ] };
}

function calcGPA(vals) {
  const marks = vals.marks || '';
  const credits = vals.credits || '';
  if (!marks || !credits) return null;
  const m = marks.split(',').map(Number), c = credits.split(',').map(Number);
  if (m.length !== c.length) return { main: 'Error', label: 'Mismatch: marks and credits count differ', items: [] };
  let totalCr = 0, totalPts = 0;
  for (let i = 0; i < m.length; i++) {
    const gp = m[i] >= 90 ? 10 : m[i] >= 80 ? 9 : m[i] >= 70 ? 8 : m[i] >= 60 ? 7 : m[i] >= 50 ? 6 : m[i] >= 45 ? 5 : m[i] >= 40 ? 4 : 0;
    totalPts += gp * c[i]; totalCr += c[i];
  }
  const gpa = totalPts / totalCr;
  return { main: gpa.toFixed(2), label: 'Semester GPA', items: [
    { label: 'Total Credits', val: totalCr },
    { label: 'Percentage (×9.5)', val: (gpa * 9.5).toFixed(2) + '%' },
  ] };
}

function calcSGPA(vals) {
  const sgpas = vals.sgpas || '';
  if (!sgpas) return null;
  const arr = sgpas.split(',').map(Number).filter(n => !isNaN(n));
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return { main: avg.toFixed(2), label: 'CGPA', items: [
    { label: 'Semesters', val: arr.length },
    { label: 'Percentage', val: (avg * 9.5).toFixed(2) + '%' },
    { label: 'Class', val: avg * 9.5 >= 60 ? 'First' : avg * 9.5 >= 50 ? 'Second' : 'Third' },
  ] };
}

function calcRatio(vals) {
  const total = +vals.total, a = +vals.a, b = +vals.b;
  if (!total || !a) return null;
  const sum = a + (b || 0);
  return { main: fmt(round2(total * a / sum), 2), label: 'First Part', items: [
    { label: 'Second Part', val: fmt(round2(total * (b || 0) / sum), 2) },
    { label: 'Ratio', val: a + ':' + (b || 0) },
    { label: 'Total Parts', val: sum },
  ] };
}

function calcRoman(vals) {
  const input = vals.input || '';
  if (!input) return null;
  if (/^\d+$/.test(input)) {
    let num = +input;
    if (num < 1 || num > 3999) return { main: 'Out of range', label: '1-3999 only', items: [] };
    const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let roman = '';
    for (const [val, sym] of map) { while (num >= val) { roman += sym; num -= val; } }
    return { main: roman, label: 'Roman Numeral', items: [] };
  } else {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    const str = input.toUpperCase();
    for (let i = 0; i < str.length; i++) {
      const cur = map[str[i]], next = map[str[i + 1]];
      if (next && cur < next) total -= cur; else total += cur;
    }
    return { main: total.toString(), label: 'Arabic Number', items: [] };
  }
}

function calcBillSplit(vals) {
  const total = +vals.total, tip = +vals.tip || 0, people = +vals.people || 1;
  if (!total) return null;
  const tipAmt = round2(total * tip / 100), grand = round2(total + tipAmt);
  return { main: fmtR(grand / people), label: 'Per Person', items: [
    { label: 'Bill Total', val: fmtR(total) },
    { label: 'Tip (' + tip + '%)', val: fmtR(tipAmt) },
    { label: 'Grand Total', val: fmtR(grand) },
  ] };
}

function calcTip(vals) {
  const bill = +vals.bill, tipPct = +vals.tip || 10, people = +vals.people || 1;
  if (!bill) return null;
  const tipAmt = round2(bill * tipPct / 100);
  return { main: fmtR(tipAmt), label: 'Tip Amount', items: [
    { label: 'Per Person Tip', val: fmtR(tipAmt / people) },
    { label: 'Total with Tip', val: fmtR(bill + tipAmt) },
    { label: 'Per Person Total', val: fmtR((bill + tipAmt) / people) },
  ] };
}

function calcSleep(vals) {
  const mode = vals.mode || 'bed';
  if (mode === 'bed') {
    const bed = vals.bedtime;
    if (!bed) return null;
    const [h, m] = bed.split(':').map(Number);
    const times = [];
    for (let i = 4; i <= 6; i++) {
      const total = (h * 60 + m + 15 + i * 90) % 1440;
      times.push({ cycles: i, time: `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}` });
    }
    return { main: times[1].time, label: 'Best Wake-Up (5 cycles)', items: times.map(t => ({ label: t.cycles + ' cycles', val: t.time })) };
  } else {
    const wake = vals.waketime;
    if (!wake) return null;
    const [h, m] = wake.split(':').map(Number);
    const times = [];
    for (let i = 4; i <= 6; i++) {
      const total = ((h * 60 + m - 15 - i * 90) % 1440 + 1440) % 1440;
      times.push({ cycles: i, time: `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}` });
    }
    return { main: times[1].time, label: 'Best Bedtime (5 cycles)', items: times.map(t => ({ label: t.cycles + ' cycles', val: t.time })) };
  }
}

function calcWater(vals) {
  const w = +vals.weight, exercise = +vals.exercise || 0;
  if (!w) return null;
  const base = w * 35, extra = (exercise / 30) * 500;
  const total = base + extra;
  return { main: (total / 1000).toFixed(2) + ' L', label: 'Daily Water Intake', items: [
    { label: 'Base (ml)', val: fmt(base) },
    { label: 'Exercise Bonus', val: fmt(extra) + ' ml' },
    { label: 'Glasses (250ml)', val: Math.ceil(total / 250) },
  ] };
}

function calcElectricity(vals) {
  const units = +vals.units, rate = +vals.rate, fixed = +vals.fixed || 0, duty = +vals.duty || 0;
  if (!units || !rate) return null;
  const energy = round2(units * rate), dutyAmt = round2(energy * duty / 100);
  return { main: fmtR(energy + fixed + dutyAmt), label: 'Monthly Bill (est.)', items: [
    { label: 'Energy Charge', val: fmtR(energy) },
    { label: 'Fixed Charge', val: fmtR(fixed) },
    { label: 'Duty (' + duty + '%)', val: fmtR(dutyAmt) },
    { label: 'Units', val: units + ' kWh' },
  ] };
}

function calcPregnancy(vals) {
  const lmp = new Date(vals.lmp);
  if (isNaN(lmp)) return null;
  const edd = new Date(lmp.getTime() + 280 * 86400000);
  const today = new Date();
  const weeks = Math.floor((today - lmp) / (7 * 86400000));
  const tri = weeks <= 13 ? '1st' : weeks <= 26 ? '2nd' : '3rd';
  return { main: edd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), label: 'Estimated Due Date', items: [
    { label: 'Current Week', val: 'Week ' + weeks },
    { label: 'Trimester', val: tri },
    { label: 'Days Remaining', val: Math.max(Math.ceil((edd - today) / 86400000), 0) + ' days' },
  ] };
}

function calcNumWords(vals) {
  const num = +vals.number;
  if (isNaN(num) || num < 0) return null;
  if (num === 0) return { main: 'Zero', label: 'In Words', items: [] };
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function twoDigit(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
  }
  function threeDigit(n) {
    if (n >= 100) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + twoDigit(n%100) : '');
    return twoDigit(n);
  }
  let n = Math.floor(num), result = '';
  if (n >= 10000000) { result += threeDigit(Math.floor(n/10000000)) + ' Crore '; n %= 10000000; }
  if (n >= 100000) { result += twoDigit(Math.floor(n/100000)) + ' Lakh '; n %= 100000; }
  if (n >= 1000) { result += twoDigit(Math.floor(n/1000)) + ' Thousand '; n %= 1000; }
  if (n > 0) result += threeDigit(n);
  return { main: result.trim(), label: 'Indian English', items: [] };
}

function calcArea(vals) {
  const shape = vals.shape || 'rect';
  let area = 0;
  if (shape === 'rect') { area = +vals.length * +vals.width; }
  else if (shape === 'circle') { area = Math.PI * Math.pow(+vals.radius, 2); }
  else if (shape === 'triangle') { area = 0.5 * +vals.base * +vals.height; }
  else if (shape === 'trapezoid') { area = 0.5 * (+vals.a + +vals.b) * +vals.height; }
  if (!area) return null;
  return { main: fmt(round2(area), 2) + ' sq ft', label: 'Area', items: [
    { label: 'Sq Meters', val: (area / 10.764).toFixed(2) },
    { label: 'Sq Yards (Gaj)', val: (area / 9).toFixed(2) },
    { label: 'Cents', val: (area / 435.6).toFixed(4) },
    { label: 'Acres', val: (area / 43560).toFixed(6) },
  ] };
}

// ---- Form Definitions ----

const CALC_FORMS = {
  sip: { fn: calcSIP, fields: [
    { key: 'monthly', label: 'Monthly SIP Amount', prefix: '₹', placeholder: '5000' },
    { key: 'rate', label: 'Expected Return (%)', placeholder: '12' },
    { key: 'years', label: 'Duration (Years)', placeholder: '10' },
    { key: 'enableStepUp', label: 'Enable Step-Up SIP?', type: 'select', options: [{ v: 'no', l: 'No' }, { v: 'yes', l: 'Yes' }] },
    { key: 'stepUp', label: 'Annual Step-Up (%)', placeholder: '10', showIf: { enableStepUp: 'yes' } },
  ] },
  gst: { fn: calcGST, fields: [
    { key: 'amount', label: 'Amount (₹)', prefix: '₹', placeholder: '10000' },
    { key: 'rate', label: 'GST Rate (%)', type: 'select', options: [{ v: '5', l: '5%' }, { v: '12', l: '12%' }, { v: '18', l: '18%' }, { v: '28', l: '28%' }] },
    { key: 'mode', label: 'Mode', type: 'select', options: [{ v: 'add', l: 'Add GST' }, { v: 'remove', l: 'Remove GST' }] },
  ] },
  emi: { fn: calcEMI, fields: [
    { key: 'principal', label: 'Loan Amount (₹)', prefix: '₹', placeholder: '5000000' },
    { key: 'rate', label: 'Interest Rate (% p.a.)', placeholder: '8.5' },
    { key: 'years', label: 'Tenure (Years)', placeholder: '20' },
  ] },
  salary: { fn: calcSalary, fields: [
    { key: 'ctc', label: 'Annual CTC (₹)', prefix: '₹', placeholder: '1200000' },
  ] },
  fd: { fn: calcFD, fields: [
    { key: 'principal', label: 'Principal (₹)', prefix: '₹', placeholder: '100000' },
    { key: 'rate', label: 'Interest Rate (% p.a.)', placeholder: '7' },
    { key: 'years', label: 'Tenure (Years)', placeholder: '5' },
    { key: 'compound', label: 'Compounding', type: 'select', options: [{ v: '4', l: 'Quarterly' }, { v: '12', l: 'Monthly' }, { v: '1', l: 'Annually' }] },
  ] },
  lumpsum: { fn: calcLumpsum, fields: [
    { key: 'principal', label: 'Investment Amount (₹)', prefix: '₹', placeholder: '100000' },
    { key: 'rate', label: 'Expected Return (% p.a.)', placeholder: '12' },
    { key: 'years', label: 'Duration (Years)', placeholder: '10' },
  ] },
  fire: { fn: calcFIRE, fields: [
    { key: 'expense', label: 'Monthly Expenses (₹)', prefix: '₹', placeholder: '50000' },
    { key: 'inflation', label: 'Expected Inflation (%)', placeholder: '6' },
    { key: 'savings', label: 'Current Savings (₹)', prefix: '₹', placeholder: '500000' },
    { key: 'sip', label: 'Monthly SIP (₹)', prefix: '₹', placeholder: '30000' },
    { key: 'rate', label: 'Expected Return (%)', placeholder: '12' },
  ] },
  stamp: { fn: calcStamp, fields: [
    { key: 'price', label: 'Property Value (₹)', prefix: '₹', placeholder: '5000000' },
    { key: 'stampRate', label: 'Stamp Duty Rate (%)', placeholder: '6' },
    { key: 'regRate', label: 'Registration Rate (%)', placeholder: '1' },
  ] },
  construction: { fn: calcConstruction, fields: [
    { key: 'area', label: 'Built-up Area (sq ft)', placeholder: '1500' },
    { key: 'rate', label: 'Rate (₹/sq ft)', prefix: '₹', placeholder: '2000' },
  ] },
  bigha: { fn: calcBigha, fields: [
    { key: 'value', label: 'Value', placeholder: '1' },
    { key: 'from', label: 'Unit', type: 'select', options: [
      { v: 'bighaUP', l: 'Bigha (UP)' }, { v: 'bighaBihar', l: 'Bigha (Bihar)' }, { v: 'bighaWB', l: 'Bigha (West Bengal)' },
      { v: 'bighaRaj', l: 'Bigha (Rajasthan)' }, { v: 'bighaMP', l: 'Bigha (MP)' },
      { v: 'bighaHaryana', l: 'Bigha (Haryana)' }, { v: 'bighaPunjab', l: 'Bigha (Punjab)' },
      { v: 'acre', l: 'Acre' }, { v: 'hectare', l: 'Hectare' },
      { v: 'gaj', l: 'Gaj (Sq Yd)' }, { v: 'sqm', l: 'Sq Meter' },
    ] },
  ] },
  rentvsbuy: { fn: calcRentVsBuy, fields: [
    { key: 'price', label: 'Property Price (₹)', prefix: '₹', placeholder: '8000000' },
    { key: 'down', label: 'Down Payment (₹)', prefix: '₹', placeholder: '1600000' },
    { key: 'rate', label: 'Loan Rate (% p.a.)', placeholder: '8.5' },
    { key: 'rent', label: 'Monthly Rent (₹)', prefix: '₹', placeholder: '20000' },
    { key: 'years', label: 'Comparison Period (Years)', placeholder: '20' },
    { key: 'appreciation', label: 'Property Appreciation (% p.a.)', placeholder: '5' },
  ] },
  cgpa: { fn: calcCGPA, fields: [
    { key: 'cgpa', label: 'Enter CGPA (out of 10)', placeholder: '8.5' },
  ] },
  attendance: { fn: calcAttendance, fields: [
    { key: 'total', label: 'Total Classes Held', placeholder: '120' },
    { key: 'attended', label: 'Classes Attended', placeholder: '90' },
    { key: 'required', label: 'Required % (default 75)', placeholder: '75' },
  ] },
  age: { fn: calcAge, fields: [
    { key: 'dob', label: 'Date of Birth', type: 'date' },
  ] },
  unit: { fn: calcUnit, fields: [
    { key: 'value', label: 'Value', placeholder: '1' },
    { key: 'type', label: 'Conversion', type: 'select', options: [
      { v: 'kg-lb', l: 'KG → Pounds' }, { v: 'lb-kg', l: 'Pounds → KG' },
      { v: 'km-mi', l: 'KM → Miles' }, { v: 'mi-km', l: 'Miles → KM' },
      { v: 'c-f', l: '°C → °F' }, { v: 'f-c', l: '°F → °C' },
    ] },
  ] },
  invoice: { fn: calcInvoice, fields: [
    { key: 'qty', label: 'Quantity', placeholder: '1' },
    { key: 'rate', label: 'Unit Price (₹)', prefix: '₹', placeholder: '5000' },
    { key: 'gstRate', label: 'GST Rate (%)', type: 'select', options: [{ v: '5', l: '5%' }, { v: '12', l: '12%' }, { v: '18', l: '18%' }, { v: '28', l: '28%' }] },
  ] },
  ppf: { fn: calcPPF, fields: [
    { key: 'annual', label: 'Annual Investment (₹)', prefix: '₹', placeholder: '150000' },
    { key: 'rate', label: 'PPF Rate (% p.a.)', placeholder: '7.1' },
    { key: 'years', label: 'Tenure (Years)', placeholder: '15' },
  ] },
  tax: { fn: calcTax, fields: [
    { key: 'income', label: 'Annual Gross Income (₹)', prefix: '₹', placeholder: '1200000' },
    { key: 'ded80c', label: '80C Deductions (₹) — Old Regime', prefix: '₹', placeholder: '150000' },
    { key: 'ded80d', label: '80D Medical Insurance (₹)', prefix: '₹', placeholder: '25000' },
    { key: 'hraExempt', label: 'HRA Exemption (₹)', prefix: '₹', placeholder: '0' },
    { key: 'homeLoan', label: 'Home Loan Interest 24(b) (₹)', prefix: '₹', placeholder: '0' },
  ] },
  percentage: { fn: calcPercentage, fields: [
    { key: 'mode', label: 'Mode', type: 'select', options: [{ v: 'of', l: 'X% of Y' }, { v: 'change', l: '% Change' }, { v: 'whatpct', l: 'X is what % of Y' }] },
    { key: 'pct', label: 'Percentage', placeholder: '18', showIf: { mode: 'of' } },
    { key: 'num', label: 'Number', placeholder: '50000', showIf: { mode: 'of' } },
    { key: 'old', label: 'Old Value', placeholder: '50000', showIf: { mode: 'change' } },
    { key: 'newVal', label: 'New Value', placeholder: '60000', showIf: { mode: 'change' } },
    { key: 'x', label: 'X', placeholder: '400', showIf: { mode: 'whatpct' } },
    { key: 'y', label: 'Y', placeholder: '2000', showIf: { mode: 'whatpct' } },
  ] },
  bmi: { fn: calcBMI, fields: [
    { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
    { key: 'height', label: 'Height (cm)', placeholder: '170' },
  ] },
  discount: { fn: calcDiscount, fields: [
    { key: 'mrp', label: 'MRP (₹)', prefix: '₹', placeholder: '2999' },
    { key: 'discount', label: 'Discount (%)', placeholder: '40' },
    { key: 'gstRate', label: 'GST (optional %)', placeholder: '0' },
  ] },
  rd: { fn: calcRD, fields: [
    { key: 'monthly', label: 'Monthly Deposit (₹)', prefix: '₹', placeholder: '5000' },
    { key: 'rate', label: 'Interest Rate (% p.a.)', placeholder: '7' },
    { key: 'months', label: 'Tenure (Months)', placeholder: '60' },
  ] },
  carloan: { fn: calcGenericEMI, fields: [
    { key: 'principal', label: 'Loan Amount (₹)', prefix: '₹', placeholder: '800000' },
    { key: 'rate', label: 'Interest Rate (% p.a.)', placeholder: '9' },
    { key: 'months', label: 'Tenure (Months)', placeholder: '60' },
  ] },
  personalloan: { fn: calcGenericEMI, fields: [
    { key: 'principal', label: 'Loan Amount (₹)', prefix: '₹', placeholder: '500000' },
    { key: 'rate', label: 'Interest Rate (% p.a.)', placeholder: '14' },
    { key: 'months', label: 'Tenure (Months)', placeholder: '36' },
  ] },
  gold: { fn: calcGold, fields: [
    { key: 'metalType', label: 'Metal Type', type: 'select', options: [
      { v: 'XAU', l: 'Gold (XAU)' },
      { v: 'XAG', l: 'Silver (XAG)' },
    ] },
    { key: 'purity', label: 'Purity (Gold)', type: 'select', options: [
      { v: '100', l: '24K (100%)' },
      { v: '91.67', l: '22K (91.67%)' },
      { v: '75', l: '18K (75%)' },
    ] },
    { key: 'weight', label: 'Weight (grams)', placeholder: '10' },
    { key: 'rate', label: 'Rate (₹/gram) — auto-filled', prefix: '₹', placeholder: 'Live API' },
    { key: 'making', label: 'Making Charge (%)', placeholder: '12' },
  ] },
  si: { fn: calcSI, fields: [
    { key: 'principal', label: 'Principal (₹)', prefix: '₹', placeholder: '100000' },
    { key: 'rate', label: 'Rate (% p.a.)', placeholder: '10' },
    { key: 'time', label: 'Time (Years)', placeholder: '3' },
  ] },
  nps: { fn: calcNPS, fields: [
    { key: 'monthly', label: 'Monthly Contribution (₹)', prefix: '₹', placeholder: '5000' },
    { key: 'years', label: 'Years to Retirement', placeholder: '30' },
    { key: 'rate', label: 'Expected Return (%)', placeholder: '10' },
    { key: 'annuityRate', label: 'Annuity Rate (%)', placeholder: '6' },
  ] },
  fuel: { fn: calcFuel, fields: [
    { key: 'distance', label: 'Distance (km)', placeholder: '500' },
    { key: 'mileage', label: 'Mileage (km/L)', placeholder: '15' },
    { key: 'price', label: 'Fuel Price (₹/L)', prefix: '₹', placeholder: '105' },
  ] },
  calorie: { fn: calcCalorie, fields: [
    { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
    { key: 'height', label: 'Height (cm)', placeholder: '170' },
    { key: 'age', label: 'Age', placeholder: '30' },
    { key: 'gender', label: 'Gender', type: 'select', options: [{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }] },
    { key: 'activity', label: 'Activity Level', type: 'select', options: [{ v: '1.2', l: 'Sedentary' }, { v: '1.375', l: 'Light' }, { v: '1.55', l: 'Moderate' }, { v: '1.725', l: 'Active' }, { v: '1.9', l: 'Very Active' }] },
  ] },
  speed: { fn: calcSpeed, fields: [
    { key: 'mode', label: 'Find', type: 'select', options: [{ v: 'speed', l: 'Speed' }, { v: 'distance', l: 'Distance' }, { v: 'time', l: 'Time' }] },
    { key: 'distance', label: 'Distance (km)', placeholder: '100' },
    { key: 'time', label: 'Time (hours)', placeholder: '2' },
    { key: 'speed', label: 'Speed (km/h)', placeholder: '60' },
  ] },
  numbase: { fn: calcNumBase, fields: [
    { key: 'input', label: 'Enter Number', placeholder: '255' },
    { key: 'base', label: 'Input Base', type: 'select', options: [{ v: '10', l: 'Decimal (10)' }, { v: '2', l: 'Binary (2)' }, { v: '8', l: 'Octal (8)' }, { v: '16', l: 'Hex (16)' }] },
  ] },
  data: { fn: calcData, fields: [
    { key: 'value', label: 'Value', placeholder: '1' },
    { key: 'unit', label: 'Unit', type: 'select', options: [{ v: 'B', l: 'Bytes' }, { v: 'KB', l: 'KB' }, { v: 'MB', l: 'MB' }, { v: 'GB', l: 'GB' }, { v: 'TB', l: 'TB' }, { v: 'Mb', l: 'Megabits' }] },
  ] },
  hra: { fn: calcHRA, fields: [
    { key: 'basic', label: 'Annual Basic Salary (₹)', prefix: '₹', placeholder: '600000' },
    { key: 'hra', label: 'Annual HRA Received (₹)', prefix: '₹', placeholder: '300000' },
    { key: 'rent', label: 'Annual Rent Paid (₹)', prefix: '₹', placeholder: '240000' },
    { key: 'metro', label: 'Metro City?', type: 'select', options: [{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }] },
  ] },
  gratuity: { fn: calcGratuity, fields: [
    { key: 'basic', label: 'Last Drawn Basic + DA (₹)', prefix: '₹', placeholder: '50000' },
    { key: 'years', label: 'Years of Service', placeholder: '10' },
  ] },
  cagr: { fn: calcCAGR, fields: [
    { key: 'begin', label: 'Beginning Value (₹)', prefix: '₹', placeholder: '100000' },
    { key: 'end', label: 'Ending Value (₹)', prefix: '₹', placeholder: '250000' },
    { key: 'years', label: 'Number of Years', placeholder: '5' },
  ] },
  inflation: { fn: calcInflation, fields: [
    { key: 'amount', label: 'Today\'s Amount (₹)', prefix: '₹', placeholder: '100000' },
    { key: 'rate', label: 'Inflation Rate (%)', placeholder: '6' },
    { key: 'years', label: 'Years', placeholder: '10' },
  ] },
  compound: { fn: calcCompound, fields: [
    { key: 'principal', label: 'Principal (₹)', prefix: '₹', placeholder: '100000' },
    { key: 'rate', label: 'Rate (% p.a.)', placeholder: '10' },
    { key: 'time', label: 'Time (Years)', placeholder: '5' },
    { key: 'compound', label: 'Compounding', type: 'select', options: [{ v: '1', l: 'Annually' }, { v: '4', l: 'Quarterly' }, { v: '12', l: 'Monthly' }, { v: '365', l: 'Daily' }] },
  ] },
  gpa: { fn: calcGPA, fields: [
    { key: 'marks', label: 'Marks (comma-separated)', placeholder: '85,72,90,68' },
    { key: 'credits', label: 'Credits (comma-separated)', placeholder: '4,3,4,3' },
  ] },
  sgpa: { fn: calcSGPA, fields: [
    { key: 'sgpas', label: 'SGPAs (comma-separated)', placeholder: '8.2,7.8,8.5,9.0' },
  ] },
  ratio: { fn: calcRatio, fields: [
    { key: 'total', label: 'Total Amount', placeholder: '1200' },
    { key: 'a', label: 'First Part Ratio', placeholder: '3' },
    { key: 'b', label: 'Second Part Ratio', placeholder: '1' },
  ] },
  roman: { fn: calcRoman, fields: [
    { key: 'input', label: 'Enter Number or Roman Numeral', placeholder: '2026 or MMXXVI' },
  ] },
  billsplit: { fn: calcBillSplit, fields: [
    { key: 'total', label: 'Total Bill (₹)', prefix: '₹', placeholder: '3500' },
    { key: 'tip', label: 'Tip (%)', placeholder: '10' },
    { key: 'people', label: 'Number of People', placeholder: '4' },
  ] },
  tip: { fn: calcTip, fields: [
    { key: 'bill', label: 'Bill Amount (₹)', prefix: '₹', placeholder: '1500' },
    { key: 'tip', label: 'Tip (%)', placeholder: '10' },
    { key: 'people', label: 'People', placeholder: '1' },
  ] },
  sleep: { fn: calcSleep, fields: [
    { key: 'mode', label: 'Mode', type: 'select', options: [{ v: 'bed', l: 'I want to sleep at...' }, { v: 'wake', l: 'I need to wake at...' }] },
    { key: 'bedtime', label: 'Bedtime', type: 'time', showIf: { mode: 'bed' } },
    { key: 'waketime', label: 'Wake Time', type: 'time', showIf: { mode: 'wake' } },
  ] },
  water: { fn: calcWater, fields: [
    { key: 'weight', label: 'Body Weight (kg)', placeholder: '70' },
    { key: 'exercise', label: 'Daily Exercise (mins)', placeholder: '30' },
  ] },
  electricity: { fn: calcElectricity, fields: [
    { key: 'units', label: 'Monthly Units (kWh)', placeholder: '300' },
    { key: 'rate', label: 'Rate (₹/unit)', prefix: '₹', placeholder: '6' },
    { key: 'fixed', label: 'Fixed Charge (₹)', prefix: '₹', placeholder: '100' },
    { key: 'duty', label: 'Electricity Duty (%)', placeholder: '5' },
  ] },
  pregnancy: { fn: calcPregnancy, fields: [
    { key: 'lmp', label: 'First Day of Last Period', type: 'date' },
  ] },
  currency: { fn: calcCurrency, fields: [
    { key: 'amount', label: 'Amount', placeholder: '1000' },
    { key: 'from', label: 'From (150+ Currencies)', type: 'select', options: [{ v: 'INR', l: '🇮🇳 INR (₹)' }, { v: 'USD', l: '🇺🇸 USD ($)' }, { v: 'EUR', l: '🇪🇺 EUR (€)' }] },
    { key: 'to', label: 'To', type: 'select', options: [{ v: 'USD', l: '🇺🇸 USD ($)' }, { v: 'INR', l: '🇮🇳 INR (₹)' }, { v: 'EUR', l: '🇪🇺 EUR (€)' }] },
  ] },
  crypto: { fn: calcCrypto, fields: [
    { key: 'amount', label: 'Amount', placeholder: '1' },
    { key: 'token', label: 'Crypto Token', type: 'select', options: [{ v: 'BTC', l: '₿ Bitcoin (BTC)' }, { v: 'ETH', l: 'Ξ Ethereum (ETH)' }, { v: 'DOGE', l: 'Ð Dogecoin (DOGE)' }, { v: 'USDC', l: '💵 USD Coin (USDC)' }] },
    { key: 'currency', label: 'Target Fiat', type: 'select', options: [{ v: 'INR', l: '🇮🇳 INR (₹)' }, { v: 'USD', l: '🇺🇸 USD ($)' }, { v: 'EUR', l: '🇪🇺 EUR (€)' }, { v: 'GBP', l: '🇬🇧 GBP (£)' }] },
  ] },
  numwords: { fn: calcNumWords, fields: [
    { key: 'number', label: 'Enter Number', placeholder: '12345678' },
  ] },
  area: { fn: calcArea, fields: [
    { key: 'shape', label: 'Shape', type: 'select', options: [{ v: 'rect', l: 'Rectangle' }, { v: 'circle', l: 'Circle' }, { v: 'triangle', l: 'Triangle' }, { v: 'trapezoid', l: 'Trapezoid' }] },
    { key: 'length', label: 'Length (ft)', placeholder: '20', showIf: { shape: 'rect' } },
    { key: 'width', label: 'Width (ft)', placeholder: '15', showIf: { shape: 'rect' } },
    { key: 'radius', label: 'Radius (ft)', placeholder: '10', showIf: { shape: 'circle' } },
    { key: 'base', label: 'Base (ft)', placeholder: '15', showIf: { shape: 'triangle' } },
    { key: 'height', label: 'Height (ft)', placeholder: '10', showIf: { shape: 'triangle' } },
    { key: 'a', label: 'Side A (ft)', placeholder: '10', showIf: { shape: 'trapezoid' } },
    { key: 'b', label: 'Side B (ft)', placeholder: '20', showIf: { shape: 'trapezoid' } },
    // height for trapezoid reused from triangle showIf
  ] },
};

// ---- Main Component ----
export default function CalculatorEngine({ tool }) {
  const config = CALC_FORMS[tool.id];
  const [vals, setVals] = useState(() => {
    const init = {};
    if (config) {
      config.fields.forEach(f => {
        if (f.type === 'select' && f.options?.length) init[f.key] = f.options[0].v;
        else init[f.key] = '';
      });
    }
    return init;
  });
  const [result, setResult] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [ratesData, setRatesData] = useState(null);

  useEffect(() => {
    import('../lib/dataFetcher').then(mod => {
      mod.fetchRates().then(data => setRatesData(data));
    });
  }, []);

  const calculate = useCallback(() => {
    if (!config) return;
    const r = config.fn(vals, ratesData);
    setResult(r);
    setShowTable(false);
  }, [config, vals, ratesData]);

  const reset = () => {
    const init = {};
    if (config) config.fields.forEach(f => {
      if (f.type === 'select' && f.options?.length) init[f.key] = f.options[0].v;
      else init[f.key] = '';
    });
    setVals(init);
    setResult(null);
    setShowTable(false);
  };

  if (!config) {
    return (
      <div className="calculator-box">
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>
          Calculator coming soon.
        </p>
      </div>
    );
  }

  const visibleFields = config.fields.filter(f => {
    if (!f.showIf) return true;
    return Object.entries(f.showIf).every(([k, v]) => vals[k] === v);
  });

  const allCurrencies = ratesData ? Object.keys(ratesData).sort() : [];
  const fiatList = typeof Intl !== 'undefined' && Intl.supportedValuesOf ? Intl.supportedValuesOf('currency') : [];

  const renderOptions = (toolId, key, options) => {
    if (!ratesData) return options.map(o => <option key={o.v} value={o.v}>{o.l}</option>);
    
    if (toolId === 'currency' && (key === 'from' || key === 'to')) {
      return allCurrencies.filter(cur => fiatList.includes(cur) || cur === 'USD' || cur === 'EUR')
                          .map(cur => <option key={cur} value={cur}>{getFlagEmoji(cur)} {cur}</option>);
    }
    
    if (toolId === 'crypto' && key === 'token') {
      return allCurrencies.filter(cur => !fiatList.includes(cur) && cur !== 'USD' && cur !== 'EUR')
                          .map(cur => <option key={cur} value={cur}>{getFlagEmoji(cur)} {cur}</option>);
    }

    if (toolId === 'crypto' && key === 'currency') {
      return allCurrencies.filter(cur => fiatList.includes(cur) || cur === 'USD' || cur === 'EUR')
                          .map(cur => <option key={cur} value={cur}>{getFlagEmoji(cur)} {cur}</option>);
    }
    
    return options.map(o => <option key={o.v} value={o.v}>{o.l}</option>);
  };

  return (
    <div className="calculator-box">
      {visibleFields.map(f => (
        <div className="form-row" key={f.key}>
          <label>{f.label}</label>
          {f.type === 'select' ? (
            <select value={vals[f.key] || ''} onChange={e => setVals(p => ({ ...p, [f.key]: e.target.value }))}>
              {renderOptions(tool.id, f.key, f.options)}
            </select>
          ) : f.prefix ? (
            <div className="input-group">
              <span className="input-prefix">{f.prefix}</span>
              <input
                type={f.type || 'number'}
                placeholder={f.placeholder}
                value={vals[f.key] || ''}
                onChange={e => setVals(p => ({ ...p, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>
          ) : (
            <input
              type={f.type || 'number'}
              placeholder={f.placeholder}
              value={vals[f.key] || ''}
              onChange={e => setVals(p => ({ ...p, [f.key]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && calculate()}
            />
          )}
        </div>
      ))}
      <div className="btn-row">
        <button className="btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn-secondary" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div className="result-box show">
          <div className="result-main">{result.label}</div>
          <div className="result-value">{result.main}</div>
          {result.items && result.items.length > 0 && (
            <div className="result-grid">
              {result.items.map((item, i) => (
                <div className="result-item" key={i}>
                  <div className="result-item-label">{item.label}</div>
                  <div className="result-item-val">{item.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Amortization / Breakdown Table */}
          {result.table && (
            <div className="amortization-section">
              <button
                className="btn-toggle-table"
                onClick={() => setShowTable(!showTable)}
              >
                {showTable ? '▲ Hide' : '▼ Show'} {result.table.title}
              </button>
              {showTable && (
                <div className="amortization-table-wrap">
                  <table className="amortization-table">
                    <thead>
                      <tr>{result.table.headers.map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.table.rows.map((row, i) => (
                        <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
