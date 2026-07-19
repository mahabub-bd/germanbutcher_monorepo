"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { fetchProtectedData, patchData, postData } from "@/utils/api-utils";
import { deliveryManSchema } from "@/utils/form-validation";
import type { DeliveryMan } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface DeliveryManFormProps {
  deliveryMan?: DeliveryMan;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function DeliveryManForm({
  deliveryMan,
  mode,
  onSuccess,
}: DeliveryManFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof deliveryManSchema>>({
    resolver: zodResolver(deliveryManSchema),
    defaultValues: {
      name: deliveryMan?.name || "",
      mobileNumber: deliveryMan?.mobileNumber || "+880",
      isActive: deliveryMan?.isActive ?? true,
    },
  });

  const onSubmit = async (values: z.infer<typeof deliveryManSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("delivery-man", values);
        toast.success("Delivery man created successfully");
      } else if (mode === "edit" && deliveryMan) {
        await patchData(`delivery-man/${deliveryMan.id}`, values);
        toast.success("Delivery man updated successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(
        error.message ||
          (mode === "create"
            ? "Failed to create delivery man. Please try again."
            : "Failed to update delivery man. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === "create" ? "Create New Delivery Man" : "Edit Delivery Man"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Add a new delivery person to the system"
              : "Update delivery man information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter full name"
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
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+880"
                          {...field}
                          className="w-full"
                          onChange={(e) => {
                            const input = e.target.value.replace(/[^0-9+]/g, "");
                            if (!input.startsWith("+880")) {
                              field.onChange(
                                `+880${input.replace(/^\+?880?/, "")}`
                              );
                            } else {
                              field.onChange(input);
                            }
                          }}
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0 col-span-1 sm:col-span-2">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Only active delivery men can be assigned to orders
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

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSuccess}
                  disabled={isSubmitting}
                  className="w-24"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-32">
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {mode === "create" ? "Create" : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
