"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/utils/image-fallback";
import { getDiscountedPrice, hasActiveDiscount } from "@/utils/product-utils";
import type { Product } from "@/utils/types";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  History,
  ImagePlus,
  Layers,
  Mail,
  Maximize2,
  Package,
  Pencil,
  Percent,
  Phone,
  PieChart,
  Star,
  Store,
  Tag,
  Tags,
  Weight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ProductDetailProps {
  product: Product;
}

/* ── Shared building blocks ─────────────────────────────────────────── */

function SectionCard({
  title,
  icon,
  editHref,
  className = "",
  bodyClassName = "",
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  editHref?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border bg-card shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h3>
        {editHref && (
          <Link
            href={editHref}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Pencil className="size-3" />
            Edit
          </Link>
        )}
      </div>
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </span>
      <div className="text-sm font-medium text-right">{children}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [mainImage, setMainImage] = useState<string | undefined>(
    product?.attachment?.url
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const allImages = [
    product?.attachment,
    ...(product.gallery?.attachments || []),
  ].filter((image): image is NonNullable<typeof image> => Boolean(image));

  const editHref = `/admin/products/${product?.id}/edit`;

  const handleImageClick = (url: string | undefined, index: number) => {
    setMainImage(url);
    setCurrentImageIndex(index);
  };

  const handlePrevImage = () => {
    const newIndex =
      (currentImageIndex - 1 + allImages.length) % allImages.length;
    setMainImage(allImages[newIndex].url);
    setCurrentImageIndex(newIndex);
  };

  const handleNextImage = () => {
    const newIndex = (currentImageIndex + 1) % allImages.length;
    setMainImage(allImages[newIndex].url);
    setCurrentImageIndex(newIndex);
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(product.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const hasActive = hasActiveDiscount(product);
  const discountedPrice = getDiscountedPrice(product);
  const effectivePrice = hasActive ? discountedPrice : product.sellingPrice;

  // Calculate savings
  let savingsAmount = 0;
  let savingsPercentage = 0;

  if (hasActive) {
    if (product.discountType === "fixed" && product.discountValue) {
      savingsAmount = product.discountValue;
      savingsPercentage = Math.round(
        (savingsAmount / product.sellingPrice) * 100
      );
    } else if (product.discountType === "percentage" && product.discountValue) {
      savingsPercentage = product.discountValue;
      savingsAmount = Math.round(
        (savingsPercentage / 100) * product.sellingPrice
      );
    }
  }

  const profitPerUnit = effectivePrice - product.purchasePrice;
  const profitMargin =
    product.purchasePrice > 0
      ? Math.round((profitPerUnit / product.purchasePrice) * 100)
      : 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
          <Link href="/admin/products/products-list">
            <ArrowLeft className="size-4" />
            Back to Products
          </Link>
        </Button>

        <Button size="sm" asChild>
          <Link href={editHref}>
            <Pencil className="size-3.5" />
            Edit Product
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* ── Left column: gallery + status ────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Gallery */}
          <div className="rounded-lg border bg-card shadow-sm p-3">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <Image
                src={mainImage || FALLBACK_IMAGE}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 20rem"
                className="object-cover"
                priority
              />

              {hasActive && (
                <Badge className="absolute top-2.5 left-2.5 bg-red-500 hover:bg-red-500 text-white shadow-sm">
                  {product.discountType === "percentage"
                    ? `${product.discountValue}% OFF`
                    : `${formatCurrencyEnglish(savingsAmount)} OFF`}
                </Badge>
              )}

              {allImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 left-2 -translate-y-1/2 size-7 rounded-full bg-white/85 hover:bg-white text-gray-900 shadow-sm"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 size-7 rounded-full bg-white/85 hover:bg-white text-gray-900 shadow-sm"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2.5 right-2.5 size-7 rounded-full bg-white/85 hover:bg-white text-gray-900 shadow-sm"
                  >
                    <Maximize2 className="size-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={mainImage || FALLBACK_IMAGE}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 56rem"
                      className="object-cover"
                      priority
                    />
                  </div>
                  {allImages.length > 1 && (
                    <div className="flex justify-center gap-2">
                      {allImages.map((image, index) => (
                        <button
                          key={image.id}
                          className={`relative aspect-square w-14 overflow-hidden rounded-md border-2 cursor-pointer transition-all ${
                            mainImage === image.url
                              ? "border-primary"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                          onClick={() => handleImageClick(image.url, index)}
                        >
                          <Image
                            src={image.url || FALLBACK_IMAGE}
                            alt={`${product.name} image ${index + 1}`}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Thumbnails */}
            <div
              className="grid mt-3 gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  allImages.length + 1,
                  4
                )}, minmax(0, 1fr))`,
              }}
            >
              {allImages.map((image, index) => (
                <button
                  key={image.id}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 cursor-pointer transition-all ${
                    mainImage === image.url
                      ? "border-primary"
                      : "border-border opacity-75 hover:opacity-100"
                  }`}
                  onClick={() => handleImageClick(image.url, index)}
                >
                  <Image
                    src={image.url || FALLBACK_IMAGE}
                    alt={`${product.name} image ${index + 1}`}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </button>
              ))}
              <Link
                href={editHref}
                className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <ImagePlus className="size-4" />
                <span className="text-[10px] font-medium">Add Image</span>
              </Link>
            </div>
          </div>

          {/* Product Status */}
          <SectionCard title="Product Status" editHref={editHref}>
            <div className="space-y-3.5">
              <StatusRow icon={<Check className="size-3.5" />} label="Status">
                {product.isActive ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white">
                    Inactive
                  </Badge>
                )}
              </StatusRow>

              <StatusRow icon={<Star className="size-3.5" />} label="Featured">
                {product.isFeatured ? (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    Yes
                  </Badge>
                ) : (
                  <span className="text-muted-foreground font-normal">No</span>
                )}
              </StatusRow>

              <StatusRow icon={<Box className="size-3.5" />} label="Stock">
                {product.stock > 0 ? (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {product.stock} Available
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    Out of Stock
                  </Badge>
                )}
              </StatusRow>

              <StatusRow icon={<Tag className="size-3.5" />} label="SKU">
                <span className="font-mono text-xs">
                  {product.productSku}
                </span>
              </StatusRow>

              <StatusRow
                icon={<Calendar className="size-3.5" />}
                label="Created"
              >
                <span className="font-normal">
                  {formatDateTime(product.createdAt)}
                </span>
              </StatusRow>

              <StatusRow
                icon={<History className="size-3.5" />}
                label="Last Updated"
              >
                <span className="font-normal">
                  {formatDateTime(product.updatedAt)}
                </span>
              </StatusRow>
            </div>
          </SectionCard>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Product Information */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Product Information</h3>
                {product.isActive ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white">
                    Inactive
                  </Badge>
                )}
              </div>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Product ID:{" "}
                <span className="font-medium text-foreground">
                  {product.id}
                </span>
                {copied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title + meta */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold leading-tight">
                    {product.name}
                  </h1>
                  <Link
                    href={editHref}
                    className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Tag className="size-3 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {product.productSku}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Package className="size-3 text-muted-foreground" />
                    {product.unit?.name}
                  </Badge>
                  {product.weight && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Weight className="size-3 text-muted-foreground" />
                      {product.weight}g
                    </Badge>
                  )}
                </div>

                {/* Brand / Category chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {product.brand && (
                    <Badge
                      variant="outline"
                      className="gap-1 font-normal bg-muted/50"
                    >
                      <Store className="size-3 text-muted-foreground" />
                      {product.brand.name}
                    </Badge>
                  )}
                  {product.category && (
                    <Badge
                      variant="outline"
                      className="gap-1 font-normal bg-muted/50"
                    >
                      <Layers className="size-3 text-muted-foreground" />
                      {product.category.name}
                    </Badge>
                  )}
                  <Link
                    href={editHref}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Tags className="size-3" />
                    {product.tags?.length
                      ? `${product.tags.length} Tag${
                          product.tags.length > 1 ? "s" : ""
                        }`
                      : "Add Tag"}
                  </Link>
                </div>
              </div>

              <Separator />

              {/* Price grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Selling Price
                    </p>
                    <Link
                      href={editHref}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="size-3" />
                    </Link>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrencyEnglish(effectivePrice)}
                    </span>
                    {hasActive && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrencyEnglish(product.sellingPrice)}
                      </span>
                    )}
                  </div>

                  {hasActive && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Discount
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-red-500 hover:bg-red-500 text-white gap-1">
                          {product.discountType === "percentage" ? (
                            <>
                              <Percent className="size-3" />
                              {product.discountValue}% OFF
                            </>
                          ) : (
                            <>
                              <Tag className="size-3" />
                              {formatCurrencyEnglish(
                                product.discountValue ?? 0
                              )}{" "}
                              OFF
                            </>
                          )}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          Save {savingsPercentage}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sm:border-l sm:pl-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Purchase Price
                    </p>
                    <Link
                      href={editHref}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="size-3" />
                    </Link>
                  </div>
                  <p className="text-2xl font-bold mt-0.5">
                    {formatCurrencyEnglish(product.purchasePrice)}
                  </p>

                  {hasActive &&
                    product.discountStartDate &&
                    product.discountEndDate && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Discount Period
                        </p>
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          {formatDateTime(product.discountStartDate)} –{" "}
                          {formatDateTime(product.discountEndDate)}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              <Separator />

              {/* Short description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Short Description
                  </p>
                  <Link
                    href={editHref}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="size-3" />
                  </Link>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {product.description || "No description yet."}
                </p>
              </div>
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────── */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start gap-1 rounded-none bg-transparent border-b p-0 h-auto overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 h-auto shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
              >
                <PieChart className="size-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="productDetails"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 h-auto shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
              >
                <FileText className="size-4" />
                Product Details
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 h-auto shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
              >
                <Layers className="size-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger
                value="supplier"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 h-auto shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
              >
                <Building2 className="size-4" />
                Supplier
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 h-auto shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
              >
                <History className="size-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* ── Overview ─────────────────────────────────────── */}
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pricing summary */}
                <SectionCard title="Pricing" editHref={editHref}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                    <DetailItem label="SKU" value={
                      <span className="font-mono text-xs">
                        {product.productSku}
                      </span>
                    } />
                    <DetailItem label="Unit" value={product.unit?.name || "N/A"} />
                    <DetailItem
                      label="Purchase Price"
                      value={formatCurrencyEnglish(product.purchasePrice)}
                    />
                    <DetailItem
                      label="Weight"
                      value={product.weight ? `${product.weight}g` : "N/A"}
                    />
                    <DetailItem
                      label="Total Cost (Purchase)"
                      value={formatCurrencyEnglish(
                        product.purchasePrice * product.stock
                      )}
                    />
                    <DetailItem
                      label="Total Value (Sale)"
                      value={formatCurrencyEnglish(
                        effectivePrice * product.stock
                      )}
                    />
                    <DetailItem
                      label="Profit Margin"
                      value={
                        <span
                          className={
                            profitMargin >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {profitMargin}%
                        </span>
                      }
                    />
                    <DetailItem
                      label="Profit per Unit"
                      value={
                        <span
                          className={
                            profitPerUnit >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrencyEnglish(profitPerUnit)}
                        </span>
                      }
                    />
                  </div>
                </SectionCard>

                {/* Category & Tags */}
                <SectionCard title="Category & Tags" editHref={editHref}>
                  <div className="space-y-4">
                    {product.category && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          Category
                        </p>
                        <Badge
                          variant="outline"
                          className="gap-1 font-normal bg-muted/50"
                        >
                          <Layers className="size-3 text-muted-foreground" />
                          {product.category.name}
                        </Badge>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Tags
                      </p>
                      {product.tags && product.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {product.tags.map((tag) => (
                            <Link
                              key={tag}
                              href={`/products?tags=${tag}`}
                              className="inline-flex items-center bg-red-500 text-white px-2.5 py-0.5 rounded-full text-xs font-medium hover:bg-red-600 transition-colors capitalize"
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No tags yet.
                        </p>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* Additional information */}
                <SectionCard title="Additional Information" editHref={editHref}>
                  <div className="space-y-3">
                    {product.brand && (
                      <InfoLine
                        icon={<Store className="size-3.5" />}
                        label="Brand"
                        value={product.brand.name}
                      />
                    )}
                    {product.category && (
                      <InfoLine
                        icon={<Layers className="size-3.5" />}
                        label="Category"
                        value={product.category.name}
                      />
                    )}
                    <InfoLine
                      icon={<Package className="size-3.5" />}
                      label="Unit"
                      value={product.unit?.name || "N/A"}
                    />
                    <InfoLine
                      icon={<Weight className="size-3.5" />}
                      label="Weight"
                      value={product.weight ? `${product.weight}g` : "N/A"}
                    />
                    <InfoLine
                      icon={<Box className="size-3.5" />}
                      label="Total Sales"
                      value={product.saleCount ?? 0}
                    />
                  </div>
                </SectionCard>

                {/* Description */}
                <SectionCard title="Product Description" editHref={editHref}>
                  {product.description ? (
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No description yet.
                    </p>
                  )}
                </SectionCard>
              </div>
            </TabsContent>

            {/* ── Product Details (rich text) ──────────────────── */}
            <TabsContent value="productDetails" className="mt-4">
              <SectionCard title="Product Details" editHref={editHref}>
                {product.productDetails ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.productDetails }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="size-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">
                      No detailed product information available.
                    </p>
                    <p className="text-xs mt-1">
                      Add product details in the edit form to provide more
                      information about this product.
                    </p>
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            {/* ── Inventory ────────────────────────────────────── */}
            <TabsContent value="inventory" className="mt-4">
              <SectionCard title="Inventory">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Current Stock
                    </p>
                    <p className="text-xl font-bold mt-0.5">
                      {product.stock}{" "}
                      <span className="text-sm font-medium text-muted-foreground">
                        {product.unit?.name}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Inventory Value (Purchase)
                    </p>
                    <p className="text-xl font-bold mt-0.5">
                      {formatCurrencyEnglish(
                        product.purchasePrice * product.stock
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Retail Value (Sale)
                    </p>
                    <p className="text-xl font-bold mt-0.5">
                      {formatCurrencyEnglish(effectivePrice * product.stock)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Low stock alert
                    </p>
                    <p className="text-xs text-amber-700">
                      Get notified when stock falls below 3 units.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* ── Supplier ─────────────────────────────────────── */}
            <TabsContent value="supplier" className="mt-4">
              <SectionCard title="Supplier">
                {product.supplier ? (
                  <div className="flex items-start gap-4">
                    {product.supplier.attachment && (
                      <div className="relative size-14 overflow-hidden rounded-lg border bg-muted shrink-0">
                        <Image
                          src={
                            product.supplier.attachment.url || FALLBACK_IMAGE
                          }
                          alt={product.supplier.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 space-y-2">
                      <p className="font-semibold">
                        {product.supplier.name}
                      </p>
                      {product.supplier.address && (
                        <p className="text-sm flex items-center gap-2 text-muted-foreground">
                          <Building2 className="size-3.5 shrink-0" />
                          {product.supplier.address}
                        </p>
                      )}
                      {product.supplier.email && (
                        <p className="text-sm flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          {product.supplier.email}
                        </p>
                      )}
                      {product.supplier.phone && (
                        <p className="text-sm flex items-center gap-2 text-muted-foreground">
                          <Phone className="size-3.5 shrink-0" />
                          {product.supplier.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="size-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No supplier assigned.</p>
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            {/* ── History ──────────────────────────────────────── */}
            <TabsContent value="history" className="mt-4">
              <SectionCard title="History">
                <div className="space-y-4">
                  {[
                    {
                      label: "Created by",
                      name: product.createdBy?.name,
                      photo: product.createdBy?.profilePhoto?.url,
                      date: product.createdAt,
                      dateLabel: "Created At",
                    },
                    {
                      label: "Last updated by",
                      name: product.updatedBy?.name,
                      photo: product.updatedBy?.profilePhoto?.url,
                      date: product.updatedAt,
                      dateLabel: "Updated At",
                    },
                  ].map((entry, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative size-9 overflow-hidden rounded-full border bg-muted shrink-0">
                        {entry.photo && (
                          <Image
                            src={entry.photo || FALLBACK_IMAGE}
                            alt={entry.name || ""}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {entry.label}
                        </p>
                        <p className="text-sm font-medium truncate">
                          {entry.name || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {entry.dateLabel}
                        </p>
                        <p className="text-sm">{formatDateTime(entry.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
