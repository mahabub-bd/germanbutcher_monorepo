import { Mail } from "lucide-react";
import Image from "next/image";
import { Subscription } from "./subscriber";

export function NewsletterSection() {
  return (
    <section className="relative w-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/red-mobile-bg.png"
          alt="Abstract red and yellow background"
          width={2000}
          height={800}
          className="w-full h-full object-cover"
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                {/* Icon */}
                <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                  <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 lg:p-5 rounded-2xl shadow-lg border border-white/30">
                    <Mail
                      size={40}
                      className="text-white sm:w-12 sm:h-12 lg:w-16 lg:h-16"
                    />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h2 className="font-bold text-xl sm:text-3xl lg:text-4xl xl:text-5xl mb-3 lg:mb-4 text-white leading-tight">
                    Subscribe Newsletter
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium text-white/90 leading-relaxed max-w-md">
                    We let you receive the latest information on as well as
                    offers, tips, and updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Content - Subscription Form */}
            <div className="w-full">
              <div className="flex justify-start lg:justify-end">
                <div className="w-full">
                  <Subscription />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
