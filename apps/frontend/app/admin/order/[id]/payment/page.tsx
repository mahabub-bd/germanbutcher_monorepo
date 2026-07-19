"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
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
import { Order } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

export default function AddOrderPaymentPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentMethodId: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [orderData, methodsData] = await Promise.all([
          fetchProtectedData<Order>(`orders/${orderId}`).then((res) => res),
          fetchProtectedData<PaymentMethod[]>("order-payment-methods"),
        ]);

        setOrder(orderData);
        setPaymentMethods(methodsData);

        const remainingAmount = orderData.totalValue - orderData.paidAmount;
        form.setValue("amount", remainingAmount.toFixed(2));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load order data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [orderId, form, toast]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      setSubmitting(true);

      const paymentData = {
        orderId: Number(orderId),
        amount: Number.parseFloat(data.amount),
        paymentMethodId: data.paymentMethodId,
        notes: data.notes,
      };

      await postData(`orders/payments`, paymentData);

      toast.success("Payment has been recorded successfully");
      router.push(`/admin/orders`);
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingIndicator message="Loading Payment" />;
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Order not found</p>
      </div>
    );
  }

  const remainingAmount = order.totalValue - order.paidAmount;

  return (
    <div className=" mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Add Payment"
          description={`For Order #${
            order.orderNo
          } | Remaining: ${formatCurrencyEnglish(remainingAmount)}`}
        />
        <Button variant="default" asChild>
          <Link href={`/admin/order/${orderId}/payments`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
            Back to payment
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter the payment details for this order
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1  gap-6">
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
                        disabled={submitting}
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
            </div>

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
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/order/${orderId}/payments`)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Processing..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
