import { defaultFeaturesData, FeatureData } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode } from "react";

type LicenseCertificationsSectionProps = {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  features?: FeatureData[];
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  cardClassName?: string;
  gridClassName?: string;
  iconClassName?: string;
  showBadges?: boolean;
  layout?: "grid" | "masonry" | "card";
};

export default function LicenseCertificationsSection({
  children,

  features = defaultFeaturesData,
  className = "",

  cardClassName,
  gridClassName,
  iconClassName,
  showBadges = true,
  layout = "grid",
}: LicenseCertificationsSectionProps) {
  const getBadgeColor = (iconBgColor?: string) => {
    const colors = {
      green: "bg-green-500/20 text-green-700 border-green-200",
      blue: "bg-blue-500/20 text-blue-700 border-blue-200",
      orange: "bg-orange-500/20 text-orange-700 border-orange-200",
      purple: "bg-purple-500/20 text-purple-700 border-purple-200",
      red: "bg-red-500/20 text-red-700 border-red-200",
      teal: "bg-teal-500/20 text-teal-700 border-teal-200",
    };
    return (
      colors[iconBgColor as keyof typeof colors] ||
      "bg-gray-500/20 text-gray-700 border-gray-200"
    );
  };

  const getIconBackground = (iconBgColor?: string) => {
    const colors = {
      green: "bg-gradient-to-br from-green-400 to-green-600",
      blue: "bg-gradient-to-br from-blue-400 to-blue-600",
      orange: "bg-gradient-to-br from-orange-400 to-orange-600",
      purple: "bg-gradient-to-br from-purple-400 to-purple-600",
      red: "bg-gradient-to-br from-red-400 to-red-600",
      teal: "bg-gradient-to-br from-teal-400 to-teal-600",
    };
    return (
      colors[iconBgColor as keyof typeof colors] ||
      "bg-gradient-to-br from-gray-400 to-gray-600"
    );
  };

  return (
    <section
      className={cn(
        "w-full py-12 md:py-20 relative overflow-hidden",
        className
      )}
    >
      {children}

      <div className="container mx-auto px-4 relative z-10">
        {/* Certifications Grid */}
        <div
          className={cn(
            layout === "grid" &&
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8",
            layout === "masonry" &&
              "columns-1 md:columns-2 lg:columns-4 gap-8 space-y-8",
            layout === "card" && "grid grid-cols-1 md:grid-cols-2 gap-8",
            gridClassName
          )}
        >
          {features.map((feature, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 hover:scale-105 hover:-translate-y-2",
                  "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
                  cardClassName
                )}
              >
                {/* Certification Badge */}
                {showBadges && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm",
                        getBadgeColor(feature.iconBgColor)
                      )}
                    >
                      CERTIFIED
                    </div>
                  </div>
                )}

                {/* Icon Container */}
                <div className="flex justify-center mb-6">
                  <div
                    className={cn(
                      "relative md:w-24 md:h-24 w-20 h-20 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300",
                      getIconBackground(feature.iconBgColor),
                      iconClassName
                    )}
                  >
                    {/* Icon Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <Image
                      src={feature.iconSrc}
                      alt={feature.iconAlt}
                      width={400}
                      height={400}
                      className="w-12 h-12 md:w-14 md:h-14 object-contain relative z-10 drop-shadow-lg"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Accent */}
                <div
                  className={cn(
                    "absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 rounded-full transition-all duration-300 group-hover:w-3/4",
                    getIconBackground(feature.iconBgColor)
                  )}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
