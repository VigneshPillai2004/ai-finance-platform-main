"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Tax brackets for Indian tax regime (2023-24)
const NEW_TAX_BRACKETS = {
  "2023": [
    { threshold: 300000, rate: 0.0 },    // No tax up to 3L
    { threshold: 600000, rate: 0.05 },   // 5% from 3L to 6L
    { threshold: 900000, rate: 0.10 },   // 10% from 6L to 9L
    { threshold: 1200000, rate: 0.15 },  // 15% from 9L to 12L
    { threshold: 1500000, rate: 0.20 },  // 20% from 12L to 15L
    { threshold: null, rate: 0.30 },      // 30% above 15L
  ],
  "2024": [
    { threshold: 300000, rate: 0.0 },    // No tax up to 3L
    { threshold: 600000, rate: 0.05 },   // 5% from 3L to 6L
    { threshold: 900000, rate: 0.10 },   // 10% from 6L to 9L
    { threshold: 1200000, rate: 0.15 },  // 15% from 9L to 12L
    { threshold: 1500000, rate: 0.20 },  // 20% from 12L to 15L
    { threshold: null, rate: 0.30 },      // 30% above 15L
  ],
  "default": [
    { threshold: 300000, rate: 0.0 },    // No tax up to 3L
    { threshold: 600000, rate: 0.05 },   // 5% from 3L to 6L
    { threshold: 900000, rate: 0.10 },   // 10% from 6L to 9L
    { threshold: 1200000, rate: 0.15 },  // 15% from 9L to 12L
    { threshold: 1500000, rate: 0.20 },  // 20% from 12L to 15L
    { threshold: null, rate: 0.30 },      // 30% above 15L
  ]
};

const OLD_TAX_BRACKETS = {
  "2023": [
    { threshold: 250000, rate: 0.0 },    // No tax up to 2.5L
    { threshold: 500000, rate: 0.05 },   // 5% from 2.5L to 5L
    { threshold: 1000000, rate: 0.20 },  // 20% from 5L to 10L
    { threshold: null, rate: 0.30 },      // 30% above 10L
  ],
  "2024": [
    { threshold: 250000, rate: 0.0 },    // No tax up to 2.5L
    { threshold: 500000, rate: 0.05 },   // 5% from 2.5L to 5L
    { threshold: 1000000, rate: 0.20 },  // 20% from 5L to 10L
    { threshold: null, rate: 0.30 },      // 30% above 10L
  ],
  "default": [
    { threshold: 250000, rate: 0.0 },    // No tax up to 2.5L
    { threshold: 500000, rate: 0.05 },   // 5% from 2.5L to 5L
    { threshold: 1000000, rate: 0.20 },  // 20% from 5L to 10L
    { threshold: null, rate: 0.30 },      // 30% above 10L
  ]
};

// Tax brackets for business CURRENT accounts (2023-24)
const BUSINESS_TAX_BRACKETS = {
  "2023": [
    { threshold: 250000, rate: 0.0 },     // No tax up to 2.5L
    { threshold: 500000, rate: 0.05 },    // 5% from 2.5L to 5L
    { threshold: 1000000, rate: 0.20 },   // 20% from 5L to 10L
    { threshold: null, rate: 0.30 },      // 30% above 10L
  ],
  "2024": [
    { threshold: 250000, rate: 0.0 },     // No tax up to 2.5L
    { threshold: 500000, rate: 0.05 },    // 5% from 2.5L to 5L
    { threshold: 1000000, rate: 0.20 },   // 20% from 5L to 10L
    { threshold: null, rate: 0.30 },      // 30% above 10L
  ],
  "default": [
    { threshold: 250000, rate: 0.0 },     // No tax up to 2.5L
    { threshold: 500000, rate: 0.05 },    // 5% from 2.5L to 5L
    { threshold: 1000000, rate: 0.20 },   // 20% from 5L to 10L
    { threshold: null, rate: 0.30 },      // 30% above 10L
  ]
};

