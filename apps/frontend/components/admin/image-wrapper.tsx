import { Product } from "@/utils/types";
import Image from "next/image";

interface ProductImageProps {
  product: Product;
  width: number;
  height: number;
}

export const ProductImage = ({ product, width, height }: ProductImageProps) => {
  return (
    <div className={`rounded-md `}>
      <Image
        src={product?.attachment?.url || "/placeholder.svg"}
        alt={product?.name}
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  );
};
