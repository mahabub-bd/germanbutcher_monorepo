import type { BusinessSettings } from "@/utils/types";
import { DesktopHeader } from "./desktop-header";
import { MobileHeader } from "./mobile-header";

export async function Header({
  settings,
}: {
  settings?: BusinessSettings | null;
}) {
  return (
    <header className="sticky top-0 z-50 w-full bg-primaryColor shadow-2xl overflow-hidden">
      <DesktopHeader settings={settings} />
      <MobileHeader settings={settings} />
    </header>
  );
}
