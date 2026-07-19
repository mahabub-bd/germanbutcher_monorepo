"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { fetchDataPagination } from "@/utils/api-utils";
import type { Banner } from "@/utils/types";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useEffect } from "react";

interface PromotionalCarouselProps {
  autoPlayInterval?: number;
  activeOnly?: boolean;
}

const CarouselSkeleton = React.memo(() => (
  <div className="relative overflow-hidden w-full h-62.5 bg-gray-100 animate-pulse rounded-lg" />
));
CarouselSkeleton.displayName = "CarouselSkeleton";

const PromotionalCarousel = ({
  autoPlayInterval = 4000,
  activeOnly = true,
}: PromotionalCarouselProps) => {
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBanners = async () => {
      try {
        setIsLoading(true);
        const response = (await fetchDataPagination(
          "banners?type=promotional&position=middle"
        )) as { data: Banner[] };

        if (!isMounted) return;
        setBanners(
          activeOnly
            ? response.data.filter((banner) => banner.isActive)
            : response.data
        );
      } catch (err) {
        setError("Failed to load promotional banners");
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadBanners();

    return () => {
      isMounted = false;
    };
  }, [activeOnly]);

  if (isLoading) return <CarouselSkeleton />;

  if (error || banners.length === 0) {
    return (
      <div className="h-62.5 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
        {error || "No banners available"}
      </div>
    );
  }

  return (
    <div className="relative w-full container md:max-w-6xl 2xl:max-w-6xl px-2 md:px-12 mx-auto">
      <Carousel
        opts={{ align: "start", loop: banners.length > 1 }}
        plugins={[
          Autoplay({ delay: autoPlayInterval, stopOnInteraction: true }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-0.5 md:-ml-4">
          {banners.map((banner) => (
            <CarouselItem
              key={banner.id}
              className="relative pl-0.5 md:pl-4 md:basis-1/2 basis-full"
            >
              <div className="relative w-full h-45 sm:h-50 md:h-55 rounded-sm overflow-hidden">
                {banner.targetUrl ? (
                  <Link
                    href={banner.targetUrl}
                    className="relative block w-full h-full"
                    aria-label={banner.title}
                  >
                    <Image
                      src={banner.image?.url || "/placeholder.svg"}
                      alt={banner.title}
                      title={banner.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-contain object-center"
                      priority={banners.indexOf(banner) < 2}
                    />
                  </Link>
                ) : (
                  <Image
                    src={banner.image?.url || "/placeholder.svg"}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-contain object-center"
                    priority={banners.indexOf(banner) < 2}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default PromotionalCarousel;
