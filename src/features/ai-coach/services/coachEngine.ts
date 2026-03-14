import { formatCurrency } from '@/src/lib/formatters';
import type { FinancialContext, Insight } from './financialContext';

// Quick insights generated from financial data
export function getQuickInsights(ctx: FinancialContext): Insight[] {
  const insights: Insight[] = [];

  if (!ctx.hasData) {
    insights.push({
      id: 'no-data',
      title: 'Start Tracking',
      description: 'Add your first transaction to get personalized financial insights.',
      type: 'info',
      icon: 'plus-circle',
    });
    return insights;
  }

  // Savings rate insight
  if (ctx.savingsRate >= 20) {
    insights.push({
      id: 'savings-good',
      title: 'Great Savings Rate',
      description: `You're saving ${ctx.savingsRate.toFixed(0)}% of your income this month. That's above the recommended 20%.`,
      type: 'positive',
      icon: 'thumbs-up',
    });
  } else if (ctx.savingsRate > 0) {
    insights.push({
      id: 'savings-low',
      title: 'Improve Savings',
      description: `Your savings rate is ${ctx.savingsRate.toFixed(0)}%. Try to reach at least 20% using the 50/30/20 rule.`,
      type: 'warning',
      icon: 'exclamation-triangle',
    });
  } else if (ctx.monthlyIncome > 0) {
    insights.push({
      id: 'savings-negative',
      title: 'Spending More Than Earning',
      description: `You're spending more than your income. Review your expenses to find areas to cut back.`,
      type: 'warning',
      icon: 'exclamation-circle',
    });
  }

  // Budget insight
  if (ctx.overBudgetCount > 0) {
    insights.push({
      id: 'budget-over',
      title: `${ctx.overBudgetCount} Budget${ctx.overBudgetCount > 1 ? 's' : ''} Exceeded`,
      description: `${ctx.overBudgetCount} of your budgets are over limit. Consider adjusting your spending or budget amounts.`,
      type: 'warning',
      icon: 'warning',
    });
  } else if (ctx.budgetStatuses.length > 0) {
    insights.push({
      id: 'budget-ok',
      title: 'Budgets On Track',
      description: 'All your budgets are within limits. Keep it up!',
      type: 'positive',
      icon: 'check-circle',
    });
  }

  // Top spending category
  if (ctx.topCategories.length > 0) {
    const top = ctx.topCategories[0];
    insights.push({
      id: 'top-spending',
      title: `Top Expense: ${top.name}`,
      description: `${top.name} makes up ${top.percentage.toFixed(0)}% of your spending (${formatCurrency(top.amount)}).`,
      type: 'info',
      icon: 'pie-chart',
    });
  }

  // PH-specific tip (rotate based on day)
  const tips = getPHTips();
  const dayIndex = new Date().getDate() % tips.length;
  insights.push({
    id: 'ph-tip',
    title: tips[dayIndex].title,
    description: tips[dayIndex].description,
    type: 'tip',
    icon: 'lightbulb-o',
  });

  return insights;
}

