"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function calculateTaxes() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get all income transactions for the current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate total income
    const totalIncome = transactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate total expenses for deductions
    const totalExpenses = transactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Basic tax calculation (simplified)
    // This is a basic example - you should implement proper tax brackets and rules
    let taxOwed = 0;
    let effectiveTaxRate = 0;

    if (totalIncome <= 11000) {
      taxOwed = totalIncome * 0.10;
      effectiveTaxRate = 10;
    } else if (totalIncome <= 44725) {
      taxOwed = 1100 + (totalIncome - 11000) * 0.12;
      effectiveTaxRate = 12;
    } else if (totalIncome <= 95375) {
      taxOwed = 5147 + (totalIncome - 44725) * 0.22;
      effectiveTaxRate = 22;
    } else if (totalIncome <= 182100) {
      taxOwed = 16290 + (totalIncome - 95375) * 0.24;
      effectiveTaxRate = 24;
    } else if (totalIncome <= 231250) {
      taxOwed = 37104 + (totalIncome - 182100) * 0.32;
      effectiveTaxRate = 32;
    } else if (totalIncome <= 578125) {
      taxOwed = 52832 + (totalIncome - 231250) * 0.35;
      effectiveTaxRate = 35;
    } else {
      taxOwed = 174238.25 + (totalIncome - 578125) * 0.37;
      effectiveTaxRate = 37;
    }

    // Calculate deductions (simplified)
    const standardDeduction = 13850; // 2024 standard deduction
    const itemizedDeductions = totalExpenses * 0.3; // 30% of expenses as potential deductions
    const totalDeductions = Math.max(standardDeduction, itemizedDeductions);

    // Apply deductions to taxable income
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const finalTaxOwed = Math.max(0, taxOwed - (taxableIncome * 0.1)); // 10% reduction for deductions

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        totalDeductions,
        taxableIncome,
        taxOwed: finalTaxOwed,
        effectiveTaxRate,
        year: currentYear,
        monthlyBreakdown: calculateMonthlyBreakdown(transactions),
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

function calculateMonthlyBreakdown(transactions) {
  const monthlyData = Array.from({ length: 12 }, () => ({
    income: 0,
    expenses: 0,
    tax: 0,
  }));

  transactions.forEach(transaction => {
    const month = new Date(transaction.date).getMonth();
    const amount = Number(transaction.amount);

    if (transaction.type === "INCOME") {
      monthlyData[month].income += amount;
    } else {
      monthlyData[month].expenses += amount;
    }
  });

  // Calculate monthly tax based on monthly income
  monthlyData.forEach(month => {
    if (month.income <= 916.67) { // 11000/12
      month.tax = month.income * 0.10;
    } else if (month.income <= 3727.08) { // 44725/12
      month.tax = 91.67 + (month.income - 916.67) * 0.12;
    } else if (month.income <= 7947.92) { // 95375/12
      month.tax = 429.17 + (month.income - 3727.08) * 0.22;
    } else if (month.income <= 15175) { // 182100/12
      month.tax = 1357.50 + (month.income - 7947.92) * 0.24;
    } else if (month.income <= 19270.83) { // 231250/12
      month.tax = 3092 + (month.income - 15175) * 0.32;
    } else if (month.income <= 48177.08) { // 578125/12
      month.tax = 4402.67 + (month.income - 19270.83) * 0.35;
    } else {
      month.tax = 14519.85 + (month.income - 48177.08) * 0.37;
    }
  });

  return monthlyData;
} 