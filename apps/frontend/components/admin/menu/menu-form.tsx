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
import { cn } from "@/lib/utils";
import { fetchData, patchData, postData } from "@/utils/api-utils";
import { menuSchema } from "@/utils/form-validation";
import type { MenuItem } from "@/utils/types";
import { useRouter } from "next/navigation";

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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormSection
          title="Menu item"
          description="The label and destination shown for this entry."
        >
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Menu name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter menu name"
                      className="flex-1"
                      {...field}
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
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. /about"
                      className="flex-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Icon (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. home"
                      className="flex-1"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 (lower shows first)"
                      className="flex-1"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection
          title="Placement & visibility"
          description="Control where the item appears and whether it is active."
        >
          <FormField
            control={form.control}
            name="isAdminMenu"
            render={({ field }) => (
              <SwitchRow
                label="Admin menu"
                hint="Show this entry in the admin navigation"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <FormField
            control={form.control}
            name="isMainMenu"
            render={({ field }) => (
              <SwitchRow
                label="Main menu"
                hint="Top-level item; turn off to nest under a parent"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {!isMainMenu && (
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Parent menu</FormLabel>
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
                        <SelectItem key={item.id} value={item.id.toString()}>
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
              <SwitchRow
                label="Active"
                hint="Item is visible to users"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormSection>

        <div className="sticky bottom-2 flex flex-col-reverse items-stretch gap-2 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create menu item" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Bordered card with a titled header — shared admin form convention. */
function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-xs",
        className
      )}
    >
      <div className="border-b px-3.5 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-1 space-y-3 p-3.5">{children}</div>
    </section>
  );
}

/** Clickable full-width toggle row. */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  className,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={(event) => event.stopPropagation()}
        className="shrink-0"
      />
    </div>
  );
}
