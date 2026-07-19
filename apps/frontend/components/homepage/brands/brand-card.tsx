"use client";

import { Badge } from "@/components/ui/badge";
import { Brand } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";

export default function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className="relative group text-center transition-all duration-300 bg-white border border-gray-100 p-3 sm:p-4 flex flex-col justify-between items-center rounded-xl h-full shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
      <Link
        href={`/brands/${brand.slug || brand.id}`}
        className="flex flex-col justify-between items-center w-full h-full"
      >
        {/* Responsive image container */}
        <div className="w-[80px] h-[80px] xs:w-[100px] xs:h-[120px] sm:w-[120px] sm:h-[120px] relative group-hover:scale-105 transition-transform duration-300">
          <Image
            src={brand?.attachment?.url || "/placeholder.svg"}
            alt={brand.name}
            title={brand.name}
            fill
            sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, (max-width: 1024px) 140px, 145px"
            className="object-contain transition-opacity duration-300 opacity-90 hover:opacity-100"
            quality={100}
          />
        </div>

        {/* Status badge */}
        {!brand.isActive && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] xs:text-xs font-medium"
          >
            Inactive
          </Badge>
        )}

        {/* Product count */}
        <div className="flex items-center justify-center my-2 sm:my-3">
          <p className="text-[10px] xs:text-xs text-gray-500 font-medium flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-primary/50"></span>
            {brand.products?.length || 0} products
          </p>
        </div>
      </Link>
    </div>
  );
}
