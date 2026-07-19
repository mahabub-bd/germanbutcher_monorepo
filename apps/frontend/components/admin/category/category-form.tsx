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
import { Section } from "../helper";

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
        const result = await formPostData("attachment", formData);
        attachmentId = result.data.id;
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-6 space-y-6">
          <Section title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || 0}
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
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter category description"
                      className="min-h-25"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Media">
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>Category Image</FormLabel>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        {imagePreview ? (
                          <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50">
                            <Image
                              src={imagePreview}
                              alt="Category preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-32 h-32 border rounded-md bg-muted/20">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById("category-upload")
                                ?.click()
                            }
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {fileName || "No file chosen"}
                          </span>
                        </div>
                      </div>
                      <Input
                        id="category-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Status & Hierarchy">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <SwitchCard
                      label="Active Status"
                      description="Category will be visible to customers"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="isMainCategory"
                  render={({ field }) => (
                    <SwitchCard
                      label="Main Category"
                      description="Mark as top-level main category"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue("parentId", null);
                        }
                      }}
                    />
                  )}
                />

                {!form.watch("isMainCategory") && (
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(
                              value === "null" ? null : Number(value)
                            )
                          }
                          value={field.value?.toString() ?? "null"}
                          disabled={form.watch("isMainCategory")}
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
            </Section>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "create" ? "Create Category" : "Update Category"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const SwitchCard = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);
