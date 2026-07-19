import { DesktopHeader } from "./desktop-header";
import { MobileHeader } from "./mobile-header";

export async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-primaryColor shadow-2xl overflow-hidden">
      <DesktopHeader />
      <MobileHeader />
    </header>
  );
}
