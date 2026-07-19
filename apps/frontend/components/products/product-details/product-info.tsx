import { Badge } from "@/components/ui/badge";
import type { Product } from "@/utils/types";
import {
  AlertTriangle,
  CheckCircle,
  Package,
  Star,
  Tag,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const isDiscountValid = () => {
    if (!product.discountValue) return false;

    const now = new Date();
    const startDate = product.discountStartDate
      ? new Date(product.discountStartDate)
      : null;
    const endDate = product.discountEndDate
      ? new Date(product.discountEndDate)
      : null;

    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;

    return true;
  };

  const hasValidDiscount = isDiscountValid();

  const discountAmount = hasValidDiscount
    ? product.discountType === "fixed"
      ? Number(product.discountValue ?? 0)
      : (product.sellingPrice * Number(product.discountValue ?? 0)) / 100
    : 0;

  const finalPrice = product.sellingPrice - discountAmount;
  const discountPercentage =
    discountAmount > 0
      ? ((discountAmount / product.sellingPrice) * 100).toFixed(0)
      : "0";

  const stockQuantity = product.stock || 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  const getStockStatus = () => {
    if (isOutOfStock)
      return {
        label: "Out of Stock",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
        dot: "bg-red-500",
      };
    if (isLowStock)
      return {
        label: `Only ${stockQuantity} left`,
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: AlertTriangle,
        dot: "bg-orange-500",
      };
    return {
      label: "In Stock",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle,
      dot: "bg-green-500",
    };
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 space-y-4">
      {/* Brand, Category & Tags */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        {/* Brand & Category */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/brands/${product.brand.slug}`}
            className="flex items-center gap-1.5 border border-red-200 bg-red-50 text-primaryColor px-2.5 py-1 rounded-full text-xs font-medium hover:bg-red-100 transition"
          >
            <Tag className="w-3.5 h-3.5" />
            {product.brand.name}
          </Link>

          <Link
            href={`/categories/${product.category.slug}`}
            className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-gray-100 transition"
          >
            <Star className="w-3.5 h-3.5" />
            {product.category.name}
          </Link>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-col sm:items-end gap-2">

            <div className="flex flex-wrap gap-2 sm:justify-end">
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
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 leading-snug">
        {product.name}
      </h1>

      {/* Description */}
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
        {product.description}
      </p>

      {/* Price + Discount */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-bold ${isOutOfStock ? "text-gray-400" : "text-primaryColor"
              }`}
          >
            ৳{finalPrice.toFixed(2)}
          </span>
          {discountAmount > 0 && (
            <span className="text-gray-500 line-through text-lg">
              ৳{product.sellingPrice.toFixed(2)}
            </span>
          )}
        </div>

        {discountAmount > 0 && !isOutOfStock && (
          <div className="flex gap-2">
            <Badge className="bg-primaryColor text-white text-xs font-semibold px-2.5 py-1">
              {discountPercentage}% OFF
            </Badge>
            <Badge className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1">
              Save ৳{discountAmount.toFixed(2)}
            </Badge>
          </div>
        )}
      </div>

      {/* Stock Status */}
      <div
        className={`flex items-center gap-2 w-fit border ${stockStatus.color} px-3 py-1.5 rounded-md`}
      >
        <StockIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{stockStatus.label}</span>
      </div>

      {/* Details */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center gap-2 text-gray-700">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            <span className="font-medium">Weight:</span>{" "}
            <span className="font-semibold text-gray-900">
              {product.weight} {product.unit.name}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <div className={`w-2.5 h-2.5 rounded-full ${stockStatus.dot}`} />
          <span className="text-sm font-medium">
            {isOutOfStock
              ? "Unavailable"
              : isLowStock
                ? `Low Stock (${stockQuantity})`
                : "Available"}
          </span>
        </div>
      </div>
    </div>
  );
}