// Deduction category mapping with rates
const DEDUCTION_CATEGORY_MAPPING = {
  // Non-deductible categories
  "groceries": { category: "non-deductible", rate: 0.0 },
  "Groceries": { category: "non-deductible", rate: 0.0 },
  "grocery": { category: "non-deductible", rate: 0.0 },
  "Grocery": { category: "non-deductible", rate: 0.0 },
  "personal": { category: "non-deductible", rate: 0.0 },
  "Personal": { category: "non-deductible", rate: 0.0 },
  
  // Housing/Office Rent - 100% deductible
  "housing": { category: "office-rent", rate: 1.0 },
  "Housing": { category: "office-rent", rate: 1.0 },
  "rent": { category: "office-rent", rate: 1.0 },
  "Rent": { category: "office-rent", rate: 1.0 },
  "office": { category: "office-rent", rate: 1.0 },
  "Office": { category: "office-rent", rate: 1.0 },
  
  // Transportation - 100% deductible
  "transportation": { category: "business-transport", rate: 1.0 },
  "Transportation": { category: "business-transport", rate: 1.0 },
  "travel": { category: "business-transport", rate: 1.0 },
  "Travel": { category: "business-transport", rate: 1.0 },
  "transport": { category: "business-transport", rate: 1.0 },
  "Transport": { category: "business-transport", rate: 1.0 },
  
  // Utilities - 100% deductible
  "utilities": { category: "business-utilities", rate: 1.0 },
  "Utilities": { category: "business-utilities", rate: 1.0 },
  "utility": { category: "business-utilities", rate: 1.0 },
  "Utility": { category: "business-utilities", rate: 1.0 },
  "electric": { category: "business-utilities", rate: 1.0 },
  "Electric": { category: "business-utilities", rate: 1.0 },
  "water": { category: "business-utilities", rate: 1.0 },
  "Water": { category: "business-utilities", rate: 1.0 },
  "gas": { category: "business-utilities", rate: 1.0 },
  "Gas": { category: "business-utilities", rate: 1.0 },
  "internet": { category: "business-utilities", rate: 1.0 },
  "Internet": { category: "business-utilities", rate: 1.0 },
  "bills": { category: "business-utilities", rate: 1.0 },
  "Bills": { category: "business-utilities", rate: 1.0 },
  
  // Entertainment - 50% deductible
  "entertainment": { category: "business-entertainment", rate: 0.5 },
  "Entertainment": { category: "business-entertainment", rate: 0.5 },
  
  // Food/Meals - 50% deductible for business meetings
  "food": { category: "business-meals", rate: 0.5 },
  "Food": { category: "business-meals", rate: 0.5 },
  "meals": { category: "business-meals", rate: 0.5 },
  "Meals": { category: "business-meals", rate: 0.5 },
  "dining": { category: "business-meals", rate: 0.5 },
  "Dining": { category: "business-meals", rate: 0.5 },
  "restaurant": { category: "business-meals", rate: 0.5 },
  "Restaurant": { category: "business-meals", rate: 0.5 },
  
  // Shopping (Business Supplies) - 100% deductible
  "shopping": { category: "business-supplies", rate: 1.0 },
  "Shopping": { category: "business-supplies", rate: 1.0 },
  "supplies": { category: "business-supplies", rate: 1.0 },
  "Supplies": { category: "business-supplies", rate: 1.0 },
  "office supplies": { category: "business-supplies", rate: 1.0 },
  "Office Supplies": { category: "business-supplies", rate: 1.0 },
  
  // Healthcare (Employee Insurance) - 100% deductible
  "healthcare": { category: "employee-insurance", rate: 1.0 },
  "Healthcare": { category: "employee-insurance", rate: 1.0 },
  "health": { category: "employee-insurance", rate: 1.0 },
  "Health": { category: "employee-insurance", rate: 1.0 },
  "medical": { category: "employee-insurance", rate: 1.0 },
  "Medical": { category: "employee-insurance", rate: 1.0 },
  "insurance": { category: "employee-insurance", rate: 1.0 },
  "Insurance": { category: "employee-insurance", rate: 1.0 },
  
  // Education (Employee Training) - 100% deductible
  "education": { category: "employee-training", rate: 1.0 },
  "Education": { category: "employee-training", rate: 1.0 },
  "training": { category: "employee-training", rate: 1.0 },
  "Training": { category: "employee-training", rate: 1.0 },
  
  // Travel - 100% deductible
  "travel": { category: "business-travel", rate: 1.0 },
  "Travel": { category: "business-travel", rate: 1.0 },
  "lodging": { category: "business-travel", rate: 1.0 },
  "Lodging": { category: "business-travel", rate: 1.0 },
  
  // Gifts - 50% deductible
  "gifts": { category: "business-gifts", rate: 0.5 },
  "Gifts": { category: "business-gifts", rate: 0.5 },
  
  // Other Business Expenses - 100% deductible
  "other": { category: "other-business", rate: 1.0 },
  "Other": { category: "other-business", rate: 1.0 },
  "miscellaneous": { category: "other-business", rate: 1.0 },
  "Miscellaneous": { category: "other-business", rate: 1.0 },
};

