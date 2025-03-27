import { Suspense } from "react";
import { BarLoader } from "react-spinners";
import { TaxCalculator } from "./_components/tax-calculator";

export default function TaxPage() {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Tax Calculator
        </h1>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TaxCalculator />
      </Suspense>
    </div>
  );
} 