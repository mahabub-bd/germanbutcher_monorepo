"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchData } from "@/utils/api-utils";
import { Category } from "@/utils/types";
import Autoplay from "embla-carousel-autoplay";
import { CategoryCard } from "./category-card";

interface CategorySlideProps {
  children?: React.ReactNode;
  endpoint: string;
  activeCategory?: string;
}

export default function CategoryList({
  children,
  endpoint,
  activeCategory = "",
}: CategorySlideProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchCategoryData = async () => {
    setIsLoading(true);
    const data: Category[] = await fetchData(endpoint);
    setCategories(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategoryData();
  }, [endpoint]);

  const handleCategoryClick = (slug: string) => {
    const currentSearch = searchParams.get("recipesearch");
    const params = new URLSearchParams();

    if (slug === activeCategory) {
      if (currentSearch) {
        params.set("recipesearch", currentSearch);
      }
    } else {
      params.set("categorySlug", slug);
      if (currentSearch) {
        params.set("recipesearch", currentSearch);
      }
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/recipes?${queryString}` : "/recipes";
    router.push(newUrl);
  };

  return (
    <div className="px-4 sm:px-6 md:pt-10 xl:px-0 container mx-auto">
      <div className="py-5">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 2500,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <CarouselItem
                    key={`skeleton-${idx}`}
                    className="pl-2 md:pl-4 basis-1/3 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 xl:basis-1/7"
                  >
                    <Skeleton className="w-[140px] h-[140px] rounded-full mx-auto mb-4" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </CarouselItem>
                ))
              : categories.map((category: Category) => (
                  <CarouselItem
                    key={category?.id}
                    className="pl-2 md:pl-4 basis-1/3 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 xl:basis-1/7"
                  >
                    <CategoryCard
                      category={category}
                      isActive={category.slug === activeCategory}
                      onClick={handleCategoryClick}
                    />
                  </CarouselItem>
                ))}
          </CarouselContent>
        </Carousel>
      </div>
      {children}
    </div>
  );
}
