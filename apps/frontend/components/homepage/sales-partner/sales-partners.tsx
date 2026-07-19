import { fetchPublicData } from "@/utils/api-utils";
import { SalesPartner } from "@/utils/types";
import Image from "next/image";
import type React from "react";

interface SalesPartnersProps {
  children?: React.ReactNode;
  className?: string;
}

async function getSalesPartners(): Promise<SalesPartner[]> {
  try {
    const response = await fetchPublicData("sales-partners");
    if (Array.isArray(response)) {
      return response as SalesPartner[];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching sales partners:", error);
    return [];
  }
}

export async function SalesPartnersCompact({
  children,
  className = "",
}: SalesPartnersProps) {
  const salesPartners = await getSalesPartners();

  if (salesPartners.length === 0) {
    return (
      <div className={`w-full py-6 md:py-8 ${className}`}>
        {children}
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">
            <p>No sales partners available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full py-6 md:py-8 ${className}`}>
      {children}
      <div className="container mx-auto px-4">
        {/* Grid Layout - 2 Rows with Responsive Columns */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6 md:gap-8 lg:gap-10 max-w-7xl mx-auto">
          {salesPartners.slice(0, 12).map((partner, index) => (
            <div
              key={partner.Id}
              className="group relative flex items-center justify-center
                         aspect-3/2
                         bg-white rounded-lg shadow-sm border border-primaryColor/20
                         hover:shadow-md hover:border-gray-200
                         transition-all duration-300 hover:scale-105 p-3 sm:p-4"
            >
              <div className="relative w-full h-full">
                <Image
                  src={partner.Image?.url || "/placeholder.svg"}
                  alt={`${partner.name} logo`}
                  title={`${partner.name} logo`}
                  fill
                  className="object-contain transition-all duration-300 
                           group-hover:scale-110"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                  loading={index < 8 ? "eager" : "lazy"}
                  priority={index < 8}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
