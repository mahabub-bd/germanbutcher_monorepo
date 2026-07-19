"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { fetchData, patchData, postData } from "@/utils/api-utils";
import type { MenuItem } from "@/utils/types";
import { useRouter } from "next/navigation";
import { Section } from "../helper";
import { menuSchema } from "@/utils/form-validation";



type MenuFormValues = z.infer<typeof menuSchema>;

interface MenuFormProps {
  mode: "create" | "edit";
  menuItem?: MenuItem;
}

export function MenuForm({ mode, menuItem }: MenuFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentMenuItems, setParentMenuItems] = useState<MenuItem[]>([]);
  const router = useRouter();

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: menuItem?.name || "",
      url: menuItem?.url || "",
      icon: menuItem?.icon || "",
      parentId: menuItem?.parentId || null,
      order: menuItem?.order || 0,
      isMainMenu: menuItem?.isMainMenu ?? true,
      isActive: menuItem?.isActive ?? true,
      isAdminMenu: menuItem?.isAdminMenu ?? false,
    },
  });

  const isMainMenu = form.watch("isMainMenu");
  const isAdminMenu = form.watch("isAdminMenu");

  useEffect(() => {
    const fetchParentMenuItems = async () => {
      try {
        const endpoint = isAdminMenu
          ? "menu/main?isAdminMenu=true"
          : "menu/main?isAdminMenu=false";
        const response = await fetchData<MenuItem[]>(endpoint);
        const filteredItems =
          mode === "edit"
            ? response.filter((item) => item.id !== menuItem?.id)
            : response;
        setParentMenuItems(filteredItems);
      } catch (error) {
        console.error("Error fetching parent menu items:", error);
        toast.error("Failed to load parent menu items");
      }
    };

    fetchParentMenuItems();
  }, [mode, menuItem?.id, isAdminMenu]);

  const handleSubmit = async (data: MenuFormValues) => {
    setIsSubmitting(true);

    try {
      const menuData = {
        ...data,
        parentId: data.isMainMenu ? null : data.parentId || null,
      };

      const endpoint = mode === "create" ? "menu" : `menu/${menuItem?.id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, menuData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Menu item created successfully"
            : "Menu item updated successfully";
        toast.success(successMessage);
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting menu form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left Column - Basic Information */}
          <div className="p-6 space-y-6">
            <Section title="Basic Information">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Menu Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter menu name"
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
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter URL (e.g., /about)"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    Icon (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter icon name (e.g., home)"
                      {...field}
                      value={field.value || ""}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Enter display order"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value) || 0)
                      }
                      value={field.value}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isAdminMenu"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-4 ">
                    <div>
                      <p className="font-medium text-gray-900">Admin Menu</p>
                      <p className="text-sm text-gray-500">
                        Toggle to set as admin menu item
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="isMainMenu"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-4 ">
                    <div>
                      <p className="font-medium text-gray-900">Main Menu</p>
                      <p className="text-sm text-gray-500">
                        Toggle to set as main menu or sub-menu
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              {!isMainMenu && (
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Parent Menu
                      </FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(Number.parseInt(value) || null)
                        }
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select parent menu" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parentMenuItems.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}
                            >
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-4 ">
                    <div>
                      <p className="font-medium text-gray-900">Active Status</p>
                      <p className="text-sm text-gray-500">
                        Menu item will be visible to users
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "create" ? "Create Menu Item" : "Update Menu Item"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
