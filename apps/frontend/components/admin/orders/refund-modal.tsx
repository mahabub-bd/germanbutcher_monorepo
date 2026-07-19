"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyEnglish } from "@/lib/utils";
import { initiateRefund } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const refundFormSchema = z.object({
  refund_amount: z
    .string()
    .min(1, "Refund amount is required")
    .refine((val) => !isNaN(Number(val)), "Must be a valid number")
    .refine((val) => Number(val) > 0, "Refund amount must be greater than 0"),
  bank_tran_id: z
    .string()
    .min(1, "Bank Transaction ID is required")
    .trim(),
  tran_id: z
    .string()
    .min(1, "SSL Transaction ID is required")
    .trim(),
  refe_id: z
    .string()
    .min(1, "Reference ID is required")
    .trim(),
  refund_remarks: z
    .string()
    .max(500, "Remarks must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type RefundFormValues = z.infer<typeof refundFormSchema>;

interface RefundModalProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RefundModal({
  order,
  open,
  onOpenChange,
  onSuccess,
}: RefundModalProps) {
  // Get first payment if available
  const firstPayment = order.payments?.[0];

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      refund_amount: Number(order.paidAmount).toString(),
      bank_tran_id: "",
      tran_id: "",
      refe_id: "",
      refund_remarks: "",
    },
    mode: "onBlur",
  });

  // Auto-populate bank transaction ID from SSL payment data when modal opens
  useEffect(() => {
    if (open && firstPayment) {
      // bank_tran_id from payment.bankTranId (stored after successful payment)
      if (firstPayment.bankTranId) {
        form.setValue("bank_tran_id", firstPayment.bankTranId);
      }
      // tran_id from payment.sslPaymentId (SSLCommerz transaction ID)
      if (firstPayment.sslPaymentId) {
        form.setValue("tran_id", firstPayment.sslPaymentId);
      }
      // Use payment number as reference ID
      form.setValue("refe_id", firstPayment.paymentNumber || "");
      form.setValue("refund_amount", Number(order.paidAmount).toString());
    }
  }, [open, firstPayment, form, order.paidAmount]);

  const onSubmit = async (data: RefundFormValues) => {
    // Validation - check if payment exists
    if (!firstPayment?.id) {
      toast.error("No payment record found for this order");
      return;
    }

    const refundAmount = Number(data.refund_amount);

    // Additional validation for max amount
    if (refundAmount > Number(order.paidAmount)) {
      form.setError("refund_amount", {
        message: `Refund amount cannot exceed ${formatCurrencyEnglish(Number(order.paidAmount))}`,
      });
      return;
    }

    try {
      const response = await initiateRefund({
        paymentId: firstPayment.id,
        refund_amount: refundAmount,
        refund_remarks: data.refund_remarks?.trim() || undefined,
        bank_tran_id: data.bank_tran_id.trim(),
        tran_id: data.tran_id.trim(),
        refe_id: data.refe_id.trim(),
      });

      if (response.success) {
        toast.success("Refund initiated successfully");
        form.reset();
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(response.message || "Failed to initiate refund");
      }
    } catch (error) {
      console.error("Refund error:", error);
      toast.error("An error occurred while processing the refund");
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const maxRefundable = Number(order.paidAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Initiate a refund for Order #{order.orderNo}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Order Summary */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order No:</span>
                  <span className="font-medium">#{order.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrencyEnglish(maxRefundable)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className="font-medium capitalize">{order.paymentStatus}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="refund_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Amount *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxRefundable}
                        placeholder="Enter refund amount"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum refundable amount:{" "}
                      {formatCurrencyEnglish(maxRefundable)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bank Transaction ID */}
              <FormField
                control={form.control}
                name="bank_tran_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Transaction ID *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter bank transaction ID"
                      />
                    </FormControl>
                    {firstPayment?.bankTranId && (
                      <FormDescription>
                        From payment.bankTranId
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SSL Transaction ID */}
              <FormField
                control={form.control}
                name="tran_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SSL Transaction ID *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter SSL transaction ID"
                      />
                    </FormControl>
                    {firstPayment?.sslPaymentId && (
                      <FormDescription>
                        SSL Payment ID: {firstPayment.sslPaymentId}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reference ID */}
              <FormField
                control={form.control}
                name="refe_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference ID *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter reference ID"
                      />
                    </FormControl>
                    {firstPayment?.paymentNumber && (
                      <FormDescription>
                        Payment Number: {firstPayment.paymentNumber}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Refund Amount */}


            {/* Refund Remarks (Optional) */}
            <FormField
              control={form.control}
              name="refund_remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about this refund..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning Alert */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Refund will be processed to the original payment method</li>
                  <li>Transaction ID and Reference ID must match the payment records</li>
                  <li>Refund processing time depends on your payment provider</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Initiate Refund
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