// Generate response to user query
export function generateResponse(
  query: string,
  ctx: FinancialContext
): string {
  const q = query.toLowerCase().trim();

  // Greeting
  if (/^(hi|hello|hey|kumusta|musta)/i.test(q)) {
    return ctx.hasData
      ? `Hello! I'm your BudgetBox financial coach. This month, you've earned ${formatCurrency(ctx.monthlyIncome)} and spent ${formatCurrency(ctx.monthlyExpenses)}. Your savings rate is ${ctx.savingsRate.toFixed(1)}%. What would you like to know about your finances?`
      : `Hello! I'm your BudgetBox financial coach. Start by adding some transactions and I'll give you personalized financial advice. You can ask me about budgeting, saving, investing, and Philippine-specific financial tips.`;
  }

  // How am I doing / summary
  if (/how.*doing|summary|overview|status|report/i.test(q)) {
    return generateSummary(ctx);
  }

  // Savings amount for a specific period
  if (/how much.*\bsav(e|ed?|ing|ings)\b/i.test(q)) {
    return generateMonthSavings(query, ctx);
  }

  // Income / earnings for a specific period
  if (/how much.*(earn(ed?|ing)?|income|made?|receiv(ed?|ing)?)/i.test(q)) {
    return generateMonthIncome(query, ctx);
  }

  // Total spending for a specific month
  if (/how much.*spend.*(last|previous|this|month|\d{4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b)|spend.*(last|previous|this)\s+month/i.test(q)) {
    return generateMonthSpending(query, ctx);
  }

  // Month-over-month comparison
  if (/compare.*month|vs.*last month|last month.*vs|previous month|this month.*vs|vs.*this month|month.*comparison/i.test(q)) {
    return generateMonthlyComparison(ctx);
  }

  // Spending on a specific date
  const parsedDate = parseDateFromQuery(query);
  if (parsedDate && /spend|spent|transaction|on\b/i.test(q)) {
    return generateDateSpending(parsedDate, ctx);
  }

  // Category-specific spending or full breakdown
  const isCategoryBreakdown = /by category|category breakdown|breakdown|all categor/i.test(q);
  const categoryMatch = findCategoryMatch(query, ctx.allCategorySpending ?? []);
  if (categoryMatch || isCategoryBreakdown) {
    return generateCategorySpending(query, ctx);
  }

  // Where can I save / reduce spending
  if (/save|reduce|cut.*cost|spending|where.*money.*go/i.test(q)) {
    return generateSavingsTips(ctx);
  }

  // Investment advice
  if (/invest|stock|mutual.*fund|uitf|mp2|pag.?ibig|bond/i.test(q)) {
    return generateInvestmentAdvice(ctx);
  }

  // Budget help
  if (/budget|over.*budget|limit|allocat/i.test(q)) {
    return generateBudgetAdvice(ctx);
  }

  // Emergency fund
  if (/emergency|rainy.*day|safety.*net/i.test(q)) {
    return generateEmergencyFundAdvice(ctx);
  }

  // Tax tips
  if (/tax|bir|train.*law|deduction|withholding/i.test(q)) {
    return generateTaxTips();
  }

  // 50/30/20 rule
  if (/50.*30.*20|rule|allocat|split/i.test(q)) {
    return generate503020(ctx);
  }

  // SSS / PhilHealth / Pag-IBIG
  if (/sss|philhealth|pag.?ibig|government|mandatory/i.test(q)) {
    return generateGovContributions();
  }

  // Debt management
  if (/debt|loan|utang|credit.*card|owe/i.test(q)) {
    return generateDebtAdvice(ctx);
  }

  // Default
  return `I can help you with:\n\n• **Summary** - "How am I doing?"\n• **Savings** - "How much did I save this month / last month / in January?"\n• **Income** - "How much did I earn last month?"\n• **Spending total** - "How much did I spend in January?"\n• **By category** - "How much did I spend on Dining this month?"\n• **Full breakdown** - "Show spending by category"\n• **Compare months** - "Compare my spending to last month"\n• **Date lookup** - "How much did I spend on January 15?"\n• **Saving tips** - "Where can I save money?"\n• **Budgeting** - "Help with my budget"\n• **Investing** - "Should I invest?"\n• **Tax tips** - "PH tax optimization"\n• **50/30/20 rule** - "How should I split my income?"\n\nJust ask any question about your finances!`;
}

function generateSummary(ctx: FinancialContext): string {
  if (!ctx.hasData) {
    return `I don't have enough data yet. Add some transactions and I'll give you a detailed financial summary. Start by logging your income and expenses for this month.`;
  }

  let summary = `**Monthly Financial Summary**\n\n`;
  summary += `• **Income:** ${formatCurrency(ctx.monthlyIncome)}\n`;
  summary += `• **Expenses:** ${formatCurrency(ctx.monthlyExpenses)}\n`;
  summary += `• **Net:** ${formatCurrency(ctx.monthlyIncome - ctx.monthlyExpenses)}\n`;
  summary += `• **Savings Rate:** ${ctx.savingsRate.toFixed(1)}%\n\n`;

  if (ctx.savingsRate >= 20) {
    summary += `Your savings rate is excellent! You're above the recommended 20%. `;
  } else if (ctx.savingsRate > 0) {
    summary += `Your savings rate could improve. Aim for at least 20% of your income. `;
  } else {
    summary += `You're spending more than you earn. This needs immediate attention. `;
  }

  if (ctx.topCategories.length > 0) {
    summary += `\n\n**Top expenses:** `;
    summary += ctx.topCategories
      .slice(0, 3)
      .map((c) => `${c.name} (${formatCurrency(c.amount)})`)
      .join(', ');
  }

  if (ctx.overBudgetCount > 0) {
    summary += `\n\n⚠️ ${ctx.overBudgetCount} budget${ctx.overBudgetCount > 1 ? 's are' : ' is'} exceeded.`;
  }

  if (ctx.recurringObligations > 0) {
    summary += `\n\nYou have ${formatCurrency(ctx.recurringObligations)} in recurring monthly obligations.`;
  }

  return summary;
}

function generateSavingsTips(ctx: FinancialContext): string {
  if (!ctx.hasData) {
    return `Add your expenses first and I'll identify specific areas where you can save money. Start tracking your daily spending!`;
  }

  let tips = `**Where You Can Save Money**\n\n`;

  if (ctx.topCategories.length > 0) {
    tips += `Your biggest expenses are:\n`;
    ctx.topCategories.slice(0, 3).forEach((cat, i) => {
      tips += `${i + 1}. **${cat.name}**: ${formatCurrency(cat.amount)} (${cat.percentage.toFixed(0)}% of spending)\n`;
    });
    tips += `\n`;
  }

  tips += `**PH-Specific Savings Tips:**\n`;
  tips += `• Cook at home instead of eating out - average savings of ₱5,000-8,000/month\n`;
  tips += `• Use e-wallets (GCash/Maya) for cashback and promos\n`;
  tips += `• Shop during sale seasons (6.6, 7.7, 11.11, 12.12)\n`;
  tips += `• Consider generic brands at the grocery\n`;
  tips += `• Review subscriptions you don't use regularly\n`;
  tips += `• Take advantage of Pag-IBIG MP2 for guaranteed higher returns\n`;

  if (ctx.savingsRate < 20) {
    const neededSavings = ctx.monthlyIncome * 0.2 - (ctx.monthlyIncome - ctx.monthlyExpenses);
    if (neededSavings > 0) {
      tips += `\nTo reach a 20% savings rate, you need to save an additional ${formatCurrency(neededSavings)} per month.`;
    }
  }

  return tips;
}

function generateInvestmentAdvice(ctx: FinancialContext): string {
  let advice = `**Investment Guidance (Philippines)**\n\n`;

  if (ctx.hasData && ctx.savingsRate < 10) {
    advice += `⚠️ **First things first:** Your savings rate is low (${ctx.savingsRate.toFixed(0)}%). Build an emergency fund (3-6 months of expenses) before investing.\n\n`;
  }

  advice += `**PH Investment Options (Beginner to Advanced):**\n\n`;
  advice += `1. **Pag-IBIG MP2** - Government-backed, 6-7% annual dividends, tax-free. Best starter investment.\n`;
  advice += `2. **Digital Banks** - High-interest savings (up to 6% p.a.) from Tonik, Maya, SeaBank, GCash GInvest.\n`;
  advice += `3. **SSS Voluntary** - Increase contributions for higher pension and loan amounts.\n`;
  advice += `4. **UITF/Mutual Funds** - Start with bond or balanced funds (₱1,000 minimum). Consider BPI, BDO, or FirstMetroSec.\n`;
  advice += `5. **Philippine Stocks** - Open a COL Financial, FirstMetroSec, or Philstocks account. Start with blue chips (SM, JFC, BDO, TEL).\n`;
  advice += `6. **REITs** - Real estate exposure: AREIT, DDMPR, FILREIT, RCR.\n`;
  advice += `7. **Government Bonds** - Retail Treasury Bonds (RTB), premyo bonds from BTr.\n\n`;
  advice += `**Rule of thumb:** Only invest money you won't need for the next 3-5 years.`;

  return advice;
}

function generateBudgetAdvice(ctx: FinancialContext): string {
  let advice = `**Budget Management Tips**\n\n`;

  if (ctx.budgetStatuses.length > 0) {
    advice += `**Your Budget Status:**\n`;
    ctx.budgetStatuses.forEach((b) => {
      const status = b.isOverBudget
        ? '🔴 Over'
        : b.utilization >= 80
          ? '🟡 Near limit'
          : '🟢 On track';
      advice += `• ${b.name}: ${formatCurrency(b.spent)} / ${formatCurrency(b.budgeted)} (${b.utilization.toFixed(0)}%) ${status}\n`;
    });
    advice += `\n`;
  }

  advice += `**Recommended Budget Allocation (50/30/20):**\n`;
  if (ctx.monthlyIncome > 0) {
    advice += `• **Needs (50%):** ${formatCurrency(ctx.monthlyIncome * 0.5)} - rent, utilities, groceries, transpo\n`;
    advice += `• **Wants (30%):** ${formatCurrency(ctx.monthlyIncome * 0.3)} - dining out, entertainment, shopping\n`;
    advice += `• **Savings (20%):** ${formatCurrency(ctx.monthlyIncome * 0.2)} - emergency fund, investments, debt payoff\n`;
  } else {
    advice += `• **Needs (50%):** Rent, utilities, groceries, transpo\n`;
    advice += `• **Wants (30%):** Dining out, entertainment, shopping\n`;
    advice += `• **Savings (20%):** Emergency fund, investments, debt payoff\n`;
  }

  advice += `\n**Tips:**\n`;
  advice += `• Use the envelope method: allocate cash per category at month start\n`;
  advice += `• Review and adjust budgets monthly based on actual spending\n`;
  advice += `• Set up budget alerts at 80% threshold for early warning`;

  return advice;
}

function generateEmergencyFundAdvice(ctx: FinancialContext): string {
  let advice = `**Emergency Fund Guide**\n\n`;
  advice += `An emergency fund is your financial safety net for unexpected events like job loss, medical emergencies, or appliance breakdowns.\n\n`;

  advice += `**How much do you need?**\n`;
  if (ctx.monthlyExpenses > 0) {
    advice += `• **Minimum (3 months):** ${formatCurrency(ctx.monthlyExpenses * 3)}\n`;
    advice += `• **Ideal (6 months):** ${formatCurrency(ctx.monthlyExpenses * 6)}\n`;
    advice += `• Based on your monthly expenses of ${formatCurrency(ctx.monthlyExpenses)}\n\n`;
  } else {
    advice += `• **Minimum:** 3 months of living expenses\n`;
    advice += `• **Ideal:** 6 months of living expenses\n\n`;
  }

  advice += `**Where to keep it:**\n`;
  advice += `• Digital bank savings accounts (Tonik, Maya, SeaBank) for higher interest\n`;
  advice += `• Separate from your daily spending account\n`;
  advice += `• Must be easily accessible (not locked in time deposits)\n\n`;

  advice += `**How to build it:**\n`;
  advice += `• Start with ₱1,000/month and increase gradually\n`;
  advice += `• Automate transfers every payday\n`;
  advice += `• Put unexpected income (bonuses, 13th month) toward it\n`;
  advice += `• Don't touch it unless it's a real emergency`;

  return advice;
}

function generateTaxTips(): string {
  return `**PH Tax Optimization Tips**\n\n` +
    `**TRAIN Law Tax Brackets (2024):**\n` +
    `• ₱0 - ₱250,000: 0% (tax-free!)\n` +
    `• ₱250,001 - ₱400,000: 15%\n` +
    `• ₱400,001 - ₱800,000: 20%\n` +
    `• ₱800,001 - ₱2,000,000: 25%\n` +
    `• ₱2,000,001 - ₱8,000,000: 30%\n` +
    `• Over ₱8,000,000: 35%\n\n` +
    `**Tax-Saving Strategies:**\n` +
    `• **Pag-IBIG MP2** dividends are tax-exempt\n` +
    `• **SSS voluntary contributions** increase your pension and reduce taxable income\n` +
    `• **PERA (Personal Equity Retirement Account)** - up to ₱100,000 tax deductible per year\n` +
    `• **13th month pay** up to ₱90,000 is tax-exempt\n` +
    `• **De minimis benefits** from employer are tax-free (rice, uniform, laundry, etc.)\n\n` +
    `**For freelancers/self-employed:**\n` +
    `• 8% flat tax option if gross income ≤ ₱3M (simpler, sometimes lower)\n` +
    `• Keep receipts for deductible business expenses\n` +
    `• File quarterly and annual ITR on time to avoid penalties`;
}

function generate503020(ctx: FinancialContext): string {
  let advice = `**The 50/30/20 Rule**\n\n`;
  advice += `A simple budgeting framework to allocate your income:\n\n`;

  if (ctx.monthlyIncome > 0) {
    const needs = ctx.monthlyIncome * 0.5;
    const wants = ctx.monthlyIncome * 0.3;
    const savings = ctx.monthlyIncome * 0.2;

    advice += `Based on your income of ${formatCurrency(ctx.monthlyIncome)}:\n\n`;
    advice += `• **50% Needs:** ${formatCurrency(needs)}\n`;
    advice += `  Rent, utilities, groceries, transportation, insurance, loan payments\n\n`;
    advice += `• **30% Wants:** ${formatCurrency(wants)}\n`;
    advice += `  Dining out, entertainment, shopping, hobbies, subscriptions\n\n`;
    advice += `• **20% Savings & Investments:** ${formatCurrency(savings)}\n`;
    advice += `  Emergency fund, Pag-IBIG MP2, stocks, UITFs, retirement\n\n`;

    const actualNeeds = ctx.monthlyExpenses;
    if (actualNeeds > needs) {
      advice += `⚠️ Your current expenses (${formatCurrency(actualNeeds)}) exceed the 50% needs allocation. Consider reducing non-essential spending.`;
    }
  } else {
    advice += `• **50% Needs:** Rent, utilities, groceries, transpo\n`;
    advice += `• **30% Wants:** Dining, entertainment, shopping\n`;
    advice += `• **20% Savings:** Emergency fund, investments\n\n`;
    advice += `Add your income to get personalized allocation amounts.`;
  }

  return advice;
}

function generateGovContributions(): string {
  return `**Government Contributions Guide (Philippines)**\n\n` +
    `**SSS (Social Security System):**\n` +
    `• Mandatory for employed and self-employed\n` +
    `• Employee share: based on salary credit (ranges from ₱180 to ₱1,350/month)\n` +
    `• Benefits: pension, sickness, maternity, disability, death, loan\n` +
    `• **Tip:** Voluntary contributions can increase your pension significantly\n\n` +
    `**PhilHealth:**\n` +
    `• Premium: 5% of monthly salary (split with employer)\n` +
    `• Salary range: ₱10,000 - ₱100,000\n` +
    `• Benefits: hospitalization, medical expenses\n` +
    `• **Tip:** Always keep your account active for healthcare coverage\n\n` +
    `**Pag-IBIG (HDMF):**\n` +
    `• Mandatory contribution: 1-2% of salary (max ₱200)\n` +
    `• Benefits: housing loan (lowest interest rate), multi-purpose loan\n` +
    `• **MP2 (Modified Pag-IBIG 2):** Voluntary savings with 6-7% annual dividends, TAX-FREE\n` +
    `• **Tip:** Max out MP2 contributions (₱10,000/month) for guaranteed tax-free returns. This is one of the best low-risk investments in PH.`;
}

function generateDebtAdvice(ctx: FinancialContext): string {
  let advice = `**Debt Management Guide**\n\n`;
  advice += `**Two Popular Strategies:**\n\n`;
  advice += `1. **Avalanche Method** (saves more money)\n`;
  advice += `   Pay minimum on all debts, then put extra toward the HIGHEST interest rate debt first.\n\n`;
  advice += `2. **Snowball Method** (builds momentum)\n`;
  advice += `   Pay minimum on all debts, then put extra toward the SMALLEST balance first.\n\n`;
  advice += `**PH-Specific Tips:**\n`;
  advice += `• Credit card interest: up to 3% per month (36% p.a.) - pay full balance always\n`;
  advice += `• Consider Pag-IBIG multi-purpose loan (10.5% p.a.) to consolidate high-interest debt\n`;
  advice += `• SSS salary loan (10% p.a.) is another low-interest option\n`;
  advice += `• Never pay just the minimum on credit cards\n`;
  advice += `• Negotiate with banks for lower interest or payment restructuring\n\n`;
  advice += `**Priority order for debt payoff:**\n`;
  advice += `1. Credit cards (highest interest)\n`;
  advice += `2. Personal loans\n`;
  advice += `3. Car loans\n`;
  advice += `4. Housing loans (usually lowest interest, tax deductible)`;

  return advice;
}

// ─── Period helpers (savings / income / spending by month) ──────────────────

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthFromQuery(query: string): string | null {
  const q = query.toLowerCase();
  const now = new Date();

  if (/this month/.test(q)) return currentMonthKey();

  if (/last month|previous month/.test(q)) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // "2 months ago" / "two months ago"
  const numWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  const mAgo = q.match(/(\d+|one|two|three|four|five|six)\s+months?\s+ago/);
  if (mAgo) {
    const n = numWords[mAgo[1]] ?? parseInt(mAgo[1], 10);
    const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // "January", "Jan 2025", "January 2025"
  const monthNamePattern = Object.keys(MONTH_MAP).join('|');
  const m = query.match(new RegExp(`\\b(${monthNamePattern})(?:\\s+(\\d{4}))?\\b`, 'i'));
  if (m) {
    const month = MONTH_MAP[m[1].toLowerCase()];
    const year = m[2] ?? now.getFullYear().toString();
    if (month) return `${year}-${month}`;
  }

  return null;
}

function getMonthFinancials(month: string, ctx: FinancialContext) {
  const txns = ctx.transactions.filter(t => t.date?.startsWith(month));
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  return { income, expenses, savings, savingsRate, txnCount: txns.length };
}

function generateMonthSavings(query: string, ctx: FinancialContext): string {
  const month = parseMonthFromQuery(query) ?? currentMonthKey();
  const isCurrent = month === currentMonthKey();
  const label = isCurrent ? 'This Month' : formatMonthKey(month);

  const d = isCurrent
    ? { income: ctx.monthlyIncome, expenses: ctx.monthlyExpenses, savings: ctx.monthlyIncome - ctx.monthlyExpenses, savingsRate: ctx.savingsRate, txnCount: ctx.transactionCount }
    : getMonthFinancials(month, ctx);

  if (!isCurrent && d.txnCount === 0) {
    return `No transactions found for **${formatMonthKey(month)}**. Make sure your transactions for that month are logged.`;
  }

  let r = `**Savings — ${label}**\n\n`;
  r += `• Income: ${formatCurrency(d.income)}\n`;
  r += `• Expenses: ${formatCurrency(d.expenses)}\n`;
  r += `• Net Savings: **${formatCurrency(d.savings)}**\n`;
  r += `• Savings Rate: **${d.savingsRate.toFixed(1)}%**\n\n`;

  if (d.income === 0) {
    r += `No income recorded for ${label} yet.`;
  } else if (d.savings < 0) {
    r += `⚠️ You spent ${formatCurrency(Math.abs(d.savings))} more than you earned. Review your expenses to get back on track.`;
  } else if (d.savingsRate >= 20) {
    r += `✅ Excellent savings rate — above the recommended 20%!`;
  } else {
    const needed = d.income * 0.2 - d.savings;
    r += `Your savings rate is ${d.savingsRate.toFixed(1)}%. To hit 20%, save an additional ${formatCurrency(needed)}.`;
  }

  return r;
}

function generateMonthIncome(query: string, ctx: FinancialContext): string {
  const month = parseMonthFromQuery(query) ?? currentMonthKey();
  const isCurrent = month === currentMonthKey();
  const label = isCurrent ? 'This Month' : formatMonthKey(month);

  const d = isCurrent
    ? { income: ctx.monthlyIncome, expenses: ctx.monthlyExpenses, savings: ctx.monthlyIncome - ctx.monthlyExpenses, savingsRate: ctx.savingsRate, txnCount: ctx.transactionCount }
    : getMonthFinancials(month, ctx);

  if (!isCurrent && d.txnCount === 0) {
    return `No transactions found for **${formatMonthKey(month)}**. Make sure your transactions for that month are logged.`;
  }

  const incomeTxns = ctx.transactions.filter(t => t.type === 'income' && t.date?.startsWith(month));

  let r = `**Income — ${label}**\n\n`;
  r += `• Total Earned: **${formatCurrency(d.income)}**\n`;

  // Breakdown by category/source
  if (incomeTxns.length > 0) {
    const catMap = new Map<string, number>();
    incomeTxns.forEach(t => {
      const name = ctx.categories.find(c => c.id === t.category_id)?.name ?? 'Other Income';
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount);
    });
    if (catMap.size > 1) {
      r += `\n**By source:**\n`;
      Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, amt]) => { r += `• ${name}: ${formatCurrency(amt)}\n`; });
    }
  }

  r += `\n• Expenses: ${formatCurrency(d.expenses)}\n`;
  r += `• Net: ${formatCurrency(d.savings)}\n`;

  if (d.income === 0) {
    r += `\nNo income recorded for ${label} yet. Log your income transactions to track your earnings.`;
  }

  return r;
}