// Function to format deduction category for display
function formatDeductionCategory(category) {
  if (!category) return "Unknown";
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Calculate the monthly breakdown for income and taxes
function calculateMonthlyBreakdown(transactions, totalDeductions, taxBrackets) {
  // Initialize an array for each month (0-11 for Jan-Dec)
  const monthlyData = Array(12).fill().map(() => ({ 
    income: 0, 
    expenses: 0,
    tax: 0 
  }));
  
  // Group transactions by month
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = date.getMonth();
    const amount = transaction.amount;
    
    if (amount > 0) {
      // Income
      monthlyData[month].income += amount;
    } else {
      // Expense
      monthlyData[month].expenses += Math.abs(amount);
    }
  });
  
  // Calculate tax for each month
  monthlyData.forEach((month, index) => {
    // Simple pro-rated deduction for the month
    const monthlyDeduction = totalDeductions / 12;
    
    // Calculate taxable income for the month
    const taxableIncome = Math.max(0, month.income - monthlyDeduction);
    
    // Apply tax brackets
    let tax = 0;
    let prevThreshold = 0;
    
    // Annualize the monthly income for tax bracket calculation
    const annualizedIncome = taxableIncome * 12;
    
    for (const bracket of taxBrackets) {
      if (annualizedIncome > prevThreshold) {
        const incomeInBracket = Math.min(annualizedIncome, bracket.threshold || Infinity) - prevThreshold;
        tax += incomeInBracket * bracket.rate;
        prevThreshold = bracket.threshold || Infinity;
        
        if (bracket.threshold === null || annualizedIncome <= bracket.threshold) {
          break;
        }
      }
    }
    
    // De-annualize the tax to get monthly amount
    month.tax = tax / 12;
  });
  
  return monthlyData;
}

// Deduction rate by category (what percentage of expenses can be deducted)
const DEDUCTION_RATES = {
  "mortgage-interest": 1.0,       // 100% deductible
  "state-local-taxes": 0.8,       // 80% deductible
  "medical-expenses": 0.75,       // 75% deductible (over 7.5% of AGI, simplified)
  "charitable-donations": 1.0,    // 100% deductible
  "education-expenses": 0.5,      // 50% deductible
  "business-expenses": 1.0,       // 100% deductible
  "other-deductions": 0.3,        // 30% deductible
};

// Standard deduction based on account type and income
function getStandardDeduction(accountType, totalIncome) {
  // Convert to uppercase for case-insensitive comparison
  const type = (accountType || '').toUpperCase();
  
  // For current account, no standard deduction as per business rules
  if (type === 'CURRENT') {
    return 0;
  }
  
  // For savings account, standard deduction based on income (New Regime)
  if (type === 'SAVINGS') {
    if (totalIncome <= 1000000) {  // 10,00,000
      return 75000;  // 75,000 standard deduction
    } else if (totalIncome <= 1250000) {  // 12,50,000
      return 70000;  // 70,000 standard deduction
    } else if (totalIncome <= 1500000) {  // 15,00,000
      return 65000;  // 65,000 standard deduction
    } else {
      return 50000;  // 50,000 standard deduction for higher incomes
    }
  }
  
  // Default standard deduction for other account types
  return 13850;  // Default US standard deduction
}

