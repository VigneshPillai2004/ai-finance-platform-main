"use client";

import { ArrowUpRight, ArrowDownRight, CreditCard, InfoIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault, _count } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault(); // Prevent navigation

    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return; // Don't allow toggling off the default account
    }

    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  const isSavingsAccount = type === "SAVINGS";
  const typeLabel = type.charAt(0) + type.slice(1).toLowerCase();
  const typeBadgeColor = isSavingsAccount ? "bg-green-500" : "bg-blue-500";

  return (
    <Card className="hover:shadow-md transition-shadow group relative bg-card/50 backdrop-blur-sm border-border/50">
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium capitalize text-foreground">
              {name}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className={`${typeBadgeColor} text-white`}
            >
              {typeLabel}
            </Badge>
          </div>
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${parseFloat(balance).toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">
              {_count?.transactions || 0} Transactions
            </span>
            <HoverCard>
              <HoverCardTrigger asChild>
                <InfoIcon className="h-3 w-3 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="w-72">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Tax Information</h4>
                  {isSavingsAccount ? (
                    <div className="text-xs space-y-1.5">
                      <p>✓ Eligible for standard deduction (₹75,000 for income up to ₹10L)</p>
                      <p>✓ Can choose between standard & itemized deductions</p>
                      <p>✓ Better for personal expenses</p>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1.5">
                      <p>✓ Uses only itemized deductions</p>
                      <p>✓ No standard deduction available</p>
                      <p>✓ Better for business expenses</p>
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
