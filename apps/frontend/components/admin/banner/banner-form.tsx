"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Loader2, Search, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CategorySelector } from "@/components/admin/banner/category-selector";
import { ProductSelector } from "@/components/admin/discount/product-selector";
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
  fetchData,
  formPostData,
  patchData,
  postData,
} from "@/utils/api-utils";

import { revalidatePublic } from "@/actions/revalidate";
import { cn } from "@/lib/utils";
import { bannerSchema } from "@/utils/form-validation";
import {
  Banner,
  BannerPosition,
  BannerType,
  Category,
  MinimalProduct,
  Product,
} from "@/utils/types";

type BannerFormValues = z.infer<typeof bannerSchema>;

type LinkType = "none" | "product" | "category" | "custom";

// Derive the link picker state from a stored targetUrl.
const parseLinkType = (url: string): LinkType => {
  if (!url) return "none";
  if (url.startsWith("/product/")) return "product";
  if (url.startsWith("/categories/")) return "category";
  return "custom";
};

interface BannerFormProps {
  mode: "create" | "edit";
  banner?: Banner;
}

export function BannerForm({ mode, banner }: BannerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(banner?.image?.url || "");
  const router = useRouter();

  // Link picker state
  const [linkType, setLinkType] = useState<LinkType>(() =>
    parseLinkType(banner?.targetUrl || "")
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  // Product picker: category first, then that category's products (products/all)
  const [pickerCategoryId, setPickerCategoryId] = useState("");
  const [pickerProducts, setPickerProducts] = useState<MinimalProduct[]>([]);
  const [isLoadingPickerProducts, setIsLoadingPickerProducts] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{
    id?: number;
    name: string;
    slug?: string | null;
  } | null>(null);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || "",
      description: banner?.description || "",
      targetUrl: banner?.targetUrl || "",
      position: banner?.position as BannerPosition,
      type: banner?.type as BannerType,
      isActive: banner?.isActive ?? true,
      displayOrder: banner?.displayOrder ?? 0,
      imageUrl: banner?.image?.url || "",
    },
  });

  // Restore the previously picked product/category on edit.
  useEffect(() => {
    const url = banner?.targetUrl || "";
    if (url.startsWith("/product/")) {
      const slug = url.replace("/product/", "");
      fetchData<Product>(`products/slug/${slug}`)
        .then((product) =>
          setSelectedProduct(
            product
              ? { id: product.id, name: product.name, slug: product.slug }
              : null
          )
        )
        .catch(() => { });
    } else if (url.startsWith("/categories/")) {
      const slug = url.replace("/categories/", "");
      fetchData<Category[]>("categories")
        .then((all) => {
          setCategories(all || []);
          setSelectedCategory(
            (all || []).find((c) => c.slug === slug) || null
          );
        })
        .catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load categories for both the category and product pickers.
  useEffect(() => {
    if (
      (linkType !== "category" && linkType !== "product") ||
      categories.length > 0
    ) {
      return;
    }
    setIsLoadingCategories(true);
    fetchData<Category[]>("categories")
      .then((all) => setCategories(all || []))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setIsLoadingCategories(false));
  }, [linkType, categories.length]);

  // Debounced product search via products/all — works with a category
  // chosen (search within it) or without one (search across all products).
  useEffect(() => {
    if (linkType !== "product") return;

    const trimmed = pickerSearch.trim();
    if (!trimmed && !pickerCategoryId) {
      setPickerProducts([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingPickerProducts(true);
      try {
        const params = new URLSearchParams();
        if (pickerCategoryId) params.set("category", pickerCategoryId);
        if (trimmed) params.set("search", trimmed);
        params.set("isActive", "true");

        const fetched = await fetchData<MinimalProduct[]>(
          `products/all?${params.toString()}`
        );
        setPickerProducts(
          Array.isArray(fetched)
            ? [...fetched].sort((a, b) => a.name.localeCompare(b.name))
            : []
        );
      } catch {
        toast.error("Failed to load products");
        setPickerProducts([]);
      } finally {
        setIsLoadingPickerProducts(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pickerCategoryId, pickerSearch, linkType]);

  const handleLinkTypeChange = (type: string) => {
    const next = type as LinkType;
    setLinkType(next);
    if (next === "none") {
      form.setValue("targetUrl", "", { shouldDirty: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);

    const fileUrl = URL.createObjectURL(selectedFile);
    setImagePreview(fileUrl);

    form.setValue("imageUrl", "");
  };

  const handleSubmit = async (data: BannerFormValues) => {
    setIsSubmitting(true);

    try {
      let attachmentId = banner?.image?.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData<{ id: number }>("attachment", formData);
        attachmentId = result.data!.id;
      }

      const bannerData = {
        ...data,
        imageId: attachmentId,
      };

      const endpoint = mode === "create" ? "banners" : `banners/${banner?.id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, bannerData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Banner created successfully"
            : "Banner updated successfully";
        toast.success(successMessage);
        await revalidatePublic();
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting banner form:", error);
      toast.error("An unexpected error occurred");
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Basic Information */}
          <FormSection
            title="Basic information"
            description="The headline and supporting text shown on the banner."
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter banner title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter banner description"
                      className="min-h-16 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Banner Settings */}
          <FormSection
            title="Banner settings"
            description="Where the banner appears and how it is ordered."
          >
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex h-full flex-col gap-1.5">
                    <FormLabel>Banner type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BannerType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() +
                              type.slice(1).toLowerCase()}
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
                name="position"
                render={({ field }) => (
                  <FormItem className="flex h-full flex-col gap-1.5">
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BannerPosition).map((position) => (
                          <SelectItem key={position} value={position}>
                            {position.charAt(0).toUpperCase() +
                              position.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Display order + active status share one row */}
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem className="flex h-full flex-col gap-1.5">
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0 (lower shows first)"
                        className="w-full flex-1"
                        {...field}
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
                  <SwitchRow
                    label="Active"
                    hint="Shown on the storefront right away"
                    checked={field.value ?? false}
                    onChange={field.onChange}
                    className="h-full"
                  />
                )}
              />
            </div>
          </FormSection>

          {/* Link To — full width so the product grid has room */}
          <FormSection
            title="Link to"
            description="Optional destination opened when the banner is clicked."
            className="lg:col-span-2"
          >

            <FormField
              control={form.control}
              name="targetUrl"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    {/* Link type */}
                    <Select value={linkType} onValueChange={handleLinkTypeChange}>
                      <FormControl>
                        <SelectTrigger className="w-full md:flex-1">
                          <SelectValue placeholder="Choose link target" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="custom">Custom URL</SelectItem>
                      </SelectContent>
                    </Select>

                    {linkType === "product" && (
                      <>
                        {/* Product filter */}
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                            placeholder="Filter products..."
                            className="pl-9"
                          />
                        </div>

                        {/* Category */}
                        <Select
                          value={pickerCategoryId}
                          onValueChange={(value) => {
                            setPickerCategoryId(value);
                            setSelectedProduct(null);
                            field.onChange("");
                          }}
                        >
                          <SelectTrigger className="w-full md:flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <SelectValue placeholder="1. Select a category" />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={String(category.id)}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}

                    {linkType === "category" && (
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          placeholder="Filter categories..."
                          className="pl-9"
                        />
                      </div>
                    )}

                    {linkType === "custom" && (
                      <FormControl>
                        <Input
                          placeholder="https://example.com/promo or /recipes"
                          className="flex-1"
                          {...field}
                        />
                      </FormControl>
                    )}
                  </div>

                  {linkType === "category" && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Pick a category to link — single selection only
                      </p>

                      <CategorySelector
                        categories={categories}
                        selectedCategoryId={selectedCategory?.id ?? null}
                        onSelect={(category) => {
                          setSelectedCategory(category);
                          field.onChange(
                            category?.slug
                              ? `/categories/${category.slug}`
                              : ""
                          );
                        }}
                        searchQuery={pickerSearch}
                        isLoading={isLoadingCategories}
                        gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
                      />
                    </>
                  )}

                  {linkType === "product" && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Search products or pick a category, then select one —
                        single selection only
                      </p>

                      {/* Step 2: pick a product card (image + checkbox) */}
                      <ProductSelector
                        products={pickerProducts}
                        selectedProductIds={
                          selectedProduct?.id ? [selectedProduct.id] : []
                        }
                        onChange={(value) => {
                          // Single-select: keep at most one product picked
                          const id = value[value.length - 1];
                          const product = pickerProducts.find(
                            (p) => p.id === id
                          );
                          if (!product) {
                            setSelectedProduct(null);
                            field.onChange("");
                            return;
                          }
                          setSelectedProduct({
                            id: product.id,
                            name: product.name,
                            slug: product.slug,
                          });
                          field.onChange(`/product/${product.slug}`);
                        }}
                        searchQuery={pickerSearch}
                        isLoading={isLoadingPickerProducts}
                        disabled={!pickerCategoryId && !pickerSearch.trim()}
                        gridClassName="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4"
                      />
                    </>
                  )}

                  {linkType !== "none" &&
                    linkType !== "custom" &&
                    field.value && (
                      <p className="text-xs text-muted-foreground">
                        Banner links to:{" "}
                        <span className="font-mono">{field.value}</span>
                      </p>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Media */}
          <FormSection
            title="Media"
            description="The image displayed for this banner."
            className="lg:col-span-2"
          >

            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {imagePreview ? (
                      <div className="relative w-full sm:w-64 h-32 border rounded-lg overflow-hidden bg-muted/20 shrink-0">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Banner preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full sm:w-64 h-32 border border-dashed rounded-lg bg-muted/20 shrink-0">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("banner-upload")?.click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose image
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {fileName || "No file chosen"}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Recommended: wide image, around 1200×600px
                      </p>
                    </div>
                    <Input
                      id="banner-upload"
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
          </FormSection>
        </div>

        {/* Footer action bar */}
        <div className="sticky bottom-2 flex flex-col-reverse items-stretch gap-2 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end">
          <p className="mr-auto hidden text-xs text-muted-foreground lg:block">
            {form.watch("isActive")
              ? "This banner goes live immediately after saving."
              : "This banner will be saved as inactive."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create banner" : "Save changes"}
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
