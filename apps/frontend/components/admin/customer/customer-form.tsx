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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchProtectedData, patchData, postData } from "@/utils/api-utils";
import { userSchema } from "@/utils/form-validation";
import { Role, User } from "@/utils/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface UserFormProps {
  user?: User;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function CustomerForm({ user, mode, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",

      mobileNumber: user?.mobileNumber || "+880",
      roleId: user?.role?.id.toString(),
      isVerified: user?.isVerified || false,
    },
  });
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetchProtectedData<Role[]>("roles");

        setRoles(response);
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    };

    fetchRoles();
  }, []);

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("users", values);
      } else if (mode === "edit" && user) {
        const payload = { ...values };

        await patchData(`users/${user.id}`, payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? "Failed to create user. Please try again."
          : "Failed to update user. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name"
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
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email"
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
              name="roleId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === "edit"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.map((role: Role) => (
                        <SelectItem
                          className=" capitalize"
                          key={role.id}
                          value={role.id.toString()}
                        >
                          {role?.rolename}
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
              name="isVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel>Verified Status</FormLabel>
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
        </div>
        <div className="flex justify-end space-x-4 pt-2">
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
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create User" : "Update "}
          </Button>
        </div>
      </form>
    </Form>
  );
}
