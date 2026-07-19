"use client";

import { Button } from "@/components/ui/button";
import type { Banner } from "@/utils/types";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState, type TouchEvent } from "react";

interface CarouselBannerClientProps {
  banners: Banner[];
  autoPlayInterval?: number;
  showControls?: boolean;
  priority?: boolean;
}

const ControlButton = memo(
  ({
    direction,
    onClick,
    className,
  }: {
    direction: "prev" | "next";
    onClick: () => void;
    className?: string;
  }) => (
    <Button
      variant="outline"
      size="icon"
      className={`backdrop-blur-sm border-white/20 rounded-full z-20 shadow-lg transition-all duration-200 bg-black/40 hover:bg-black/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50 w-10 h-10 sm:w-12 sm:h-12 hidden sm:flex ${className}`}
      onClick={onClick}
      aria-label={`${direction === "prev" ? "Previous" : "Next"} slide`}
    >
      {direction === "prev" ? (
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      ) : (
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      )}
    </Button>
  )
);
ControlButton.displayName = "ControlButton";

export function CarouselBannerClient({
  banners,
  autoPlayInterval = 2000,
  showControls = true,
  priority = true,
}: CarouselBannerClientProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // touch swipe
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchThreshold = 50; // px

  // autoplay
  useEffect(() => {
    if (!banners.length) return;
    if (isPaused) return;

    const tick = () =>
      setCurrent((prev) => {
        return (prev + 1) % banners.length;
      });

    const id = window.setInterval(tick, autoPlayInterval);

    return () => {
      window.clearInterval(id);
    };
  }, [banners, autoPlayInterval, isPaused]);

  // keyboard navigation & space to toggle play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [banners]);

  // preloads next image for performance
  useEffect(() => {
    if (!banners.length) return;
    const nextIndex = (current + 1) % banners.length;
    const nextUrl = banners[nextIndex]?.image?.url;
    if (nextUrl) {
      const img = new window.Image();
      img.src = nextUrl;
    }
  }, [current, banners]);

  const prev = () => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  };
  const next = () => {
    setCurrent((c) => (c + 1) % banners.length);
  };

  const onMouseEnter = () => setIsPaused(true);
  const onMouseLeave = () => setIsPaused(false);
  const onFocusIn = () => setIsPaused(true);
  const onFocusOut = () => setIsPaused(false);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > touchThreshold) {
      if (delta > 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[350px] sm:h-[400px] max-h-[500px] 2xl:h-[500px] focus-within:outline-none"
      role="region"
      aria-label="Featured banners carousel"
      aria-live="polite"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-carousel
    >
      <style jsx>{`
        .carousel-slide {
          transition: opacity 700ms ease-in-out;
          will-change: opacity;
        }
        .dots {
          display: flex;
          gap: 0.5rem;
        }
        .dot {
          width: 32px;
          height: 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.4);
        }
        .dot.active {
          background: var(--primary-color, rgb(0, 0, 0));
        }
      `}</style>

      {/* Preload next image */}
      {banners[(current + 1) % banners.length]?.image?.url && (
        <link
          rel="preload"
          as="image"
          href={banners[(current + 1) % banners.length].image!.url}
        />
      )}

      {/* Slides: stacked absolutely and fade via opacity */}
      <div className="relative w-full h-full overflow-hidden">
        {banners.map((slide, idx) => {
          const isActive = idx === current;
          return (
            <div
              key={slide.id}
              className={`carousel-slide absolute inset-0 w-full h-full ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              aria-hidden={!isActive}
            >
              <Image
                src={
                  slide?.image?.url ||
                  "/placeholder.svg?height=600&width=1200&query=banner"
                }
                alt={slide.title || ""}
                title={slide.title || ""}
                fill
                className="object-cover object-center"
                priority={priority && idx === 0}
                loading={priority && idx === 0 ? "eager" : "lazy"}
                sizes="100vw"
                quality={idx === 0 ? 85 : 70}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {/* Content */}
              <div className="absolute top-0 left-0 p-3 sm:p-4 lg:p-6 xl:p-8 w-full h-full text-white">
                <div className="flex container items-center justify-center sm:justify-start h-full xl:px-24">
                  <div className="max-w-3xl text-center sm:text-left">
                    <h2 className="text-2xl font-castor sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl mb-1 sm:mb-2 gradient-text leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium mb-3 sm:mb-4 lg:mb-6 text-gray-100">
                      {slide.description}
                    </p>
                    {slide.targetUrl && (
                      <Button
                        asChild
                        variant="secondary"
                        className="mt-2 sm:mt-4 lg:mt-6 py-1.5 sm:py-2 px-3 sm:px-4 lg:px-6 rounded-lg text-sm sm:text-base lg:text-lg font-semibold bg-primaryColor hover:bg-secondaryColor text-white transition-colors duration-200"
                      >
                        <Link
                          href={slide.targetUrl}
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 sm:gap-2"
                        >
                          Explore Products
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls (hidden on small screens) */}
      {showControls && banners.length > 1 && (
        <>
          <ControlButton
            direction="prev"
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2"
          />
          <ControlButton
            direction="next"
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2"
          />
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <div className="dots pointer-events-auto">
          {banners.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`dot ${i === current ? "active" : ""}`}
              style={{
                border: "none",
                cursor: "pointer",
                opacity: i === current ? 1 : 0.6,
              }}
            />
          ))}
        </div>
      </div>

      {/* Accessibility: screen reader hints */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {current + 1} of {banners.length}: {banners[current]?.title}
      </div>
      <div className="sr-only">
        Use arrow keys to navigate slides, space bar to pause auto-play. Swipe
        left or right on touch devices.
      </div>
    </section>
  );
}
