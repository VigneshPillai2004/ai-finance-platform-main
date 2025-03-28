"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon, InfoIcon, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Display names for deduction categories
const DEDUCTION_CATEGORY_NAMES = {
  "mortgage-interest": "Mortgage Interest",
  "state-local-taxes": "State & Local Taxes",
  "medical-expenses": "Medical Expenses",
  "charitable-donations": "Charitable Donations",
  "education-expenses": "Education Expenses",
  "business-expenses": "Business Expenses",
  "other-deductions": "Other Deductions",
};

// Colors for pie chart
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00C49F",
  "#FFBB28",
];

function formatDeductionCategory(category) {
  if (!category) return "Unknown";
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function DeductionComparison({ deductionData, accountType }) {
  const [activeTab, setActiveTab] = useState("comparison");
  
  if (!deductionData) return null;
  
  const { 
    standard, 
    itemized, 
    difference, 
    mappingDetails,
    transactions,
    categorySummary 
  } = deductionData;
  
  const standardDeductionInfo = accountType === 'SAVINGS' 
    ? "Based on your income level, you qualify for a standard deduction for savings accounts."
    : accountType === 'CURRENT'
    ? "Current accounts do not qualify for standard deduction under tax rules."
    : "Standard deduction based on default tax rules.";

  const deductionDifference = difference;
  const deductionPercentage = Math.max(
    Math.min(
      Math.round((Math.max(standard.amount, itemized.amount) / 
      (Math.max(standard.amount, itemized.amount) + deductionDifference)) * 100), 
      95
    ), 
    5
  );
  
  // Format itemized deduction data for pie chart
  const pieData = Object.entries(itemized.breakdown).map(([key, value], index) => ({
    name: DEDUCTION_CATEGORY_NAMES[key] || key,
    value: parseFloat(value.toFixed(2)),
    color: COLORS[index % COLORS.length],
  })).filter(item => item.value > 0);
  
  return (
    <Tabs defaultValue="comparison" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="comparison">Deduction Comparison</TabsTrigger>
        <TabsTrigger value="itemized">Itemized Details</TabsTrigger>
        <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
        <TabsTrigger value="categories">Category Summary</TabsTrigger>
      </TabsList>
      
      <TabsContent value="comparison">
        <Card>
          <CardHeader>
            <CardTitle>Deduction Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between mb-2">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Standard Deduction
                </p>
                <p className="text-sm text-muted-foreground">
                  {standardDeductionInfo}
                </p>
              </div>
              <div className="font-bold">₹{standard.amount.toLocaleString('en-IN')}</div>
            </div>

            <Progress 
              value={standard.amount > itemized.amount ? deductionPercentage : 100 - deductionPercentage}
              className="h-2" 
            />

            <div className="flex justify-between mt-2">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Itemized Deductions
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on your eligible expenses
                </p>
              </div>
              <div className="font-bold">₹{itemized.amount.toLocaleString('en-IN')}</div>
            </div>

            <Alert className={
              standard.amount > itemized.amount ? "bg-blue-50" : "bg-green-50"
            }>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>
                {standard.amount > itemized.amount 
                  ? "Using Standard Deduction" 
                  : "Using Itemized Deductions"}
              </AlertTitle>
              <AlertDescription>
                {standard.amount > itemized.amount 
                  ? accountType === 'CURRENT'
                    ? "Although current accounts typically don't qualify for standard deduction, your specific situation allows it."
                    : `Your standard deduction (₹${standard.amount.toLocaleString('en-IN')}) is higher than your itemized deductions (₹${itemized.amount.toLocaleString('en-IN')}).`
                  : accountType === 'CURRENT'
                    ? "Current accounts use itemized deductions, which is ₹" + deductionDifference.toLocaleString('en-IN') + " more beneficial."
                    : `Your itemized deductions (₹${itemized.amount.toLocaleString('en-IN')}) are higher than your standard deduction (₹${standard.amount.toLocaleString('en-IN')}) by ₹${deductionDifference.toLocaleString('en-IN')}.`
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="itemized">
        <Card>
          <CardHeader>
            <CardTitle>Itemized Deduction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deduction Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemized.breakdown && Object.entries(itemized.breakdown).length > 0 ? (
                  Object.entries(itemized.breakdown).map(([category, amount]) => (
                    <TableRow key={category}>
                      <TableCell className="font-medium">
                        {formatDeductionCategory(category)}
                      </TableCell>
                      <TableCell className="text-right">₹{amount.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No itemized deductions available
                    </TableCell>
                  </TableRow>
                )}
                {itemized.breakdown && Object.entries(itemized.breakdown).length > 0 && (
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-medium">₹{itemized.amount.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transactions">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Deduction Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Deductible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{transaction.description}</TableCell>
                      <TableCell>{transaction.deductionCategory ? formatDeductionCategory(transaction.deductionCategory) : 'Not Deductible'}</TableCell>
                      <TableCell className="text-right">₹{Math.abs(transaction.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{transaction.deductibleAmount?.toLocaleString('en-IN') || '0.00'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories">
        <Card>
          <CardHeader>
            <CardTitle>Category Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySummary && Object.keys(categorySummary).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Deductible Amount</TableHead>
                    <TableHead className="text-right">Deduction Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(categorySummary).map(([category, data]) => (
                    <TableRow key={category}>
                      <TableCell>
                        <div className="font-medium">{formatDeductionCategory(category)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDeductionCategory(data.deductionCategory)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{data.transactionCount}</TableCell>
                      <TableCell className="text-right">₹{data.totalAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{data.deductibleAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">{(data.deductionRate * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No category summary data available
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 