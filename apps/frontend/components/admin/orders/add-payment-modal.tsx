"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyEnglish } from "@/lib/utils";
import { fetchProtectedData, postData } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  description: string;
}

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  paymentMethodId: z.number().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface AddPaymentModalProps {
  orderId: Order["id"] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function AddPaymentModal({
  orderId,
  open,
  onOpenChange,
  onUpdated,
}: AddPaymentModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentMethodId: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open || orderId === null) return;

    const loadPaymentData = async () => {
      setIsLoading(true);
      setOrder(null);
      try {
        const [orderData, methodsData] = await Promise.all([
          fetchProtectedData<Order>(`orders/${orderId}`),
          fetchProtectedData<PaymentMethod[]>("order-payment-methods"),
        ]);
        setOrder(orderData);
        setPaymentMethods(methodsData);

        const remainingAmount = orderData.totalValue - orderData.paidAmount;
        form.reset({
          amount: remainingAmount.toFixed(2),
          paymentMethodId: undefined,
          notes: "",
        });
      } catch (error) {
        console.error("Error loading order for payment:", error);
        toast.error("Failed to load order details.");
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentData();
  }, [open, orderId, onOpenChange, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      setIsSubmitting(true);

      await postData(`orders/payments`, {
        orderId: Number(orderId),
        amount: Number.parseFloat(data.amount),
        paymentMethodId: data.paymentMethodId,
        notes: data.notes,
      });

      toast.success("Payment has been recorded successfully");
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingAmount = order ? order.totalValue - order.paidAmount : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle>
            Add Payment{order ? ` #${order.orderNo}` : ""}
          </DialogTitle>
          <DialogDescription>
            Record a payment for this order.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="py-14">
              <LoadingIndicator message="Loading payment details..." />
            </div>
          ) : order ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 p-6"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Remaining balance:{" "}
                        {formatCurrencyEnglish(remainingAmount)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl className="w-full">
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : undefined
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Payment Method" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method: PaymentMethod) => (
                              <SelectItem
                                key={method?.id}
                                value={method?.id.toString()}
                              >
                                {method?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional notes about this payment"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Record Payment"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
