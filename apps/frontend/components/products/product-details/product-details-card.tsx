import { Separator } from "@/components/ui/separator";
import type { Product } from "@/utils/types";
import { Building2, Hash, Info, Package, Tag, Weight } from "lucide-react";

interface ProductDetailsCardProps {
  product: Product;
}

export function ProductDetailsCard({ product }: ProductDetailsCardProps) {
  const details = [
    {
      label: "SKU",
      value: product.productSku,
      icon: Hash,
    },
    {
      label: "Weight",
      value: `${product.weight} ${product.unit.name}`,
      icon: Weight,
    },
    {
      label: "Brand",
      value: product.brand.name,
      icon: Building2,
    },
    {
      label: "Category",
      value: product.category.name,
      icon: Tag,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 md:gap-3 mb-3 md:mb-5">
        <div className="bg-primaryColor/10 rounded-lg p-1.5 md:p-2">
          <Package className="w-4 h-4 md:w-5 md:h-5 text-primaryColor" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          Product Details
        </h3>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {details.map(({ label, value, icon: Icon }, index) => (
          <div
            key={label}
            className={`flex items-center gap-2.5 min-w-0 px-2 py-2 sm:px-3 ${
              index % 2 === 1 ? "border-l border-gray-100" : ""
            } ${index >= 2 ? "border-t sm:border-t-0 border-gray-100" : ""} ${
              index > 0 ? "sm:border-l sm:border-gray-100" : ""
            }`}
          >
            <div className="bg-gray-50 rounded-lg p-2 shrink-0">
              <Icon className="w-4 h-4 text-primaryColor" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                {label}
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Information Section */}
      {product.productDetails && (
        <>
          <Separator className="my-5" />
          <div className="grid md:grid-cols-[240px_1fr] gap-2 md:gap-6">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primaryColor shrink-0" />
              <h4 className="text-base font-medium text-gray-900">
                Detailed Information
              </h4>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed [&_p]:mb-2 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_h1,&_h2,&_h3,&_h4]:font-semibold [&_h1,&_h2,&_h3,&_h4]:text-gray-900 [&_h1]:text-lg [&_h2]:text-base [&_h3,&_h4]:text-sm [&_img]:rounded-lg [&_img]:my-2 [&_a]:text-primaryColor [&_a]:underline">
              <div
                dangerouslySetInnerHTML={{ __html: product.productDetails }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
