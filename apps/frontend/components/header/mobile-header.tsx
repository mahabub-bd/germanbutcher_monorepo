import Image from "next/image";
import Link from "next/link";

import { getUser } from "@/actions/auth";
import type { BusinessSettings } from "@/utils/types";
import { SearchBar } from "../homepage/search/search-bar";
import { MobileMenu } from "./mobile-menu";

export async function MobileHeader({
  settings,
}: {
  settings?: BusinessSettings | null;
}) {
  const user = await getUser();
  const logoUrl = settings?.logo?.url;
  const businessName = settings?.businessName || "";

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-primaryColor shadow-lg">
      <div className="flex items-center justify-between py-2 px-2">
        <div>
          <Link
            href="/"
            className="flex items-center justify-center size-16 "
            aria-label="Go to homepage"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${businessName} logo`}
                title={`${businessName} logo`}
                width={60}
                height={60}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              businessName && (
                <span className="text-base font-bold text-white">
                  {businessName}
                </span>
              )
            )}
          </Link>
        </div>

        <SearchBar />
        <MobileMenu user={user} settings={settings} />
      </div>
    </header>
  );
}