function generateMonthSpending(query: string, ctx: FinancialContext): string {
  const month = parseMonthFromQuery(query) ?? currentMonthKey();
  const isCurrent = month === currentMonthKey();
  const label = isCurrent ? 'This Month' : formatMonthKey(month);

  const d = isCurrent
    ? { income: ctx.monthlyIncome, expenses: ctx.monthlyExpenses, savings: ctx.monthlyIncome - ctx.monthlyExpenses, savingsRate: ctx.savingsRate, txnCount: ctx.transactionCount }
    : getMonthFinancials(month, ctx);

  if (!isCurrent && d.txnCount === 0) {
    return `No transactions found for **${formatMonthKey(month)}**. Make sure your transactions for that month are logged.`;
  }

  const expTxns = ctx.transactions.filter(t => t.type === 'expense' && t.date?.startsWith(month));

  let r = `**Total Spending — ${label}**\n\n`;
  r += `• Total Expenses: **${formatCurrency(d.expenses)}**\n`;
  r += `• Income: ${formatCurrency(d.income)}\n`;
  r += `• Net: ${formatCurrency(d.savings)}\n`;

  if (expTxns.length > 0) {
    const catMap = new Map<string, number>();
    expTxns.forEach(t => {
      const name = ctx.categories.find(c => c.id === t.category_id)?.name ?? 'Uncategorized';
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount);
    });
    const sorted = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length > 0) {
      r += `\n**Top categories:**\n`;
      sorted.forEach(([name, amt]) => {
        const pct = d.expenses > 0 ? (amt / d.expenses) * 100 : 0;
        r += `• ${name}: ${formatCurrency(amt)} (${pct.toFixed(0)}%)\n`;
      });
    }
  }

  return r;
}

