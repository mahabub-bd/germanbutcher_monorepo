import { fetchPublicData } from "@/utils/api-utils";
import type { Banner } from "@/utils/types";
import { CarouselBannerClient } from "./carousel-banner-client";

interface CarouselBannerProps {
  activeOnly?: boolean;
  priority?: boolean;
}

async function getBanners(activeOnly = true): Promise<Banner[]> {
  try {
    const banners = await fetchPublicData<Banner[]>(
      "banners?type=main&position=top"
    );

    return activeOnly
      ? banners.filter((b) => b.isActive)
      : banners;
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    return [];
  }
}

export async function CarouselBanner({
  activeOnly = true,
  priority = true,
}: CarouselBannerProps) {
  const banners = await getBanners(activeOnly);

  if (banners.length === 0) {
    return (
      <div className="relative overflow-hidden w-full h-87.5 sm:h-100 max-h-125 2xl:h-125 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">No banners available</p>
      </div>
    );
  }

  return <CarouselBannerClient banners={banners} priority={priority} />;
}
