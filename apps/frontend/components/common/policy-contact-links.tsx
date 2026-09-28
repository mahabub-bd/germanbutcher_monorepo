import type { BusinessSettings } from "@/utils/types";

/** Contact links used at the bottom of policy pages. Renders only the
 * channels configured in Business Settings; hides itself when neither
 * phone nor email is set. */
export function PolicyContactLinks({
  settings,
}: {
  settings?: BusinessSettings | null;
}) {
  const phone = settings?.phone?.trim();
  const email = settings?.email?.trim();

  if (!phone && !email) return null;

  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:justify-center sm:space-x-6 sm:space-y-0">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
        >
          📞 {phone}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base break-all"
        >
          ✉️ {email}
        </a>
      )}
    </div>
  );
}
