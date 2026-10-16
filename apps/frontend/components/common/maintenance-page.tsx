import type { BusinessSettings } from "@/utils/types";
import {
  Beef,
  Gift,
  MessageCircle,
  Phone,
  Settings,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";

interface MaintenancePageProps {
  settings: BusinessSettings | null;
}

const HIGHLIGHTS = [
  { icon: ShoppingCart, label: "Better\nPerformance" },
  { icon: ShieldCheck, label: "Improved\nSecurity" },
  { icon: Settings, label: "New\nFeatures" },
  { icon: Gift, label: "A Smoother\nShopping Experience" },
];


export function MaintenancePage({ settings }: MaintenancePageProps) {
  const endsAt = settings?.maintenanceEndsAt
    ? new Date(settings.maintenanceEndsAt)
    : null;
  const backBy =
    endsAt && !Number.isNaN(endsAt.getTime())
      ? endsAt.toLocaleString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Dhaka",
      })
      : null;

  const businessName = settings?.businessName?.trim();
  const phone = settings?.phone?.trim();
  const whatsapp = settings?.whatsappNumber?.replace(/[^0-9]/g, "");

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50 bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "url('/images/Maintainecebg.webp')" }}
    >
      <div className="mx-auto w-full max-w-4xl space-y-6 text-center xl:max-w-6xl">
        {/* Logo */}
        {settings?.logo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo.url}
            alt={businessName ?? "Store logo"}
            className="mx-auto h-20 w-auto"
          />
        ) : null}



        {/* Heading */}
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          We&rsquo;ll be{" "}
          <span className="text-primaryColor">back soon</span>
        </h1>

        {/* Message */}
        <p className="text-sm leading-6 text-gray-600 sm:text-base">
          {settings?.maintenanceMessage?.trim() ||
            "The store is temporarily offline for scheduled maintenance to serve you better. We're working to improve your shopping experience and will be back in a little while."}
        </p>

        {/* Scheduled return */}
        {backBy ? (
          <p className="text-sm text-gray-500">
            Expected back by{" "}
            <span className="font-semibold text-gray-800">{backBy}</span>
          </p>
        ) : null}

        {/* Highlights */}
        <div className="mx-auto flex w-full max-w-md flex-wrap items-start justify-center gap-x-8 gap-y-4 pt-2 sm:max-w-3xl sm:gap-x-14">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex w-30 flex-col items-center gap-2 sm:w-32"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-red-100/90 text-primaryColor">
                <Icon className="size-5" />
              </span>
              <span className="whitespace-pre-line text-xs font-medium leading-4 text-gray-700">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Contact card */}
        {(phone || whatsapp) && (
          <div className="rounded-2xl bg-white/95 p-5 text-left shadow-sm backdrop-blur-sm sm:p-6">
            <p className="text-base font-bold text-gray-900">
              Need help or have an urgent query?
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              Our team is available and happy to assist you.
            </p>
            <div className="mx-auto mt-3 flex max-w-md flex-col gap-2.5 sm:flex-row sm:justify-center">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-primaryColor/50 px-3.5 py-1.5 text-sm text-primaryColor transition-colors hover:bg-red-50"
                >
                  <Phone className="size-3.5" />
                  <span className="font-semibold">{phone}</span>
                  <span className="text-xs opacity-75">Call us</span>
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3.5 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="size-3.5" />
                  <span className="font-semibold">WhatsApp</span>
                  <span className="text-xs opacity-90">Chat with us</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Divider + sign-off */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="h-px w-24 bg-gray-300" />
          <Beef className="size-5 text-primaryColor" />
          <span className="h-px w-24 bg-gray-300" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">
            Thank you for your patience!
          </p>
          {businessName ? (
            <p className="text-sm text-gray-500">{businessName} Team</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
