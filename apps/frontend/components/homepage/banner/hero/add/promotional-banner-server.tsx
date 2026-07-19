import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { fetchPublicData } from "@/utils/api-utils";
import type { Banner } from "@/utils/types";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { PromotionalCarouselClient } from "./promotional-banner-client";

interface PromotionalCarouselProps {
  autoPlayInterval?: number;
  activeOnly?: boolean;
}

async function getBanners(activeOnly = true): Promise<Banner[]> {
  try {
    const banners = await fetchPublicData<Banner[]>(
      "banners?type=promotional&position=middle"
    );

    return activeOnly
      ? banners.filter((banner) => banner.isActive)
      : banners;
  } catch (error) {
    console.error("Failed to fetch promotional banners:", error);
    return [];
  }
}

export async function PromotionalCarousel({
  autoPlayInterval = 4000,
  activeOnly = true,
}: PromotionalCarouselProps) {
  const banners = await getBanners(activeOnly);

  if (banners.length === 0) {
    return (
      <div className="h-62.5 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
        No banners available
      </div>
    );
  }

  return (
    <PromotionalCarouselClient
      banners={banners}
      autoPlayInterval={autoPlayInterval}
    />
  );
}
