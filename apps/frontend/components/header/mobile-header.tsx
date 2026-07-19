import Image from "next/image";
import Link from "next/link";

import { getUser } from "@/actions/auth";
import { GermanbutcherLogo } from "@/public/images";
import { SearchBar } from "../homepage/search/search-bar";
import { MobileMenu } from "./mobile-menu";

export async function MobileHeader() {
  const user = await getUser();
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-primaryColor shadow-lg">
      <div className="flex items-center justify-between py-2 px-2">
        <div>
          <Link
            href="/"
            className="flex items-center justify-center size-16 "
            aria-label="Go to homepage"
          >
            <Image
              src={
                GermanbutcherLogo ||
                "/placeholder.svg?height=48&width=48&query=German Butcher logo" ||
                "/placeholder.svg" ||
                "/placeholder.svg"
              }
              alt="German Butcher logo"
              title="German Butcher logo"
              width={60}
              height={60}
              className="max-w-full max-h-full object-contain"
            />
          </Link>
        </div>

        <SearchBar />
        <MobileMenu user={user} />
      </div>
    </header>
  );
}
