"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

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
  deleteData,
  fetchData,
  fetchProtectedData,
  formPostData,
  patchData,
  postData,
} from "@/utils/api-utils";
import {
  type Attachment,
  type Brand,
  type Category,
  DiscountType,
  type Gallery,
  type Product,
  type Supplier,
  type Unit,
} from "@/utils/types";
import { useRouter } from "next/navigation";

import { DatePicker } from "@/components/ui/date-picker";
import RichTextEditor from "@/components/ui/jodit-editor";
import { productSchema } from "@/utils/form-validation";
import { Section } from "../helper";

type ProductFormValues = z.output<typeof productSchema>;

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
  brands: Brand[];
  categories: Category[];
}

export function ProductForm({
  mode,
  product,
  brands,
  categories,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(
    product?.attachment?.url || ""
  );
  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | null
  >(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false);
  const router = useRouter();

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      productDetails: product?.productDetails || "",
      sellingPrice: product?.sellingPrice || 0,
      purchasePrice: product?.purchasePrice || 0,
      stock: product?.stock || 0,
      weight: product?.weight || 0.01,
      unitId: product?.unit?.id || 0,
      productSku: product?.productSku || "",
      imageUrl: product?.attachment?.url || "",
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      brandId: product?.brand?.id || 0,
      categoryId: product?.category?.id || 0,
      supplierId: product?.supplier?.id || 0,
      galleryId: product?.gallery?.id || 0,
      hasDiscount: Boolean(product?.discountType),
      discountType: product?.discountType || undefined,
      discountValue: product?.discountValue || 0,
      discountStartDate: product?.discountStartDate
        ? new Date(product.discountStartDate)
        : undefined,
      discountEndDate: product?.discountEndDate
        ? new Date(product.discountEndDate)
        : undefined,
      tags: product?.tags || [],
    },
  });

  useEffect(() => {
    const initializeCategories = async () => {
      if (mode === "edit" && product?.category) {
        // Get the parent ID from the nested parent object or directly from parentId
        const parentId = (product.category as any).parent?.id || product.category?.parentId;

        const mainCategory = categories.find(
          (c) =>
            c.id === parentId ||
            (c.isMainCategory && c.id === product.category?.id)
        );

        if (mainCategory) {
          setSelectedMainCategory(mainCategory.id);
          await fetchSubCategories(mainCategory.id);

          if (parentId) {
            form.setValue("categoryId", product.category.id);
          }
        }
      }
    };

    initializeCategories();
  }, [product, categories, mode, form]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [unitsResponse, suppliersResponse] = await Promise.all([
          fetchProtectedData<Unit[]>("units"),
          fetchProtectedData<Supplier[]>("suppliers"),
        ]);

        setUnits(unitsResponse);
        setSuppliers(suppliersResponse);

        if (mode === "edit" && product?.gallery?.id) {
          try {
            const galleryResponse = await fetchData<Gallery>(
              `galleries/${product.gallery.id}`
            );
            if (
              galleryResponse?.attachments &&
              Array.isArray(galleryResponse.attachments)
            ) {
              const galleryImages = galleryResponse.attachments.map(
                (attachment: Attachment) => attachment.url
              );
              setGalleryPreviews(galleryImages);
            }
          } catch (error) {
            console.error("Error fetching gallery images:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load initial data");
      }
    };

    fetchInitialData();
  }, [mode, product]);

  const fetchSubCategories = async (parentId: number) => {
    setIsLoadingSubCategories(true);
    try {
      const response = await fetchData<Category[]>(
        `categories?parentId=${parentId}`
      );
      setSubCategories(response);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
    } finally {
      setIsLoadingSubCategories(false);
    }
  };

  const handleMainCategoryChange = async (value: string) => {
    const mainCategoryId = Number(value);
    setSelectedMainCategory(mainCategoryId);

    const selectedCategory = categories.find((c) => c.id === mainCategoryId);

    if (selectedCategory) {
      await fetchSubCategories(mainCategoryId);
      form.setValue("categoryId", 0);
    }
  };

  const generateSku = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    const prefix = Array(2)
      .fill(0)
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join("");
    const middle = Array(4)
      .fill(0)
      .map(() => numbers.charAt(Math.floor(Math.random() * numbers.length)))
      .join("");
    const suffix = Array(2)
      .fill(0)
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join("");

    form.setValue("productSku", `${prefix}-${middle}-${suffix}`);
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

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);
    setGalleryFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));

    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteGalleryImage = async (attachmentId: number) => {
    try {
      if (!product?.gallery?.id) return;

      await deleteData(
        `galleries/${product.gallery.id}/attachments`,
        attachmentId
      );

      toast.success("Image deleted successfully");

      const galleryResponse = await fetchData<Gallery>(
        `galleries/${product.gallery.id}`
      );
      if (
        galleryResponse?.attachments &&
        Array.isArray(galleryResponse.attachments)
      ) {
        const galleryImages = galleryResponse.attachments.map(
          (attachment: Attachment) => attachment.url
        );
        setGalleryPreviews(galleryImages);
      }
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      toast.error("An error occurred while deleting the image");
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    } else if (tags.includes(trimmedTag)) {
      toast.error("Tag already exists");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (data: ProductFormValues) => {
    if (
      selectedMainCategory &&
      subCategories.length > 0 &&
      (!data.categoryId || data.categoryId === 0)
    ) {
      toast.error("Please select a subcategory");
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentId = product?.attachment?.id;
      let galleryId = product?.gallery?.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData("attachment", formData);
        attachmentId = result.data.id;
      }

      if (galleryFiles.length > 0) {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description || "");

        galleryFiles.forEach((file) => {
          formData.append("files", file);
        });

        const galleryResponse = await formPostData("galleries", formData);

        if (
          galleryResponse?.statusCode === 200 ||
          galleryResponse?.statusCode === 201
        ) {
          if (galleryResponse.data?.id) {
            galleryId = galleryResponse.data.id;
          }
        } else {
          toast.error(galleryResponse?.message || "Failed to create gallery");
          setIsSubmitting(false);
          return;
        }
      }

      const productData = {
        ...data,
        unitId: data.unitId.toString(),
        supplierId: data.supplierId.toString(),
        attachment: attachmentId,
        galleryId: galleryId?.toString() || undefined,
        // Clear discount fields when hasDiscount is false
        ...(data.hasDiscount === false
          ? {
              discountType: null,
              discountValue: null,
              discountStartDate: null,
              discountEndDate: null,
            }
          : {}),
      };

      const endpoint =
        mode === "create" ? "products" : `products/${product?.id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, productData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Product created successfully"
            : "Product updated successfully";
        toast.success(successMessage);
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting product form:", error);
      toast.error(
        mode === "create"
          ? error instanceof Error
            ? `${error.message}`
            : "Failed to create product"
          : error instanceof Error
            ? `${error.message}`
            : "Failed to update product"
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

      galleryPreviews.forEach((url) => {
        if (!url.startsWith("http")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreview, galleryPreviews]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <Section title="Basic Information">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
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
                      placeholder="Enter product description"
                      className="min-h-25"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter tag (e.g., organic, gluten-free)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    className="whitespace-nowrap"
                  >
                    Add Tag
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add tags to help customers find your products (e.g., organic,
                  gluten-free, premium)
                </p>
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="productDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Details</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Use the rich text editor to format your content. Supports
                    text formatting, lists, links, images, and more.
                  </p>
                </FormItem>
              )}
            />
          </Section>

          <Section title="Product Identification">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="productSku"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>SKU</FormLabel>
                      <div className="grid gap-4 grid-cols-2 w-full">
                        <FormControl className="w-full">
                          <Input
                            placeholder="Enter product SKU"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSku}
                          className="whitespace-nowrap bg-green-200"
                        >
                          Generate SKU
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Unit</FormLabel>
                      <FormControl className="w-full">
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : undefined
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units?.map((unit: Unit) => (
                              <SelectItem
                                key={unit.id}
                                value={unit.id.toString()}
                              >
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Supplier</FormLabel>
                      <FormControl className="w-full">
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : undefined
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers?.map((supplier: Supplier) => (
                              <SelectItem
                                key={supplier.id}
                                value={supplier.id.toString()}
                              >
                                {supplier?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Brand</FormLabel>
                      <FormControl className="w-full">
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={
                            field.value && field.value > 0
                              ? field.value.toString()
                              : undefined
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem
                                key={brand.id}
                                value={brand.id.toString()}
                              >
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className="w-full">
                  <FormLabel>Main Category</FormLabel>
                  <Select
                    onValueChange={handleMainCategoryChange}
                    value={selectedMainCategory?.toString() || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select main category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.isMainCategory || !c.parentId)
                        .map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>

                <FormItem className="w-full">
                  <FormLabel>Sub Category</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      form.setValue("categoryId", Number(value))
                    }
                    value={form.watch("categoryId")?.toString() || ""}
                    disabled={!selectedMainCategory || isLoadingSubCategories}
                  >
                    <SelectTrigger className="w-full">
                      {isLoadingSubCategories ? (
                        <span>Loading subcategories...</span>
                      ) : (
                        <SelectValue placeholder="Select sub category" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.length > 0 ? (
                        subCategories.map((subCategory) => (
                          <SelectItem
                            key={subCategory.id}
                            value={subCategory.id.toString()}
                          >
                            {subCategory.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-sm p-2 text-muted-foreground">
                          No subcategories available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </div>
            </div>
          </Section>

          <Section title="Pricing & Inventory">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (g)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          <Section title="Discount">
            <FormField
              control={form.control}
              name="hasDiscount"
              render={({ field }) => (
                <SwitchCard
                  label="Apply Discount"
                  description="Enable to set up a temporary discount"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />

            {form.watch("hasDiscount") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Discount Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={DiscountType.PERCENTAGE}>
                            Percentage (%)
                          </SelectItem>
                          <SelectItem value={DiscountType.FIXED}>
                            Fixed Amount
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter discount amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select End date"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Media">
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        {imagePreview ? (
                          <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50">
                            <Image
                              src={imagePreview || "/placeholder.svg"}
                              alt="Product preview"
                              fill
                              sizes="128px"
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
                              document.getElementById("product-upload")?.click()
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
                        id="product-upload"
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

            <Section title="Product Gallery">
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Gallery Images</FormLabel>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {mode === "edit" &&
                        product?.gallery?.id &&
                        galleryPreviews.map((preview, index) => (
                          <div
                            key={`existing-${index}`}
                            className="relative group"
                          >
                            <div className="relative  h-32 w-32 border rounded-md overflow-hidden bg-gray-50">
                              <Image
                                src={preview || "/placeholder.svg"}
                                alt={`Gallery image ${index + 1}`}
                                fill
                                sizes="128px"
                                className="object-contain"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                if (
                                  product?.gallery?.attachments &&
                                  product.gallery.attachments[index]?.id
                                ) {
                                  deleteGalleryImage(
                                    product.gallery.attachments[index].id
                                  );
                                } else {
                                  const newPreviews = [...galleryPreviews];
                                  newPreviews.splice(index, 1);
                                  setGalleryPreviews(newPreviews);
                                }
                              }}
                            >
                              <span className="sr-only">Remove</span>×
                            </Button>
                          </div>
                        ))}

                      {galleryFiles.map((_, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <div className="relative w-full h-24 border rounded-md overflow-hidden bg-gray-50">
                            <Image
                              src={
                                URL.createObjectURL(galleryFiles[index]) ||
                                "/placeholder.svg"
                              }
                              alt={`New gallery image ${index + 1}`}
                              fill
                              sizes="100vw"
                              className="object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeGalleryImage(index)}
                          >
                            <span className="sr-only">Remove</span>×
                          </Button>
                        </div>
                      ))}

                      <div
                        className="flex items-center justify-center w-full h-24 border rounded-md bg-muted/20 cursor-pointer"
                        onClick={() =>
                          document.getElementById("gallery-upload")?.click()
                        }
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>

                    <Input
                      id="gallery-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryFilesChange}
                    />
                  </div>
                </FormItem>
              </div>
            </Section>

            <Section title="Status">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <SwitchCard
                      label="Active Status"
                      description="Product will be visible to customers"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <SwitchCard
                      label="Featured Product"
                      description="Product will appear in featured sections"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
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
              <>{mode === "create" ? "Create Product" : "Update Product"}</>
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
