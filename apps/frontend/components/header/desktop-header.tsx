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
    <div className="hidden bg-gradient-to-br from-primaryColor via-[#6d0000] to-primaryColor  lg:block">
      <div className="container mx-auto flex justify-between items-center  2xl:px-0 px-4 ">
        <div className="flex items-center">
          <Link href="/" className="flex items-center mr-6">
            {logoUrl ? (
              <div className="p-2">
                <Image
                  src={logoUrl}
                  alt={`${businessName} Logo`}
                  title={`${businessName} Logo`}
                  width={80}
                  height={80}
                  className="w-10 h-10 lg:w-20 lg:h-20"
                />
              </div>
            ) : (
              businessName && (
                <span className="text-lg font-bold text-white px-2">
                  {businessName}
                </span>
              )
            )}
          </Link>

          <nav className="flex items-center space-x-8 ml-20">
            <NavLinks />
          </nav>
        </div>
        <SearchBar />
        <div className="flex items-center space-x-6">
          <UserActions compact={false} />
        </div>
      </div>
    </div>
  );
}