export async function calculateTaxes(taxRegime = "new") {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Fetch user from DB
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Fetch user's accounts
    const accounts = await db.account.findMany({
      where: { userId: user.id },
    });

    if (!accounts || accounts.length === 0) {
      return { success: false, error: "No accounts found" };
    }

    // Determine account type
    const defaultAccount = accounts.find(acc => acc.isDefault) || accounts[0];
    const accountType = defaultAccount.type || "SAVINGS";

    // Fetch transactions for the current year
    const currentYear = new Date().getFullYear();
    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        accountId: defaultAccount.id,
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Process transactions
    const processedTransactions = transactions.map(t => ({
      ...t,
      amount: t.type === "EXPENSE" ? -t.amount : t.amount
    }));

    // Calculate total income and expenses
    const totalIncome = processedTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = processedTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get standard deduction based on tax regime and account type
    const standardDeduction = accountType.toUpperCase() === "CURRENT" ? 0 : (taxRegime === "new" ? 75000 : 50000);

    // Calculate itemized deductions
    const expenseTransactions = processedTransactions.filter(t => t.amount < 0);
    let itemizedDeductions = 0;
    const itemizedBreakdown = {};
    const transactionsWithDeductions = [];

    // Process each expense transaction
    expenseTransactions.forEach(transaction => {
      const category = transaction.category.toLowerCase();
      const amount = Math.abs(transaction.amount);

      // Find matching deduction category
      let deductionCategory = "other";
      let deductionRate = 0;

      for (const [key, value] of Object.entries(DEDUCTION_CATEGORY_MAPPING)) {
        if (category.includes(key.toLowerCase())) {
          deductionCategory = value.category;
          deductionRate = value.rate;
          break;
        }
      }

      // Calculate deductible amount
      const deductibleAmount = amount * deductionRate;
      itemizedDeductions += deductibleAmount;

      // Update breakdown
      if (!itemizedBreakdown[deductionCategory]) {
        itemizedBreakdown[deductionCategory] = 0;
      }
      itemizedBreakdown[deductionCategory] += deductibleAmount;

      // Add to transactions with deductions
      transactionsWithDeductions.push({
        ...transaction,
        deductionCategory,
        deductibleAmount,
        deductionRate
      });
    });

    // Create category summary
    const categorySummary = {};
    transactionsWithDeductions.forEach(transaction => {
      const category = transaction.category;
      if (!categorySummary[category]) {
        categorySummary[category] = {
          totalAmount: 0,
          deductibleAmount: 0,
          transactionCount: 0,
          deductionRate: transaction.deductionRate,
          deductionCategory: transaction.deductionCategory
        };
      }
      categorySummary[category].totalAmount += Math.abs(transaction.amount);
      categorySummary[category].deductibleAmount += transaction.deductibleAmount;
      categorySummary[category].transactionCount += 1;
    });

    // For current accounts, always use itemized deductions
    const deductionTypeUsed = accountType.toUpperCase() === "CURRENT" ? "itemized" : 
                             (itemizedDeductions > standardDeduction ? "itemized" : "standard");
    const totalDeductions = deductionTypeUsed === "itemized" ? itemizedDeductions : standardDeduction;

    // Calculate taxable income
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    // Get tax brackets based on regime
    const taxBrackets = accountType.toUpperCase() === "CURRENT" 
      ? (BUSINESS_TAX_BRACKETS[currentYear] || BUSINESS_TAX_BRACKETS["default"])
      : (taxRegime === "new" 
          ? (NEW_TAX_BRACKETS[currentYear] || NEW_TAX_BRACKETS["default"])
          : (OLD_TAX_BRACKETS[currentYear] || OLD_TAX_BRACKETS["default"]));

    // Calculate tax
    let taxOwed = 0;
    let prevThreshold = 0;

    // Ensure taxBrackets is an array before iterating
    if (Array.isArray(taxBrackets)) {
      for (const bracket of taxBrackets) {
        if (taxableIncome > prevThreshold) {
          const incomeInBracket = Math.min(taxableIncome, bracket.threshold || Infinity) - prevThreshold;
          taxOwed += incomeInBracket * bracket.rate;
          prevThreshold = bracket.threshold || Infinity;

          if (bracket.threshold === null || taxableIncome <= bracket.threshold) {
            break;
          }
        }
      }
    } else {
      console.error("Invalid tax brackets format:", taxBrackets);
      return {
        success: false,
        error: "Invalid tax brackets configuration"
      };
    }

    // Calculate effective tax rate
    const effectiveTaxRate = totalIncome > 0 ? (taxOwed / totalIncome) * 100 : 0;

    // Calculate monthly breakdown
    const monthlyBreakdown = calculateMonthlyBreakdown(processedTransactions, totalDeductions, taxBrackets);

    // Prepare deduction comparison
    const deductionComparison = {
      standard: {
        amount: standardDeduction,
        description: accountType.toUpperCase() === "CURRENT" 
          ? "Current accounts do not qualify for standard deduction"
          : "Standard deduction based on tax regime"
      },
      itemized: {
        amount: itemizedDeductions,
        breakdown: itemizedBreakdown,
        description: "Itemized deductions based on expense categories"
      },
      difference: Math.abs(itemizedDeductions - standardDeduction),
      savings: Math.max(itemizedDeductions, standardDeduction) - Math.min(itemizedDeductions, standardDeduction),
      transactions: transactionsWithDeductions,
      categorySummary
    };

    return {
      success: true,
      data: {
        year: currentYear,
        accountType,
        totalIncome,
        totalExpenses,
        totalDeductions,
        deductionTypeUsed,
        taxableIncome,
        taxOwed,
        effectiveTaxRate: effectiveTaxRate.toFixed(2),
        monthlyBreakdown,
        deductionComparison,
        transactionCount: processedTransactions.length,
        taxRegime,
        transactions: transactionsWithDeductions,
        categorySummary
      }
    };

  } catch (error) {
    console.error("Error calculating taxes:", error);
    return {
      success: false,
      error: error.message || "Failed to calculate taxes"
    };
  }
}

