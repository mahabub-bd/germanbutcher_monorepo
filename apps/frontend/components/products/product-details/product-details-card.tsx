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
    <div className="bg-white rounded-md md:p-6 p-4 shadow-sm ">
      {/* Header */}
      <div className="flex items-center mb-6 gap-4">
        <div className="bg-primaryColor/10 rounded-lg">
          <Package className="w-5 h-5 text-primaryColor" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Product Details</h3>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {details.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center  gap-3  ">
            <Icon className="w-4 h-4 text-primaryColor" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 truncate">{label}</p>
              <p className="text-sm font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Information Section */}
      {product.productDetails && (
        <>
          <Separator className="my-4" />
          <div className="mt-6">
            <div className="flex items-center mb-3 gap-3">
              <Info className="w-4 h-4 text-primaryColor" />
              <h4 className="text-base font-medium">Detailed Information</h4>
            </div>
            <div className=" text-gray-700 ">
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
