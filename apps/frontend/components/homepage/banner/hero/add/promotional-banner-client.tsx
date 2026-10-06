"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { Banner } from "@/utils/types";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PromotionalCarouselClientProps {
  banners: Banner[];
  autoPlayInterval?: number;
}

export function PromotionalCarouselClient({
  banners,
  autoPlayInterval = 4000,
}: PromotionalCarouselClientProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return (
    <div className="relative w-full container md:max-w-6xl 2xl:max-w-6xl px-2 md:px-12 mx-auto">
      <Carousel
        opts={{ align: "start", loop: banners.length > 1 }}
        plugins={[
          Autoplay({ delay: autoPlayInterval, stopOnInteraction: true }),
        ]}
        setApi={setApi}
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

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute -bottom-5 left-0 right-0 flex justify-center">
            <div className="flex gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === current}
                  onClick={() => api?.scrollTo(i)}
                  className={`size-2 rounded-full cursor-pointer transition-colors duration-300 ${
                    i === current
                      ? "bg-primaryColor"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </Carousel>
    </div>
  );
}