// Generate sample tax data for demo purposes when user has no transactions
function generateDemoTaxData(accountType = "SAVINGS") {
  const totalIncome = 75000;
  const totalExpenses = 30000;
  
  // Get standard deduction based on account type
  const standardDeduction = getStandardDeduction(accountType, totalIncome);
  
  // Create sample itemized deductions
  const itemizedDeductionsByCategory = {
    "mortgage-interest": 8500,
    "charitable-donations": 2000,
    "medical-expenses": 1500,
    "state-local-taxes": 5000,
    "education-expenses": 1000,
    "business-expenses": 2000,
    "other-deductions": 500,
  };
  
  const totalItemizedDeductions = Object.values(itemizedDeductionsByCategory).reduce((sum, amount) => sum + amount, 0);
  const isStandardDeductionBetter = standardDeduction > totalItemizedDeductions;
  
  // For current accounts, always use itemized since standard deduction is 0
  const deductionTypeUsed = accountType.toUpperCase() === 'CURRENT' ? "itemized" : 
                            (isStandardDeductionBetter ? "standard" : "itemized");
  
  const effectiveTaxRate = 22; // Example tax rate
  
  // Generate sample monthly data
  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    // More income in summer months, less in winter
    const monthFactor = 1 + 0.3 * Math.sin((i - 3) * Math.PI / 6);
    const income = (totalIncome / 12) * monthFactor;
    const expenses = (totalExpenses / 12) * monthFactor;
    
    // Calculate tax based on monthly income
    let tax = 0;
    if (income <= 916.67) { // 11000/12
      tax = income * 0.10;
    } else if (income <= 3727.08) { // 44725/12
      tax = 91.67 + (income - 916.67) * 0.12;
    } else if (income <= 7947.92) { // 95375/12
      tax = 429.17 + (income - 3727.08) * 0.22;
    } else {
      tax = 1357.50 + (income - 7947.92) * 0.24;
    }
    
    return {
      income,
      expenses,
      tax,
    };
  });
  
  return {
    totalIncome,
    totalExpenses,
    standardDeduction,
    accountType,
    itemizedDeductions: totalItemizedDeductions,
    deductionComparison: {
      standard: {
        amount: standardDeduction,
        isBetter: isStandardDeductionBetter && accountType.toUpperCase() !== 'CURRENT',
      },
      itemized: {
        amount: totalItemizedDeductions,
        breakdown: itemizedDeductionsByCategory,
        isBetter: !isStandardDeductionBetter || accountType.toUpperCase() === 'CURRENT',
      },
      difference: Math.abs(standardDeduction - totalItemizedDeductions),
      savings: Math.abs(standardDeduction - totalItemizedDeductions) * (effectiveTaxRate / 100),
    },
    deductionTypeUsed,
    totalDeductions: deductionTypeUsed === "standard" ? standardDeduction : totalItemizedDeductions,
    taxableIncome: totalIncome - (deductionTypeUsed === "standard" ? standardDeduction : totalItemizedDeductions),
    taxOwed: 12000, // Example tax amount
    effectiveTaxRate,
    year: new Date().getFullYear(),
    monthlyBreakdown,
  };
} 