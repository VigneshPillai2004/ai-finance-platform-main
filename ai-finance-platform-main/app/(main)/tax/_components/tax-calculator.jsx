"use client";

import { useEffect, useState } from "react";
import { calculateTaxes } from "@/actions/tax";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarLoader } from "react-spinners";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeductionComparison } from "./deduction-comparison";
import { Badge } from "@/components/ui/badge";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function TaxCalculator() {
  const [loading, setLoading] = useState(true);
  const [taxData, setTaxData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        const result = await calculateTaxes();
        if (result.success) {
          setTaxData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxData();
  }, []);

  if (loading) {
    return <BarLoader className="mt-4" width={"100%"} color="#9333ea" />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        Error calculating taxes: {error}
      </div>
    );
  }

  const chartData = taxData.monthlyBreakdown.map((month, index) => ({
    month: MONTHS[index],
    income: month.income,
    tax: month.tax,
  }));

  // Format account type for display
  const accountType = taxData.accountType ? taxData.accountType.toUpperCase() : 'UNKNOWN';
  const accountBadgeColor = accountType === 'SAVINGS' ? 'bg-green-500' :
                            accountType === 'CURRENT' ? 'bg-blue-500' : 'bg-gray-500';

  return (
    <div className="space-y-6">
      {/* Account Type Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Account Type</CardTitle>
            <CardDescription>
              Tax rules vary based on account type
            </CardDescription>
          </div>
          <Badge className={accountBadgeColor}>
            {accountType}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {accountType === 'CURRENT' ? (
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>
                  Current accounts do not qualify for standard deduction. Only itemized deductions will be considered for tax purposes.
                </p>
              </div>
            ) : accountType === 'SAVINGS' ? (
              <div className="flex gap-2 items-start">
                <Info className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>
                  Savings accounts qualify for standard deduction under the New Regime. 
                  For annual income up to ₹10,00,000, a standard deduction of ₹75,000 applies.
                  Higher incomes have lower standard deductions.
                </p>
              </div>
            ) : (
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p>
                  Unknown account type. Using default tax rules.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${taxData.totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${taxData.totalDeductions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {taxData.deductionTypeUsed === "standard" ? "Standard" : "Itemized"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxable Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${taxData.taxableIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Owed</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${taxData.taxOwed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Effective Rate: {taxData.effectiveTaxRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deduction Comparison */}
      <DeductionComparison deductionData={taxData.deductionComparison} accountType={accountType} />

      {/* Monthly Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Income & Tax Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" />
                <Bar dataKey="tax" name="Tax" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tax Year</span>
              <span className="font-medium">{taxData.year}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-medium">{accountType}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Standard Deduction</span>
              <span className="font-medium">${taxData.standardDeduction.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Itemized Deductions</span>
              <span className="font-medium">
                ${taxData.itemizedDeductions.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-medium">${taxData.totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 