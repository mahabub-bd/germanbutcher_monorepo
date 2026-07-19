"use client";

import { Badge } from "@/components/ui/badge";
import type { Attachment, Product } from "@/utils/types";
import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";

interface ProductImageGalleryProps {
  product: Product;
}

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(product?.attachment?.url);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isMainImageLoading, setIsMainImageLoading] = useState(true);
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(
    new Set([
      product.attachment.url,
      ...(product?.gallery?.attachments?.map((img: Attachment) => img.url) ||
        []),
    ])
  );
  const imageRef = useRef<HTMLDivElement>(null);

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
    setIsZoomed(false);
  };

  const handleMainImageLoad = () => {
    setIsMainImageLoading(false);
  };

  const handleThumbnailLoad = (url: string) => {
    setLoadingThumbnails((prev) => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  };

  const handleImageChange = (url: string) => {
    setSelectedImage(url);
    setIsMainImageLoading(true);
  };

  return (
    <div className="sticky top-16">
      <div
        ref={imageRef}
        className="relative w-full aspect-[3/2] bg-white rounded-sm overflow-hidden shadow-md border cursor-zoom-in"
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
          src={selectedImage || "/placeholder.svg"}
          alt={product.name}
          title={product.name}
          fill
          className="object-cover transition-transform duration-300 aspect-[3/2]"
          onLoad={handleMainImageLoad}
        />

        {/* Zoomed Image Overlay */}
        {isZoomed && !isMainImageLoading && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `url(${selectedImage || "/placeholder.svg"}) no-repeat`,
              backgroundSize: "200%",
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              opacity: 0.8,
            }}
          />
        )}

        {/* Zoom Lens */}
        {isZoomed && !isMainImageLoading && (
          <div
            className="absolute w-32 h-32 border-2 border-white rounded-full pointer-events-none shadow-lg"
            style={{
              left: `calc(${zoomPosition.x}% - 64px)`,
              top: `calc(${zoomPosition.y}% - 64px)`,
              background: `url(${selectedImage || "/placeholder.svg"}) no-repeat`,
              backgroundSize: "400%",
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              transform: "translate(0, 0)",
            }}
          />
        )}

        {product.stock <= 5 && product.stock > 0 && (
          <Badge className="absolute top-3 right-3 bg-orange-500 text-white z-10">
            Only {product.stock} left
          </Badge>
        )}
      </div>

      {/* Thumbnail Gallery */}
      <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
        <div
          className={`relative flex-shrink-0 w-24 h-16 rounded-sm overflow-hidden cursor-pointer border-1 transition-all ${
            selectedImage === product?.attachment?.url
              ? "border-primaryColor  ring-red-100"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => handleImageChange(product?.attachment?.url)}
        >
          {/* Thumbnail Skeleton */}
          {loadingThumbnails.has(product?.attachment?.url) && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          <Image
            src={product?.attachment?.url || "/placeholder.svg"}
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
            className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
              selectedImage === image.url
                ? "border-primaryColor ring-2 ring-red-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleImageChange(image.url)}
          >
            {/* Thumbnail Skeleton */}
            {loadingThumbnails.has(image.url) && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.fileName}
              title={image.fileName}
              fill
              className="object-cover aspect-[3/2]"
              onLoad={() => handleThumbnailLoad(image.url)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
