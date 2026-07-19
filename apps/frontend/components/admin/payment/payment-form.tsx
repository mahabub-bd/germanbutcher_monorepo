"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchData, postData } from "@/utils/api-utils";
import { paymentSchema } from "@/utils/form-validation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Section } from "../helper";

interface PaymentMethod {
  id: number;
  name: string;
}

type PaymentFormValues = z.output<typeof paymentSchema>;

interface PaymentFormProps {
  purchaseId: number;
  maxAmount: number;
}

export function PaymentForm({ purchaseId, maxAmount }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetchData("payment-methods");
        if (response && Array.isArray(response)) {
          setPaymentMethods(response);
        } else {
          console.error("Unexpected response format for payment methods");
          toast.error("Failed to load payment methods");
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast.error("Failed to load payment methods");
      } finally {
        setIsLoadingMethods(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema) as Resolver<PaymentFormValues>,
    defaultValues: {
      amount: maxAmount,
      paymentDate: new Date(),
      paymentMethodId: 1,
      referenceNumber: "",
      notes: "",
    },
  });

  const handleSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);

    try {
      const paymentData = {
        purchaseId,
        ...data,
        paymentDate: data.paymentDate.toISOString(),
      };

      const response = await postData("payments", paymentData);

      if (response?.statusCode === 201) {
        toast.success("Payment added successfully");
        router.push(`/admin/purchase/${purchaseId}/payments`);
      } else {
        toast.error(response?.message || "Failed to add payment");
      }
    } catch (error) {
      console.error("Error submitting payment form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-6 space-y-6">
          <Section title="Payment Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        min="0.01"
                        max={maxAmount}
                        step="0.01"
                        className="w-full"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Maximum payable: {maxAmount.toFixed(2)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date Field */}
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full">
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDateTime(field.value.toISOString())
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 z-50 bg-white border rounded-md"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method Field */}

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

              {/* Reference Number Field */}
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter reference number"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes"
                      className="min-h-25 w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingMethods}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Add Payment"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
