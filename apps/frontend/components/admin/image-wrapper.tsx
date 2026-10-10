import { Product } from "@/utils/types";
import Image from "next/image";

interface ProductImageProps {
  product: Product;
  width: number;
  height: number;
  className?: string;
}

export const ProductImage = ({
  product,
  width,
  height,
  className = "object-contain",
}: ProductImageProps) => {
  return (
    <div className={`rounded-md `}>
      <Image
        src={product?.attachment?.url || "/placeholder.svg"}
        alt={product?.name}
        width={width}
        height={height}
        className={className}
      />
    </div>
  );
};