// ─── Month-over-month comparison ────────────────────────────────────────────

function formatMonthKey(month: string): string {
  const [year, m] = month.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[parseInt(m, 10) - 1]} ${year}`;
}

function generateMonthlyComparison(ctx: FinancialContext): string {
  if (ctx.monthlyTrends.length < 2) {
    return `Not enough data yet for a month comparison. Keep tracking your transactions and I'll compare months as soon as there's data from two months.`;
  }

  const current = ctx.monthlyTrends[0];
  const previous = ctx.monthlyTrends[1];

  const expenseDiff = current.expenses - previous.expenses;
  const incomeDiff = current.income - previous.income;
  const expensePct = previous.expenses > 0 ? (expenseDiff / previous.expenses) * 100 : 0;

  // Per-category comparison for current and previous month
  const prevMonthTxns = ctx.transactions.filter(t => t.date?.startsWith(previous.month));
  const prevCatMap = new Map<string, number>();
  prevMonthTxns
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const name = ctx.categories.find(c => c.id === t.category_id)?.name ?? 'Uncategorized';
      prevCatMap.set(name, (prevCatMap.get(name) ?? 0) + t.amount);
    });

  let r = `**Month-over-Month Comparison**\n`;
  r += `${formatMonthKey(previous.month)} → ${formatMonthKey(current.month)}\n\n`;

  r += `**Income**\n`;
  r += `• ${formatMonthKey(previous.month)}: ${formatCurrency(previous.income)}\n`;
  r += `• ${formatMonthKey(current.month)}: ${formatCurrency(current.income)}\n`;
  if (incomeDiff !== 0) {
    r += `• Change: ${incomeDiff >= 0 ? '+' : ''}${formatCurrency(incomeDiff)}\n`;
  }
  r += `\n`;

  r += `**Expenses**\n`;
  r += `• ${formatMonthKey(previous.month)}: ${formatCurrency(previous.expenses)}\n`;
  r += `• ${formatMonthKey(current.month)}: ${formatCurrency(current.expenses)}\n`;
  if (expenseDiff !== 0) {
    r += `• Change: ${expenseDiff >= 0 ? '+' : ''}${formatCurrency(expenseDiff)} (${expensePct >= 0 ? '+' : ''}${expensePct.toFixed(1)}%)\n`;
  }
  r += `\n`;

  r += `**Net Savings**\n`;
  r += `• ${formatMonthKey(previous.month)}: ${formatCurrency(previous.savings)}\n`;
  r += `• ${formatMonthKey(current.month)}: ${formatCurrency(current.savings)}\n\n`;

  // Category-level changes
  if (ctx.allCategorySpending.length > 0 && prevCatMap.size > 0) {
    const changes = ctx.allCategorySpending
      .map(cat => ({
        name: cat.name,
        current: cat.amount,
        previous: prevCatMap.get(cat.name) ?? 0,
        diff: cat.amount - (prevCatMap.get(cat.name) ?? 0),
      }))
      .filter(c => c.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 3);

    if (changes.length > 0) {
      r += `**Biggest category changes:**\n`;
      changes.forEach(c => {
        r += `• ${c.name}: ${c.diff >= 0 ? '+' : ''}${formatCurrency(c.diff)}\n`;
      });
      r += `\n`;
    }
  }

  if (expenseDiff > 0) {
    r += `⚠️ You spent ${formatCurrency(expenseDiff)} more than last month (${expensePct.toFixed(1)}% increase).`;
  } else if (expenseDiff < 0) {
    r += `✅ You spent ${formatCurrency(Math.abs(expenseDiff))} less than last month (${Math.abs(expensePct).toFixed(1)}% decrease). Great job!`;
  } else {
    r += `Your spending is the same as last month.`;
  }

  return r;
}

// ─── Category-specific spending ─────────────────────────────────────────────

function findCategoryMatch(query: string, categories: CategorySpending[]): CategorySpending | null {
  if (!categories.length) return null;
  const q = query.toLowerCase();

  // Full name match (case-insensitive)
  const full = categories.find(c => q.includes(c.name.toLowerCase()));
  if (full) return full;

  // Word-level match — any significant word (> 3 chars) in the category name
  const word = categories.find(c => {
    const words = c.name.toLowerCase().split(/[\s&,/]+/).filter(w => w.length > 3);
    return words.some(w => q.includes(w));
  });
  return word ?? null;
}

function generateCategorySpending(query: string, ctx: FinancialContext): string {
  if (!ctx.hasData || ctx.allCategorySpending.length === 0) {
    return `No expense data recorded this month yet. Start adding transactions and I'll break them down by category.`;
  }

  const matched = findCategoryMatch(query, ctx.allCategorySpending);

  if (matched) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const catTxns = ctx.transactions.filter(t => {
      const name = ctx.categories.find(c => c.id === t.category_id)?.name ?? 'Uncategorized';
      return t.type === 'expense' && name === matched.name && t.date?.startsWith(currentMonth);
    });

    let r = `**${matched.name} — This Month**\n\n`;
    r += `• Total spent: **${formatCurrency(matched.amount)}**\n`;
    r += `• Share of expenses: **${matched.percentage.toFixed(1)}%** of ${formatCurrency(ctx.monthlyExpenses)}\n`;

    if (catTxns.length > 0) {
      r += `\n**Transactions (${catTxns.length}):**\n`;
      const shown = catTxns.slice(0, 6);
      shown.forEach(t => {
        r += `• ${t.date}: ${t.description ?? matched.name} — ${formatCurrency(t.amount)}\n`;
      });
      if (catTxns.length > 6) {
        r += `• ...and ${catTxns.length - 6} more\n`;
      }
    }

    return r;
  }

  // No specific category found — show full breakdown
  let r = `**Spending by Category — This Month**\n\n`;
  ctx.allCategorySpending.forEach((cat, i) => {
    r += `${i + 1}. **${cat.name}**: ${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)\n`;
  });
  r += `\n**Total Expenses:** ${formatCurrency(ctx.monthlyExpenses)}`;
  return r;
}

