"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { getDiscountedPrice, getDiscountLabel, hasActiveDiscount } from "@/utils/product-utils";
import type { Product } from "@/utils/types";
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  History,
  Info,
  Layers,
  Mail,
  Maximize2,
  Package,
  Percent,
  Phone,
  Star,
  Tag,
  Weight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [mainImage, setMainImage] = useState(product.attachment.url);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = [
    product.attachment,
    ...(product.gallery?.attachments || []),
  ];

  const handleImageClick = (url: string, index: number) => {
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

  const hasActive = hasActiveDiscount(product);
  const discountedPrice = getDiscountedPrice(product);
  const discountLabel = getDiscountLabel(product);

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

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/admin/products/products-list">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>

          <Separator orientation="vertical" className="mx-2 h-4" />
          <span>{product.category.name}</span>
          <span className="mx-2">/</span>
          <span>{product.brand.name}</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">{product.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${product?.id}/edit`}>
            <Button variant="default" size="sm" className="gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Images Section */}
        <div className="flex flex-col gap-4">
          <div className="bg-white ">
            <div className="relative aspect-3/2 overflow-hidden rounded-md border bg-background/50">
              <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] z-0"></div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={mainImage || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 56rem"
                      className="object-cover z-10"
                      priority
                    />
                  </div>
                  <div className="flex justify-center gap-2 mt-4">
                    {allImages.map((image, index) => (
                      <div
                        key={image.id}
                        className={`relative aspect-3/2 w-16 overflow-hidden rounded-md border cursor-pointer transition-all ${mainImage === image.url ? "border-primary" : ""
                          }`}
                        onClick={() => handleImageClick(image.url, index)}
                      >
                        <Image
                          src={image.url || "/placeholder.svg"}
                          alt={`${product.name} image ${index + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Image
                src={mainImage || "/placeholder.svg"}
                alt={product.name}
                fill
                sizes="100vw"
                className="object-cover z-10"
                priority
              />

              {product.isFeatured && (
                <Badge className="absolute top-2 left-2 z-10 bg-amber-500 text-white">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}

              {hasActive && (
                <Badge className="absolute bottom-2 left-2 z-10 bg-red-500 text-white">
                  {product.discountType === "percentage" ? (
                    <>{product.discountValue}% OFF</>
                  ) : (
                    <>SAVE {formatCurrencyEnglish(savingsAmount)}</>
                  )}
                </Badge>
              )}

              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 left-2 z-10 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 right-2 z-10 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-5 gap-2 mt-4">
              <div
                className={`relative aspect-3/2 overflow-hidden rounded-md border cursor-pointer transition-all ${mainImage === product.attachment.url
                  ? "border-primary"
                  : ""
                  }`}
                onClick={() => handleImageClick(product.attachment.url, 0)}
              >
                <Image
                  src={product.attachment.url || "/placeholder.svg"}
                  alt={`${product.name} main image`}
                  fill
                  sizes="20vw"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {product.gallery &&
                product.gallery.attachments &&
                product.gallery.attachments.map((image, index) => (
                  <div
                    key={image.id}
                    className={`relative aspect-3/2 overflow-hidden rounded-md border cursor-pointer transition-all ${mainImage === image.url ? "border-primary" : ""
                      }`}
                    onClick={() => handleImageClick(image.url, index + 1)}
                  >
                    <Image
                      src={image.url || "/placeholder.svg"}
                      alt={`${product.name} gallery image`}
                      fill
                      sizes="20vw"
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <h2 className="text-base font-semibold mb-2">Product Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {product.isActive ? (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-red-100 text-red-800 border-red-200"
                  >
                    Inactive
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Featured</span>
                {product.isFeatured ? (
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-200"
                  >
                    Yes
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 border-gray-200"
                  >
                    No
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stock</span>
                {product.stock > 0 ? (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-200"
                  >
                    {product.stock} Available
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-red-100 text-red-800 border-red-200"
                  >
                    Out of Stock
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SKU</span>
                <span className="font-medium">{product.productSku}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {formatDateTime(product.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last Updated
                </span>
                <span className="text-sm">
                  {formatDateTime(product.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <h2 className="text-base font-semibold mb-2">Product Information</h2>
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5">
                    <Tag className="h-2.5 w-2.5" />
                    {product.productSku}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5">
                    <Package className="h-2.5 w-2.5" />
                    {product.unit.name}
                  </Badge>
                  {product.weight && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-xs px-2 py-0.5"
                    >
                      <Weight className="h-2.5 w-2.5" />
                      {product.weight}g
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/products?tags=${tag}`}
                      className="flex items-center gap-1.5 border-2 border-red-200 bg-white text-primaryColor px-3 py-0.5 rounded-full text-sm font-medium hover:border-primaryColor hover:bg-red-50 hover:shadow-sm transition-all capitalize"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {product.brand.attachment && (
                    <div className="relative h-8 w-8 overflow-hidden border mr-2">
                      <Image
                        src={product.brand.attachment.url || "/placeholder.svg"}
                        alt={product.brand.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="font-medium">{product.brand.name}</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center">
                  {product.category.attachment && (
                    <div className="relative h-8 w-8 overflow-hidden border mr-2">
                      <Image
                        src={
                          product.category.attachment.url || "/placeholder.svg"
                        }
                        alt={product.category.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span>{product.category.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Selling Price</p>
                  <div className="flex items-baseline gap-2">
                    {hasActive ? (
                      <>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrencyEnglish(discountedPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrencyEnglish(product.sellingPrice)}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-primary">
                        {formatCurrencyEnglish(product.sellingPrice)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Purchase Price
                  </p>
                  <p className="text-lg font-medium">
                    {formatCurrencyEnglish(product.purchasePrice)}
                  </p>
                </div>

                {hasActive && (
                  <div>
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <div className="flex items-center gap-1.5">
                      {product.discountType === "fixed" ? (
                        <>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 bg-red-50 text-red-600 border-red-200 text-xs px-2 py-0.5"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {formatCurrencyEnglish(
                              product.discountValue ?? 0
                            )}{" "}
                            OFF
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 text-xs px-2 py-0.5"
                          >
                            {savingsPercentage}% Savings
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 bg-red-50 text-red-600 border-red-200 text-xs px-2 py-0.5"
                          >
                            <Percent className="h-2.5 w-2.5" />
                            {product.discountValue}% OFF
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 text-xs px-2 py-0.5"
                          >
                            Save {formatCurrencyEnglish(savingsAmount)}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {hasActive &&
                  product.discountStartDate &&
                  product.discountEndDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Discount Period
                      </p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                        {formatDateTime(product.discountStartDate)} -{" "}
                        {formatDateTime(product.discountEndDate)}
                      </p>
                    </div>
                  )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-xs leading-relaxed">{product.description}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details" className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger
                value="productDetails"
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Product Details
              </TabsTrigger>
              <TabsTrigger value="supplier" className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                Supplier
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="flex items-center gap-1"
              >
                <Layers className="h-4 w-4" />
                Inventory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-3 pt-2">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium">{product.productSku}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-medium">{product.unit.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Purchase Price
                    </p>
                    <p className="font-medium">
                      {formatCurrencyEnglish(product.purchasePrice)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{product.weight || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total Value (Sale Price)
                    </p>
                    <p className="font-medium">
                      {formatCurrencyEnglish(
                        hasActive
                          ? discountedPrice * product.stock
                          : product.sellingPrice * product.stock
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total Value (Purchase Price)
                    </p>
                    <p className="font-medium">
                      {formatCurrencyEnglish(
                        product.purchasePrice * product.stock
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Profit Margin
                    </p>
                    <p className="font-medium">
                      {Math.round(
                        (((hasActive
                          ? discountedPrice
                          : product.sellingPrice) -
                          product.purchasePrice) /
                          product.purchasePrice) *
                        100
                      )}
                      %
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Profit per Unit
                    </p>
                    <p className="font-medium">
                      {formatCurrencyEnglish(
                        (hasActive ? discountedPrice : product.sellingPrice) -
                        product.purchasePrice
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              {product.tags && product.tags.length > 0 && (
                <div className="bg-white p-3 rounded-lg border shadow-sm mt-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Product Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/products?tags=${tag}`}
                          className="inline-flex items-center gap-1 border-2 border-red-200 bg-white text-primaryColor px-2.5 py-0.5 rounded-full text-xs font-medium hover:border-primaryColor hover:bg-red-50 hover:shadow-sm transition-all capitalize"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Click on a tag to view all products with this tag
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="productDetails" className="pt-2">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Product Details
                </h3>
                {product.productDetails ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.productDetails }}
                  />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No detailed product information available.</p>
                    <p className="text-xs mt-1">
                      Add product details in the edit form to provide more
                      information about this product.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="supplier" className="pt-2">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-3">
                  {product.supplier.attachment && (
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border">
                      <Image
                        src={
                          product.supplier.attachment.url || "/placeholder.svg"
                        }
                        alt={product.supplier.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-base">
                      {product.supplier.name}
                    </h3>
                    <div className="grid grid-cols-1 gap-1 mt-1.5">
                      <p className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {product.supplier.address}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {product.supplier.email}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {product.supplier.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="pt-2">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Created by</p>
                      <div className="flex items-center gap-2 mt-1">
                        {product.createdBy.profilePhoto && (
                          <div className="relative h-6 w-6 overflow-hidden rounded-full border">
                            <Image
                              src={
                                product.createdBy.profilePhoto.url ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={product.createdBy.name}
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="text-sm">{product.createdBy.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Created At
                      </p>
                      <p className="text-sm">
                        {formatDateTime(product.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Last updated by</p>
                      <div className="flex items-center gap-2 mt-1">
                        {product.updatedBy.profilePhoto && (
                          <div className="relative h-6 w-6 overflow-hidden rounded-full border">
                            <Image
                              src={
                                product.updatedBy.profilePhoto.url ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={product.updatedBy.name}
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="text-sm">{product.updatedBy.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Updated At
                      </p>
                      <p className="text-sm">
                        {formatDateTime(product.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                    >
                      <Clock className="h-4 w-4" />
                      View Full History
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="pt-2">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Current Stock</p>
                      <p className="text-xl font-bold mt-1">
                        {product.stock} {product.unit.name}s
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Low Stock Alert
                      </p>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <p className="font-medium">When below 3 units</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Last Restocked
                      </p>
                      <p className="font-medium">2025-04-15</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Inventory Value
                      </p>
                      <p className="font-medium">
                        {formatCurrencyEnglish(
                          product.purchasePrice * product.stock
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
