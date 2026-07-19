"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { patchData, postData } from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import { Address } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const addressSchema = z.object({
  address: z.string().min(1, "Address is required").trim(),
  area: z.string().min(1, "Area is required").trim(),
  division: z.string().min(1, "Division is required"),
  city: z.string().min(1, "City is required").trim(),
  type: z.enum(["shipping", "billing"], {
      error: (issue) => issue.input === undefined ? "Please select an address type" : undefined
}),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressDialogProps {
  userId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  address?: Address | null;
  mode: "add" | "edit";
  onSuccess?: () => void;
}

const bangladeshDivisions = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rajshahi",
  "Rangpur",
  "Mymensingh",
] as const;

export default function AddressDialog({
  userId,
  open,
  setOpen,
  address,
  mode,
  onSuccess,
}: AddressDialogProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: "",
      area: "",
      division: "",
      city: "",
      type: "shipping",
      isDefault: false,
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && address) {
        form.reset({
          address: address.address || "",
          area: address.area || "",
          division: address.division || "",
          city: address.city || "",
          type:
            address.type === "shipping" || address.type === "billing"
              ? address.type
              : "shipping",
          isDefault: address.isDefault || false,
        });
      } else {
        form.reset({
          address: "",
          area: "",
          division: "",
          city: "",
          type: "shipping",
          isDefault: false,
        });
      }
    }
  }, [open, mode, address, form]);

  const onSubmit = async (data: AddressFormData) => {
    try {
      if (mode === "edit" && address) {
        await patchData(`addresses/${address.id}`, data);

        toast.success("Address updated successfully");
        serverRevalidate(`/user/${userId}/addresses`);
      } else {
        await postData("addresses", data);

        toast.success("Address added successfully");
        serverRevalidate(`/user/${userId}/addresses`);
      }

      if (onSuccess) {
        onSuccess();
      }

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving address:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      toast.error(
        mode === "edit"
          ? `Failed to update address: ${errorMessage}`
          : `Failed to add address: ${errorMessage}`
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-w-[90%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Area <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your area" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      City <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="division"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Division <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bangladeshDivisions.map((division) => (
                          <SelectItem key={division} value={division}>
                            {division}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Address Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select address type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="shipping">
                          Shipping Address
                        </SelectItem>
                        <SelectItem value="billing">Billing Address</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="w-full flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <FormLabel className="text-sm font-medium cursor-pointer mb-0">
                      Set as default address
                    </FormLabel>
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

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "edit" ? "Update Address" : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
