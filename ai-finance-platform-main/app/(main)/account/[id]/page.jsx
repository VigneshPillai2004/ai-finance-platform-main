import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account";
import { BarLoader } from "react-spinners";
import { TransactionTable } from "../_components/transaction-table";
import { notFound } from "next/navigation";
import { AccountChart } from "../_components/account-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InfoIcon, TrendingUp, TrendingDown, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AccountPage({ params }) {
  const accountData = await getAccountWithTransactions(params.id);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;
  
  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(transaction => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
    
  const totalExpenses = transactions
    .filter(transaction => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  
  const isSavingsAccount = account.type === "SAVINGS";
  const typeLabel = account.type.charAt(0) + account.type.slice(1).toLowerCase();
  const typeBadgeColor = isSavingsAccount ? "bg-green-500" : "bg-blue-500";

  return (
    <div className="space-y-8 px-5">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize">
            {account.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className={`${typeBadgeColor} text-white`}
            >
              {typeLabel}
            </Badge>
            <p className="text-muted-foreground">
              {account._count.transactions} Transactions
            </p>
          </div>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${parseFloat(account.balance).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground flex gap-2 justify-end">
            <span className="text-green-500">+${totalIncome.toFixed(2)}</span>
            <span className="text-red-500">-${totalExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tax Information Card */}
      <Card className={`border-l-4 ${isSavingsAccount ? "border-l-green-500" : "border-l-blue-500"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5" />
            Tax Information
          </CardTitle>
          <CardDescription>
            {isSavingsAccount 
              ? "This account qualifies for standard deduction on your taxes."
              : "This account uses only itemized deductions for tax purposes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Account Type</h3>
              <p className="text-sm flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {isSavingsAccount ? "Savings Account" : "Current Account"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSavingsAccount 
                  ? "Typically used for personal finances" 
                  : "Typically used for business finances"}
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Standard Deduction</h3>
              <p className="text-sm flex items-center gap-1">
                {isSavingsAccount 
                  ? <TrendingUp className="h-4 w-4 text-green-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />}
                {isSavingsAccount 
                  ? "Eligible (₹75,000 for income up to ₹10L)" 
                  : "Not Eligible"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSavingsAccount 
                  ? "Can choose between standard or itemized" 
                  : "Must use itemized deductions only"}
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-medium text-sm">Recommended For</h3>
              <p className="text-sm">
                {isSavingsAccount 
                  ? "Salary, personal expenses, investments" 
                  : "Business income, business expenses"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSavingsAccount 
                  ? "Tax benefits on personal income" 
                  : "Higher deduction rates on business expenses"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transactions Table */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
