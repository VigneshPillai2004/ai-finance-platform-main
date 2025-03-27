"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, InfoIcon } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const {
    loading: createAccountLoading,
    fn: createAccountFn,
    error,
    data: newAccount,
  } = useFetch(createAccount);

  const onSubmit = async (data) => {
    await createAccountFn({
      ...data,
      balance: parseFloat(data.balance),
    });
  };

  useEffect(() => {
    if (newAccount) {
      toast.success("Account created successfully");
      form.reset();
      setOpen(false);
    }
  }, [newAccount, form]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create account");
    }
  }, [error]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Create a new account</DrawerTitle>
            <DrawerDescription>
              Add a new bank account to track your finances.
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4 pt-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Checking Account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Account Type
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Account Types & Tax Implications</h4>
                            <div className="text-xs space-y-1">
                              <p className="font-medium">Savings Account:</p>
                              <p>• Qualifies for standard deduction (₹75,000 for income up to ₹10L)</p>
                              <p>• Can choose between standard & itemized deductions</p>
                              <p>• Better for personal use and tax benefits</p>
                              
                              <p className="font-medium mt-2">Current Account:</p>
                              <p>• No standard deduction available</p>
                              <p>• Only uses itemized deductions</p>
                              <p>• Better for business expenses with high deduction rates</p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </FormLabel>
                    <FormControl>
                      <Select 
                        defaultValue={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CURRENT">
                            <div className="flex flex-col">
                              <span>Current Account</span>
                              <span className="text-xs text-muted-foreground">
                                For business use, no standard deduction
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="SAVINGS">
                            <div className="flex flex-col">
                              <span>Savings Account</span>
                              <span className="text-xs text-muted-foreground">
                                For personal use, eligible for standard deduction
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      This affects how your transactions are taxed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Balance</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0.00" 
                        type="number" 
                        step="0.01"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Default Account</FormLabel>
                      <FormDescription>
                        Make this your primary account
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0">
                <Button type="submit" disabled={createAccountLoading}>
                  {createAccountLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
