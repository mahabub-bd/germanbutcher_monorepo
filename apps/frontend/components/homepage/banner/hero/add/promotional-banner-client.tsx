"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { Banner } from "@/utils/types";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

interface PromotionalCarouselClientProps {
  banners: Banner[];
  autoPlayInterval?: number;
}

export function PromotionalCarouselClient({
  banners,
  autoPlayInterval = 4000,
}: PromotionalCarouselClientProps) {
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
}