// ─── Date-specific spending ──────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

function parseDateFromQuery(query: string): string | null {
  const q = query.toLowerCase();

  if (q.includes('today')) return new Date().toISOString().split('T')[0];
  if (q.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  // ISO: 2025-01-15
  const iso = query.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const monthNames = Object.keys(MONTH_MAP).join('|');

  // "January 15" or "Jan 15, 2025"
  const mdy = query.match(
    new RegExp(`(${monthNames})\\s+(\\d{1,2})(?:[,\\s]+(\\d{4}))?`, 'i'),
  );
  if (mdy) {
    const month = MONTH_MAP[mdy[1].toLowerCase()];
    const day = mdy[2].padStart(2, '0');
    const year = mdy[3] ?? new Date().getFullYear().toString();
    if (month) return `${year}-${month}-${day}`;
  }

  // "15 January" or "15th Jan"
  const dmy = query.match(
    new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})(?:[,\\s]+(\\d{4}))?`, 'i'),
  );
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = MONTH_MAP[dmy[2].toLowerCase()];
    const year = dmy[3] ?? new Date().getFullYear().toString();
    if (month) return `${year}-${month}-${day}`;
  }

  return null;
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const names = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${names[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function generateDateSpending(date: string, ctx: FinancialContext): string {
  const dayTxns = ctx.transactions.filter(t => t.date === date);

  if (dayTxns.length === 0) {
    return `No transactions found on **${formatDateLabel(date)}**. Either nothing was recorded that day, or it hasn't been logged yet.`;
  }

  const expenses = dayTxns.filter(t => t.type === 'expense');
  const income = dayTxns.filter(t => t.type === 'income');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  let r = `**Transactions on ${formatDateLabel(date)}**\n\n`;

  if (expenses.length > 0) {
    r += `**Expenses — ${formatCurrency(totalExpense)}**\n`;
    expenses.forEach(t => {
      const catName = ctx.categories.find(c => c.id === t.category_id)?.name ?? 'Expense';
      r += `• ${t.description ?? catName}: ${formatCurrency(t.amount)}\n`;
    });
    r += `\n`;
  }

  if (income.length > 0) {
    r += `**Income — ${formatCurrency(totalIncome)}**\n`;
    income.forEach(t => {
      const catName = ctx.categories.find(c => c.id === t.category_id)?.name ?? 'Income';
      r += `• ${t.description ?? catName}: ${formatCurrency(t.amount)}\n`;
    });
  }

  if (expenses.length === 0 && income.length === 0) {
    r += `Only transfer or other transactions were found on this date.`;
  }

  return r;
}

