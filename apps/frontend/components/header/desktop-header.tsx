import type { BusinessSettings } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "../homepage/search/search-bar";
import { NavLinks } from "./nav-links";
import UserActions from "./user-actions";

export function DesktopHeader({
  settings,
}: {
  settings?: BusinessSettings | null;
}) {
  const logoUrl = settings?.logo?.url;
  const businessName = settings?.businessName || "";

  return (
    <div className="hidden bg-gradient-to-r from-[#7a0d0d] via-primaryColor to-[#7a0d0d] lg:block shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2.5 2xl:px-0">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Go to homepage">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${businessName} Logo`}
                title={`${businessName} Logo`}
                width={80}
                height={80}
                priority
                className="w-12 h-12 xl:w-14 xl:h-14 drop-shadow-md"
              />
            ) : (
              businessName && (
                <span className="text-lg font-bold text-white px-2">
                  {businessName}
                </span>
              )
            )}
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            <NavLinks />
          </nav>
        </div>
        <SearchBar />
        <UserActions compact={false} />
      </div>
    </div>
  );
}
