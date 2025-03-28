"use client";

import { useEffect, useState } from "react";
import { calculateTaxes } from "@/actions/tax";
import { TaxCharts } from "@/components/tax/tax-charts";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TaxCalculator } from "./_components/tax-calculator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function TaxPage() {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxRegime, setTaxRegime] = useState("new");

  const fetchTaxData = async (regime) => {
    try {
      setLoading(true);
      const result = await calculateTaxes(regime);
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

  useEffect(() => {
    fetchTaxData(taxRegime);
  }, [taxRegime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchTaxData(taxRegime)}>Retry</Button>
      </div>
    );
  }

  if (!taxData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No tax data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Tax Calculator
        </h1>
      </div>

      {/* Tax Regime Selector */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Tax Regime</h2>
        <div className="flex flex-col space-y-4">
          <RadioGroup
            value={taxRegime}
            onValueChange={setTaxRegime}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="flex flex-col">
                <span className="font-medium">New Tax Regime</span>
                <span className="text-sm text-gray-600">
                  Lower tax rates but no major deductions (except ₹75,000 standard deduction)
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="old" id="old" />
              <Label htmlFor="old" className="flex flex-col">
                <span className="font-medium">Old Tax Regime</span>
                <span className="text-sm text-gray-600">
                  Higher tax rates but with full deductions (₹50,000 standard deduction + other deductions)
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      {/* Account Type Info */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Type</h2>
        <p className="text-gray-600">
          Tax rules vary based on account type
        </p>
        <div className="mt-2">
          <Label className="font-medium">{taxData.accountType}</Label>
          {taxData.accountType === "CURRENT" && (
            <p className="text-sm text-gray-600 mt-1">
              Current accounts do not qualify for standard deduction. Only itemized deductions will be considered for tax purposes.
            </p>
          )}
        </div>
      </Card>

      {/* Tax Charts */}
      <TaxCharts taxData={taxData} />

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">
            ₹{taxData.totalIncome.toLocaleString('en-IN')}
          </p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Deductions</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₹{taxData.totalDeductions.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {taxData.deductionTypeUsed} Deductions
          </p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Taxable Income</h3>
          <p className="text-2xl font-bold text-purple-600">
            ₹{taxData.taxableIncome.toLocaleString('en-IN')}
          </p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Tax Owed</h3>
          <p className="text-2xl font-bold text-red-600">
            ₹{taxData.taxOwed.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Effective Rate: {taxData.effectiveTaxRate}%
          </p>
        </Card>
      </div>

      {/* Deduction Comparison */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Deduction Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Standard Deduction</h3>
            <p className="text-2xl font-bold text-blue-600">
              ₹{taxData.deductionComparison.standard.amount.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {taxData.deductionComparison.standard.description}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Itemized Deductions</h3>
            <p className="text-2xl font-bold text-green-600">
              ₹{taxData.deductionComparison.itemized.amount.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {taxData.deductionComparison.itemized.description}
            </p>
            {taxData.deductionComparison.itemized.breakdown && (
              <div className="mt-2">
                {Object.entries(taxData.deductionComparison.itemized.breakdown).map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-600">{category}</span>
                    <span>₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Original Tax Calculator Component */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Detailed Tax Breakdown</h2>
        <TaxCalculator />
      </div>
    </div>
  );
} 