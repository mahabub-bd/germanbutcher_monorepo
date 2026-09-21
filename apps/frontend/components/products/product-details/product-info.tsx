import { Badge } from "@/components/ui/badge";
import type { Product } from "@/utils/types";
import {
  AlertTriangle,
  Award,
  Barcode,
  CheckCircle,
  Leaf,
  Scale,
  ShieldCheck,
  Star,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { FeatureList, type FeatureItem } from "./feature-list";

interface ProductInfoProps {
  product: Product;
}

// Static marketing highlights shown under the description
const HIGHLIGHTS: FeatureItem[] = [
  { icon: Leaf, label: "100% Halal", desc: "Certified" },
  { icon: Award, label: "Premium Cut", desc: "Top Quality" },
  { icon: Truck, label: "Fast Delivery", desc: "Across Bangladesh" },
  { icon: ShieldCheck, label: "Hygienic Packing", desc: "Fresh & Safe" },
];

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
        pill: "bg-red-50 text-red-700",
        dot: "bg-red-500",
        icon: XCircle,
      };
    if (isLowStock)
      return {
        label: `Only ${stockQuantity} left`,
        pill: "bg-orange-50 text-orange-700",
        dot: "bg-orange-500",
        icon: AlertTriangle,
      };
    return {
      label: "In Stock",
      pill: "bg-green-50 text-green-700",
      dot: "bg-green-500",
      icon: CheckCircle,
    };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Brand, Category & Tags */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
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
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {product.tags.map((tag) => (
              <Link
                key={tag}
                href={`/products?tags=${tag}`}
                className="flex items-center gap-1.5 border border-red-200 bg-white text-primaryColor px-3 py-1 rounded-full text-xs font-medium hover:bg-red-50 transition-all capitalize"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-snug">
        {product.name}
      </h1>

      {/* Description */}
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
        {product.description}
      </p>

      {/* Highlight Tiles */}
      <FeatureList items={HIGHLIGHTS} variant="tile" />

      {/* Price + Stock */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold ${isOutOfStock ? "text-gray-400" : "text-primaryColor"
                }`}
            >
              ৳{finalPrice.toFixed(2)}
            </span>
            {discountAmount > 0 && (
              <span className="text-gray-400 line-through text-lg">
                ৳{product.sellingPrice.toFixed(2)}
              </span>
            )}
            {discountAmount > 0 && !isOutOfStock && (
              <Badge className="bg-primaryColor text-white text-xs font-semibold px-2 py-0.5">
                {discountPercentage}% OFF
              </Badge>
            )}
          </div>

        </div>

        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg ${stockStatus.pill}`}
        >
          <span className={`w-2 h-2 rounded-full ${stockStatus.dot}`} />
          <span className="text-sm font-semibold">{stockStatus.label}</span>
        </div>
      </div>

      {/* Weight | SKU */}
      <div className="grid grid-cols-2 rounded-xl border border-gray-100 bg-gray-50/70 divide-x divide-gray-200">
        <div className="flex items-center gap-2 px-2.5 sm:gap-2.5 sm:px-4 sm:py-3 py-2">
          <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-primaryColor shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400">Weight</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
              {product.weight} {product.unit.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 sm:gap-2.5 sm:px-4 sm:py-3 py-2">
          <Barcode className="w-4 h-4 sm:w-5 sm:h-5 text-primaryColor shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400">SKU</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
              {product.productSku}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
