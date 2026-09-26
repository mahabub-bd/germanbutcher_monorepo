"use client";

import { FALLBACK_IMAGE } from "@/utils/image-fallback";
import type { Attachment, Product } from "@/utils/types";
import { Leaf, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";

interface ProductImageGalleryProps {
  product: Product;
}

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    product?.attachment?.url
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isMainImageLoading, setIsMainImageLoading] = useState(true);
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(
    new Set(
      [
        product?.attachment?.url,
        ...(product?.gallery?.attachments?.map((img: Attachment) => img.url) ||
          []),
      ].filter((url): url is string => Boolean(url))
    )
  );
  const imageRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    if (!imageRef.current) return;
    setIsZoomed(false);
  };

  const handleMainImageLoad = () => {
    setIsMainImageLoading(false);
  };

  const handleThumbnailLoad = (url?: string) => {
    if (!url) return;
    setLoadingThumbnails((prev) => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  };

  const handleImageChange = (url?: string) => {
    setSelectedImage(url);
    setIsMainImageLoading(true);
  };

  return (
    <div className="sticky top-16">
      <div
        ref={imageRef}
        className="relative w-full aspect-[3/2] bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Loading Skeleton for Main Image */}
        {isMainImageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Main Image */}
        <Image
          src={selectedImage || FALLBACK_IMAGE}
          alt={product.name}
          title={product.name}
          fill
          className="object-cover transition-transform duration-300"
          onLoad={handleMainImageLoad}
        />

        {/* Zoomed Image Overlay */}
        {isZoomed && !isMainImageLoading && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `url(${selectedImage || FALLBACK_IMAGE}) no-repeat`,
              backgroundSize: "200%",
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              opacity: 0.8,
            }}
          />
        )}

        {/* Trust badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1.5 sm:gap-2">

          <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-green-100 text-green-800 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold shadow-sm">
            <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            100% Halal
          </span>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-3 right-3 z-10">
          <div className="bg-white/95 rounded-full p-2 shadow-md">
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Thumbnail Gallery */}
      <div className="mt-4">
        <div
          ref={thumbnailsRef}
          className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth px-1"
        >
          <div
            className={`relative flex-shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden cursor-pointer border-1 transition-all ${selectedImage === product?.attachment?.url
              ? "border-primaryColor ring-red-100"
              : "border-gray-200 hover:border-gray-300"
              }`}
            onClick={() => handleImageChange(product?.attachment?.url)}
          >
            {loadingThumbnails.has(product?.attachment?.url) && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <Image
              src={product?.attachment?.url || FALLBACK_IMAGE}
              alt={product?.name}
              title={product?.name}
              fill
              className="object-cover"
              onLoad={() => handleThumbnailLoad(product?.attachment?.url)}
            />
          </div>

          {product?.gallery?.attachments?.map((image: Attachment) => (
            <div
              key={image.id}
              className={`relative flex-shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === image.url
                ? "border-primaryColor ring-2 ring-red-100"
                : "border-gray-200 hover:border-gray-300"
                }`}
              onClick={() => handleImageChange(image.url)}
            >
              {loadingThumbnails.has(image.url) && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <Image
                src={image.url || FALLBACK_IMAGE}
                alt={image.fileName}
                title={image.fileName}
                fill
                className="object-cover"
                onLoad={() => handleThumbnailLoad(image.url)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