function getPHTips(): { title: string; description: string }[] {
  return [
    {
      title: 'MP2 Savings',
      description: 'Pag-IBIG MP2 offers 6-7% annual dividends, tax-free. One of the safest high-yield investments in PH.',
    },
    {
      title: 'Digital Bank Savings',
      description: 'Digital banks like Tonik, Maya, and SeaBank offer up to 6% interest p.a. vs traditional banks at <1%.',
    },
    {
      title: 'GCash/Maya Promos',
      description: 'Use e-wallet promos for cashback on bills payment, shopping, and food delivery to save ₱500-1,000/month.',
    },
    {
      title: '13th Month Tax-Free',
      description: 'Your 13th month pay up to ₱90,000 is tax-exempt. Consider putting it toward your emergency fund or investments.',
    },
    {
      title: 'Track Every Peso',
      description: 'People who track expenses consistently save 15-20% more. Log all transactions, even small ones like parking and snacks.',
    },
    {
      title: 'Automate Savings',
      description: 'Set up auto-transfer on payday to a separate savings account. What you don\'t see, you won\'t spend.',
    },
    {
      title: 'SSS Benefits',
      description: 'SSS offers salary loans at 10% p.a. - much cheaper than credit cards. Keep contributions updated to qualify.',
    },
  ];
}
