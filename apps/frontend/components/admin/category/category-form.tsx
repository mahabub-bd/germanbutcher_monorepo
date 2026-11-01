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
import { Textarea } from "@/components/ui/textarea";
import {
  fetchDataPagination,
  formPostData,
  patchData,
  postData,
} from "@/utils/api-utils";
import type { Category } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const categorySchema = z
  .object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().min(1, "Description is required"),
    isActive: z.boolean(),
    isMainCategory: z.boolean(),
    parentId: z.number().nullable().optional(),
    imageUrl: z.string().optional(),
    order: z.number().min(0, "Order must be 0 or greater"),
  })
  .refine((data) => !(data.isMainCategory && data.parentId), {
    path: ["parentId"],
    error: "Main category cannot have a parent"
  });

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  mode: "create" | "edit";
  category?: Category;
}

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(
    category?.attachment?.url || ""
  );
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const router = useRouter();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      isActive: category?.isActive ?? true,
      isMainCategory: category?.isMainCategory ?? false,
      parentId: category?.parentId || null,
      imageUrl: category?.attachment?.url || "",
      order: category?.order ?? 0,
    },
  });

  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        let url = "categories?sMainCategory=true";
        if (mode === "edit" && category) {
          url += `&excludeId=${category.id}`;
        }
        const response = await fetchDataPagination<{
          data: Category[];
          total: number;
          totalPages: number;
        }>(url);
        setParentCategories(response.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load parent categories");
      }
    };

    fetchParentCategories();
  }, [mode, category]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);

    const fileUrl = URL.createObjectURL(selectedFile);
    setImagePreview(fileUrl);

    form.setValue("imageUrl", "");
  };

  const handleSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);

    try {
      let attachmentId = category?.attachment?.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData<{ id: number }>("attachment", formData);
        attachmentId = result.data!.id;
      }

      const categoryData = {
        ...data,
        parentId: data.isMainCategory ? null : data.parentId,
        attachment: attachmentId,
      };

      const endpoint =
        mode === "create" ? "categories" : `categories/${category?.id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, categoryData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Category created successfully"
            : "Category updated successfully";
        toast.success(successMessage);
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      toast.error(
        mode === "create"
          ? error instanceof Error
            ? `${error.message}`
            : "Failed to create category"
          : error instanceof Error
            ? `${error.message}`
            : "Failed to update category"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith("http")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 w-full">
        {/* Category details */}
        <FormSection
          title="Category details"
          description="Name, ordering and the description shown on the storefront."
        >
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Category name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Fresh Meat"
                      {...field}
                      className="w-full flex-1"
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
                      placeholder="0 (lower shows first)"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value || 0}
                      className="w-full flex-1 tabular-nums"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter category description"
                    className="w-full min-h-16 resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Logo, hierarchy & visibility */}
        <FormSection
          title="Logo & visibility"
          description="The category image, its place in the hierarchy and whether it is live."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Category image</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      {imagePreview ? (
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-muted/20">
                          <Image
                            src={imagePreview}
                            alt="Category preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document
                              .getElementById("category-upload")
                              ?.click()
                          }
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose image
                        </Button>
                        <p className="break-all text-xs text-muted-foreground">
                          {fileName || "PNG or JPG recommended"}
                        </p>
                      </div>
                      <Input
                        id="category-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <SwitchRow
                    label="Active"
                    hint="Category is visible to customers"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="isMainCategory"
                render={({ field }) => (
                  <SwitchRow
                    label="Main category"
                    hint="Top-level category without a parent"
                    checked={field.value}
                    onChange={(checked) => {
                      field.onChange(checked);
                      if (checked) form.setValue("parentId", null);
                    }}
                  />
                )}
              />

              {!form.watch("isMainCategory") && (
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Parent category</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(
                            value === "null" ? null : Number(value)
                          )
                        }
                        value={field.value?.toString() ?? "null"}
                      >
                        <FormControl className="w-full">
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select parent category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-full">
                          <SelectItem value="null">
                            Top Level Category
                          </SelectItem>
                          {parentCategories.map((cat) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id.toString()}
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </FormSection>

        <div className="sticky bottom-2 flex flex-col-reverse items-stretch gap-2 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end">
          <p className="mr-auto hidden text-xs text-muted-foreground lg:block">
            The category appears on the storefront immediately after saving.
          </p>
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
            {mode === "create" ? "Create category" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** A bordered card that groups related fields under a titled header, so the
 *  form reads as distinct sections instead of one long grid. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="border-b px-3.5 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-3 p-3.5">{children}</div>
    </section>
  );
}

/** Toggle rendered as a full-width row: label + hint on the left, switch on
 *  the right. Clicking anywhere on the row flips the switch. */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
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
