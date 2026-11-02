import { cn } from "@/lib/utils";
import type { BusinessSettings } from "@/utils/types";
import { Mail, Phone } from "lucide-react";

/** Contact links used at the bottom of policy pages. Renders only the
 * channels configured in Business Settings; hides itself when neither
 * phone nor email is set. */
export function PolicyContactLinks({
  settings,
  className,
}: {
  settings?: BusinessSettings | null;
  className?: string;
}) {
  const phone = settings?.phone?.trim();
  const email = settings?.email?.trim();

  if (!phone && !email) return null;

  const link =
    "inline-flex items-center justify-center gap-2 rounded-full border border-primaryColor/15 bg-white px-4 py-2 text-sm font-medium text-primaryColor shadow-xs transition-colors hover:border-primaryColor/30 hover:bg-primaryColor/[0.06]";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 sm:gap-3",
        className
      )}
    >
      {phone && (
        <a href={`tel:${phone}`} className={link}>
          <Phone className="size-4 shrink-0" />
          <span className="break-all">{phone}</span>
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={link}>
          <Mail className="size-4 shrink-0" />
          <span className="break-all">{email}</span>
        </a>
      )}
    </div>
  );
}
