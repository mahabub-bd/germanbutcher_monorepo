"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

import { revalidateProducts } from "@/actions/revalidate";
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
  type Gallery,
  type Product,
  type Supplier,
  type Unit,
} from "@/utils/types";
import { useRouter } from "next/navigation";

import { Form } from "@/components/ui/form";

import { productSchema } from "@/utils/form-validation";
import { BasicInformationSection } from "./form/basic-information-section";
import { DiscountSection } from "./form/discount-section";
import { IdentificationSection } from "./form/identification-section";
import { PricingInventorySection } from "./form/pricing-inventory-section";
import { ProductFormFooter } from "./form/product-form-footer";
import { ProductGallerySection } from "./form/product-gallery-section";
import { ProductImageSection } from "./form/product-image-section";
import { StatusVisibilitySection } from "./form/status-visibility-section";
import { type ProductFormValues } from "./form/types";

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
  const [existingPreviews, setExistingPreviews] = useState<string[]>([]);
  const [existingAttachmentIds, setExistingAttachmentIds] = useState<number[]>(
    []
  );
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const router = useRouter();

  // Track blob object URLs we create so they can be revoked deterministically.
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const trackObjectUrl = (url: string) => {
    objectUrlsRef.current.add(url);
    return url;
  };

  const revokeObjectUrl = (url: string) => {
    if (objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  };

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
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
        const parentId =
          (product.category as { parent?: { id: number } }).parent?.id ||
          product.category?.parentId;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, categories, mode]);

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
              setExistingPreviews(
                galleryResponse.attachments.map(
                  (attachment: Attachment) => attachment.url
                )
              );
              setExistingAttachmentIds(
                galleryResponse.attachments.map(
                  (attachment: Attachment) => attachment.id
                )
              );
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);

    if (imagePreview) {
      revokeObjectUrl(imagePreview);
    }
    setImagePreview(trackObjectUrl(URL.createObjectURL(selectedFile)));

    form.setValue("imageUrl", "");
  };

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);
    setNewGalleryFiles((prev) => [...prev, ...newFiles]);
    setNewGalleryPreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => trackObjectUrl(URL.createObjectURL(f))),
    ]);
    // Allow picking the same file again in a subsequent selection.
    e.target.value = "";
  };

  const removeNewGalleryImage = (index: number) => {
    const preview = newGalleryPreviews[index];
    if (preview) {
      revokeObjectUrl(preview);
    }
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const syncGalleryState = (attachments: Attachment[]) => {
    setExistingPreviews(attachments.map((attachment) => attachment.url));
    setExistingAttachmentIds(attachments.map((attachment) => attachment.id));
  };

  const deleteGalleryImage = async (attachmentId: number) => {
    try {
      if (!product?.gallery?.id) return;

      await deleteData(`galleries/${product.gallery.id}/attachments`, attachmentId);

      toast.success("Image deleted successfully");

      const galleryResponse = await fetchData<Gallery>(
        `galleries/${product.gallery.id}`
      );
      if (
        galleryResponse?.attachments &&
        Array.isArray(galleryResponse.attachments)
      ) {
        syncGalleryState(galleryResponse.attachments);
      }
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      toast.error("An error occurred while deleting the image");
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

      if (newGalleryFiles.length > 0) {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description || "");

        newGalleryFiles.forEach((galleryFile) => {
          formData.append("files", galleryFile);
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
        slug: data.slug?.trim() || undefined,
        ...(data.hasDiscount === false
          ? {
              discountType: null,
              discountValue: null,
              discountStartDate: null,
              discountEndDate: null,
            }
          : {}),
      };

      const endpoint = mode === "create" ? "products" : `products/${product?.id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, productData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        await revalidateProducts();
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

  const openGalleryUpload = () => {
    document.getElementById("gallery-upload")?.click();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Shared hidden input: triggered by the gallery section's "Add Image" tile */}
        <input
          id="gallery-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGalleryFilesChange}
        />

        <div className="space-y-6">
            <BasicInformationSection
              control={form.control}
              initialTags={product?.tags || []}
              initialSlug={product?.slug}
              mode={mode}
            />

            <IdentificationSection
              control={form.control}
              units={units}
              suppliers={suppliers}
              brands={brands}
              categories={categories}
              selectedMainCategory={selectedMainCategory}
              subCategories={subCategories}
              isLoadingSubCategories={isLoadingSubCategories}
              onMainCategoryChange={handleMainCategoryChange}
            />

            <PricingInventorySection control={form.control} />

            <DiscountSection control={form.control} />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ProductImageSection
                control={form.control}
                imagePreview={imagePreview}
                fileName={fileName}
                onFileChange={handleFileChange}
              />

              <ProductGallerySection
                existingPreviews={existingPreviews}
                existingAttachmentIds={existingAttachmentIds}
                newPreviews={newGalleryPreviews}
                onDeleteExisting={deleteGalleryImage}
                onRemoveNew={removeNewGalleryImage}
                onAddClick={openGalleryUpload}
              />
            </div>

            <StatusVisibilitySection control={form.control} />
        </div>

        <ProductFormFooter
          mode={mode}
          isSubmitting={isSubmitting}
          onCancel={() => router.back()}
          previewHref={
            mode === "edit" && product?.slug ? `/product/${product.slug}` : undefined
          }
        />
      </form>
    </Form>
  );
}
