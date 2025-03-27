"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Tax brackets for Indian tax regime (2023-24)
const TAX_BRACKETS = {
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

export async function calculateTaxes() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }
    
    console.log("Calculating taxes for user:", userId);
    
    // Find the user using the clerk user ID
    const user = await db.user.findUnique({
      where: { clerkUserId: userId }
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    // Get user's accounts to determine account type
    const userAccounts = await db.account.findMany({
      where: { userId: user.id }
    });
    
    console.log("User accounts:", JSON.stringify(userAccounts, null, 2));
    
    // Determine the account type - default to the primary account or first account
    let accountType = "SAVINGS"; // Default fallback
    if (userAccounts.length > 0) {
      const primaryAccount = userAccounts.find(acc => acc.isDefault) || userAccounts[0];
      accountType = primaryAccount.type;
    }
    
    console.log("Using account type:", accountType);
    
    // For current accounts, we always use itemized deductions
    const useItemizedDeductions = accountType.toUpperCase() === 'CURRENT';
    
    // Get standard deduction based on account type
    const year = new Date().getFullYear();
    
    // Get transactions for the year
    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      select: {
        id: true,
        type: true,
        category: true,
        amount: true,
        description: true,
        date: true,
      },
    });
    
    console.log(`Retrieved ${transactions.length} transactions`);
    
    // Log raw transaction data for debugging
    console.log("Raw Transactions:", JSON.stringify(transactions.slice(0, 10), null, 2));
    
    // Make sure amount values are processed as numbers
    const processedTransactions = transactions.map(t => ({
      ...t,
      amount: Number(t.amount) * (t.type === 'EXPENSE' ? -1 : 1) // Convert expenses to negative numbers
    }));
    
    if (processedTransactions.length === 0) {
      return {
        success: true,
        data: generateDemoTaxData(accountType),
      };
    }
    
    // Calculate total income
    const incomeTransactions = processedTransactions.filter(t => t.amount > 0);
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate standard deduction based on account type and income
    const standardDeduction = getStandardDeduction(accountType, totalIncome);

    // Get expense categories and their deduction mapping
    const expenseTransactions = processedTransactions.filter(t => t.amount < 0);
    const totalExpenses = Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0));
    
    // Track unique expense categories for debugging
    const uniqueCategories = new Set();
    expenseTransactions.forEach(t => uniqueCategories.add(t.category));
    console.log("Unique expense categories:", Array.from(uniqueCategories));
    
    // Calculate itemized deductions
    let itemizedDeductions = 0;
    const itemizedBreakdown = {};
    const categorySummary = {};
    const transactionsWithDeductions = [];
    
    // Process each expense transaction with updated deduction rules
    expenseTransactions.forEach(transaction => {
      const { category, amount } = transaction;
      const absAmount = Math.abs(amount);
      
      // Find deduction category using our mapping
      let deductionCategory = null;
      let deductionRate = 0;
      
      // Try to find an exact match first (case-insensitive)
      for (const [key, value] of Object.entries(DEDUCTION_CATEGORY_MAPPING)) {
        const categoryLower = (category || '').toLowerCase();
        const keyLower = key.toLowerCase();
        
        if (
          // Try exact match first
          key === category || 
          // Try case insensitive match
          keyLower === categoryLower ||
          // Try finding by name match - look for substrings
          keyLower.includes(categoryLower) || categoryLower.includes(keyLower)
        ) {
          deductionCategory = value.category;
          deductionRate = value.rate;
          break;
        }
      }
      
      // If still no match and it's a current account, check if it's a personal expense
      if (!deductionCategory && category && useItemizedDeductions) {
        // List of personal expense keywords
        const personalExpenseKeywords = [
          'groceries', 'grocery', 'food', 'meals', 'dining', 'restaurant',
          'entertainment', 'shopping', 'personal', 'other'
        ];
        
        const categoryLower = (category || '').toLowerCase();
        const isPersonalExpense = personalExpenseKeywords.some(keyword => 
          categoryLower.includes(keyword)
        );
        
        if (isPersonalExpense) {
          deductionCategory = "non-deductible";
          deductionRate = 0.0;
        } else {
          deductionCategory = DEDUCTION_CATEGORY_MAPPING["other"].category;
          deductionRate = DEDUCTION_CATEGORY_MAPPING["other"].rate;
        }
      }
      
      // Calculate deductible amount
      const deductibleAmount = deductionRate > 0 ? absAmount * deductionRate : 0;
      
      // Add to itemized deductions only if it's deductible
      if (deductibleAmount > 0) {
        itemizedDeductions += deductibleAmount;
        
        // Add to category breakdown
        if (!itemizedBreakdown[deductionCategory]) {
          itemizedBreakdown[deductionCategory] = 0;
        }
        itemizedBreakdown[deductionCategory] += deductibleAmount;
        
        // Add to category summary
        const summaryKey = `${category}-to-${deductionCategory}`;
        if (!categorySummary[summaryKey]) {
          categorySummary[summaryKey] = {
            originalCategories: [category],
            displayMapping: `${category} → ${formatDeductionCategory(deductionCategory)}`,
            count: 0,
            totalAmount: 0,
            deductibleAmount: 0,
            deductionRate: deductionRate
          };
        } else if (!categorySummary[summaryKey].originalCategories.includes(category)) {
          categorySummary[summaryKey].originalCategories.push(category);
        }
        
        categorySummary[summaryKey].count++;
        categorySummary[summaryKey].totalAmount += absAmount;
        categorySummary[summaryKey].deductibleAmount += deductibleAmount;
      }
      
      // Add transaction with deduction info
      transactionsWithDeductions.push({
        ...transaction,
        deductionCategory: deductionCategory,
        deductibleAmount: deductibleAmount,
        deductionRate: deductionRate
      });
    });
    
    // Determine which deduction type to use
    let deductionTypeUsed = accountType === "CURRENT" ? "itemized" : 
                           (itemizedDeductions > standardDeduction ? "itemized" : "standard");
    const totalDeductions = deductionTypeUsed === "standard" ? standardDeduction : itemizedDeductions;
    
    // Calculate taxable income and tax owed
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    
    // Select appropriate tax brackets based on account type
    const taxBrackets = accountType === "CURRENT" ? 
                       (BUSINESS_TAX_BRACKETS[year] || BUSINESS_TAX_BRACKETS["default"]) :
                       (TAX_BRACKETS[year] || TAX_BRACKETS["default"]);
    
    let taxOwed = 0;
    let prevThreshold = 0;
    
    // Apply tax brackets to calculate tax owed
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
    
    // Apply surcharge for business income above thresholds
    let surcharge = 0;
    if (accountType === "CURRENT") {
      if (taxableIncome > 10000000) {  // Above 1 crore
        surcharge = taxOwed * 0.15;    // 15% surcharge
      } else if (taxableIncome > 5000000) {  // Above 50 lakhs
        surcharge = taxOwed * 0.10;    // 10% surcharge
      }
    }
    
    // Add surcharge to tax
    taxOwed += surcharge;
    
    // Add 4% health and education cess
    const cess = taxOwed * 0.04;
    taxOwed += cess;
    
    // Calculate effective tax rate
    const effectiveTaxRate = totalIncome > 0 ? ((taxOwed / totalIncome) * 100).toFixed(1) : 0;
    
    // Calculate monthly breakdown
    const monthlyBreakdown = calculateMonthlyBreakdown(processedTransactions, totalDeductions, taxBrackets);
    
    // Prepare data for comparison visualization
    const deductionComparison = {
      standard: {
        amount: standardDeduction,
        label: "Standard Deduction",
      },
      itemized: {
        amount: itemizedDeductions,
        label: "Itemized Deductions",
        breakdown: itemizedBreakdown,
      },
      difference: Math.abs(standardDeduction - itemizedDeductions),
      savings: Math.max(0, itemizedDeductions - standardDeduction),
      mappingDetails: DEDUCTION_CATEGORY_MAPPING,
      transactions: transactionsWithDeductions,
      categorySummary,
    };
    
    return {
      success: true,
      data: {
        year,
        accountType,
        totalIncome,
        totalExpenses,
        standardDeduction,
        itemizedDeductions,
        deductionTypeUsed,
        totalDeductions,
        taxableIncome,
        taxOwed,
        effectiveTaxRate,
        monthlyBreakdown,
        deductionComparison,
        transactionCount: processedTransactions.length,
      },
    };
  } catch (error) {
    console.error("Error calculating taxes:", error);
    return {
      success: false,
      error: error.message,
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