"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { patchData, postData } from "@/utils/api-utils";
import type { PaymentMethod } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const paymentMethodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().min(3, "Code must be at least 3 characters"),
  isActive: z.boolean(),
  description: z.string().min(1, "Description is required"),
});

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function PaymentMethodForm({
  paymentMethod,
  mode,
  onSuccess,
}: PaymentMethodFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: paymentMethod?.name || "",
      code: paymentMethod?.code || "",
      isActive: paymentMethod?.isActive ?? true,
      description: paymentMethod?.description || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof paymentMethodSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("order-payment-methods", values);
        toast.success("Payment method created successfully");
      } else if (mode === "edit" && paymentMethod) {
        await patchData(`order-payment-methods/${paymentMethod.id}`, {
          ...values,
          id: paymentMethod.id,
        });
        toast.success("Payment method updated successfully");
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? "Failed to create payment method. Please try again."
          : "Failed to update payment method. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 w-full mx-auto">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Method Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter payment method name (e.g. Credit Card)"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Method Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter payment method code (e.g. credit_card)"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter a description of the payment method"
                    {...field}
                    className="w-full min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
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
        </div>

        <div className="flex justify-end space-x-4 pt-2 mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting}
            className="w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-40">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create " : "Update "}
          </Button>
        </div>
      </form>
    </Form>
  );
}
