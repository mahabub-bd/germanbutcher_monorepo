import type { BusinessSettings } from "@/utils/types";
import { MessageCircle, Phone, Wrench } from "lucide-react";

interface MaintenancePageProps {
  settings: BusinessSettings | null;
}

/** Full-screen takeover shown on storefront routes while maintenance mode is
 * active. Server-safe (no hooks); reads business info for branding/contact. */
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* Logo + business name */}
        {settings?.logo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo.url}
            alt={settings.businessName ?? "Store logo"}
            className="mx-auto h-16 w-auto"
          />
        ) : null}
        {settings?.businessName ? (
          <p className="text-sm font-medium text-muted-foreground">
            {settings.businessName}
          </p>
        ) : null}

        {/* Heading */}
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
          <Wrench className="size-8 text-primaryColor" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          We&rsquo;ll be back soon
        </h1>

        {/* Message */}
        <p className="text-muted-foreground">
          {settings?.maintenanceMessage?.trim() ||
            "The store is briefly offline for maintenance. Please check back in a little while."}
        </p>

        {/* Scheduled return */}
        {backBy ? (
          <p className="text-sm text-muted-foreground">
            Expected back by{" "}
            <span className="font-medium text-foreground">{backBy}</span>
          </p>
        ) : null}

        {/* Contact */}
        {(settings?.phone || settings?.whatsappNumber) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {settings?.phone ? (
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Phone className="size-4" />
                {settings.phone}
              </a>
            ) : null}
            {settings?.whatsappNumber ? (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
