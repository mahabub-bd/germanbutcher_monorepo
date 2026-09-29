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
import type { ShippingMethod } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const shippingMethodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  cost: z.string().min(1, "Cost is required"),
  isActive: z.boolean(),
  requiresOnlinePayment: z.boolean(),
  isExcludedFromFreeDelivery: z.boolean(),
  displayOrder: z.string().min(1, "Display order is required"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  description: z.string().min(1, "Description is required"),
});

interface ShippingMethodFormProps {
  shippingMethod?: ShippingMethod;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function ShippingMethodForm({
  shippingMethod,
  mode,
  onSuccess,
}: ShippingMethodFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof shippingMethodSchema>>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: {
      name: shippingMethod?.name || "",
      cost: shippingMethod?.cost || "",
      isActive: shippingMethod?.isActive ?? true,
      requiresOnlinePayment: shippingMethod?.requiresOnlinePayment ?? false,
      isExcludedFromFreeDelivery:
        shippingMethod?.isExcludedFromFreeDelivery ?? false,
      displayOrder: String(shippingMethod?.displayOrder ?? 0),
      deliveryTime: shippingMethod?.deliveryTime || "",
      description: shippingMethod?.description || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof shippingMethodSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("shipping-methods", values);
        toast.success("Shipping method created successfully");
      } else if (mode === "edit" && shippingMethod) {
        await patchData(`shipping-methods/${shippingMethod.id}`, values);
        toast.success("Shipping method updated successfully");
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? "Failed to create shipping method. Please try again."
          : "Failed to update shipping method. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mx-auto">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Method Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter shipping method name (e.g. Standard Shipping)"
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
            name="cost"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter cost (e.g. 10.99)"
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
            name="deliveryTime"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Delivery Time</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter delivery time (e.g. 3-5 business days)"
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
            name="displayOrder"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Lower numbers show first (e.g. 1)"
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
              <FormItem className="space-y-2 md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter a description of the shipping method"
                    {...field}
                    className="w-full min-h-[64px]"
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border px-3 py-2.5 space-y-0">
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

          <FormField
            control={form.control}
            name="requiresOnlinePayment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border px-3 py-2.5 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel>Online Payment Only</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Cash on delivery is rejected for this method
                  </p>
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

          <FormField
            control={form.control}
            name="isExcludedFromFreeDelivery"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border px-3 py-2.5 space-y-0 md:col-span-2">
                <div className="space-y-0.5">
                  <FormLabel>Exclude from Free Delivery</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Free delivery campaigns never waive this method&apos;s cost
                    (e.g. express delivery)
                  </p>
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

        <div className="flex justify-end space-x-3 pt-1 mx-auto">
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
