import { defaultFeaturesData, FeatureData } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode } from "react";

type CustomerLoveSectionProps = {
  children?: ReactNode;
  title?: string;
  features?: FeatureData[];
  className?: string;
  titleClassName?: string;
  cardClassName?: string;
  gridClassName?: string;
  iconClassName?: string;
};

export default function CustomerLoveSection({
  children,
  title,
  features = defaultFeaturesData,
  className = "",
  titleClassName,
  cardClassName,
  gridClassName,
  iconClassName,
}: CustomerLoveSectionProps) {
  return (
    <section className={cn("w-full py-6 md:py-8", className)}>
      {/* Render children at the top if provided */}
      {children}

      <div className="container mx-auto md:px-4 px-2">
        {/* Title */}
        {title && (
          <div className="text-center mb-12">
            <h2
              className={cn(
                "text-3xl md:text-4xl font-bold text-gray-800 mb-2",
                titleClassName
              )}
            >
              {title}
            </h2>
          </div>
        )}

        {/* Features Grid */}
        <div
          className={cn(
            "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 md:gap-6 gap-2",
            gridClassName
          )}
        >
          {features.map((feature, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "bg-primaryColor/80  rounded-lg md:p-4 p-3 text-center shadow-lg hover:shadow-md transition-shadow duration-300",
                  cardClassName
                )}
              >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div
                    className={cn(
                      "md:size-20 size-16 rounded-full flex items-center justify-center",

                      iconClassName
                    )}
                  >
                    <Image
                      src={feature.iconSrc}
                      alt={feature.iconAlt}
                      width={500}
                      height={500}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3 className="md:text-lg text-sm font-semibold text-gray-50 mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-100 md:text-sm text-xs leading-relaxed text-justify">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
