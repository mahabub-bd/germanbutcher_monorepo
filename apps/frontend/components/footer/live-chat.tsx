"use client";
import { cn } from "@/lib/utils";
import type { BusinessSettings } from "@/utils/types";
import { useEffect, useState } from "react";

// Custom SVG Icons with improved accessibility
const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="WhatsApp"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
  </svg>
);

const MessengerIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="Facebook Messenger"
  >
    <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.498 1.744 6.705 4.473 8.758V24l4.086-2.24c1.09.301 2.246.464 3.441.464 6.626 0 12-4.974 12-11.111C24 4.975 18.626 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z" />
  </svg>
);

interface WhatsAppMessengerWidgetProps {
  threshold?: number;
  className?: string;
  business?: BusinessSettings | null;
}

// Floating WhatsApp/Messenger buttons. Clicking a button opens the chat
// directly (with a prefilled WhatsApp message) — no in-widget chat form.
const WhatsAppMessengerWidget = ({
  threshold = 300,
  className,
  business,
}: WhatsAppMessengerWidgetProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const whatsappNumber = business?.whatsappNumber?.trim() || "";
  const messengerUrl = business?.messengerUrl?.trim() || "";

  // Only show chat options the business has configured.
  const hasWhatsApp = Boolean(whatsappNumber);
  const hasMessenger = Boolean(messengerUrl);

  // Scroll visibility logic
  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [threshold]);

  if (!hasWhatsApp && !hasMessenger) return null;

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi, I need some help.");
    window.open(
      `https://wa.me/${whatsappNumber.replace("+", "")}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleMessenger = () => {
    // The stored setting is a full Facebook page URL; only fall back to the
    // m.me/<id> form when a bare page id was entered.
    const url = messengerUrl.startsWith("http")
      ? messengerUrl
      : `https://m.me/${messengerUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn("fixed bottom-15 right-4 z-50 md:mb-10 mb-6", className)}
    >
      {/* Container for both buttons */}
      <div
        className={cn(
          "flex flex-col gap-3 transition-all duration-300",
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        )}
      >
        {/* WhatsApp Button */}
        {hasWhatsApp && (
          <button
            onClick={handleWhatsApp}
            className="group relative p-3 rounded-full text-white shadow-lg transition-all duration-300 bg-green-500 hover:bg-green-600 hover:scale-110"
            aria-label="Send us a WhatsApp message"
          >
            <WhatsAppIcon className="w-6 h-6" />
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Message us on WhatsApp
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
            </div>
          </button>
        )}

        {/* Messenger Button */}
        {hasMessenger && (
          <button
            onClick={handleMessenger}
            className="group relative p-3 rounded-full text-white shadow-lg transition-all duration-300 bg-blue-500 hover:bg-blue-600 hover:scale-110"
            aria-label="Send us a Messenger message"
          >
            <MessengerIcon className="w-6 h-6" />
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Message us on Messenger
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMessengerWidget;
