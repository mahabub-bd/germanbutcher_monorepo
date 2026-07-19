"use client";

import { links } from "@/constants";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CookingPot,
  Home,
  MapPin,
  Package,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

interface NavLinksProps {
  isMobile?: boolean;
  onClick?: () => void;
}

const mobileNavIcons: Record<string, LucideIcon> = {
  home: Home,
  products: Package,
  recipes: CookingPot,
  "where-to-buy": MapPin,
};

export function NavLinks({ isMobile, onClick }: NavLinksProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback(
    (href: string) => {
      return (e: React.MouseEvent) => {
        e.preventDefault();

        onClick?.();

        startTransition(() => {
          router.push(href);
        });
      };
    },
    [onClick, router]
  );

  const handleMouseEnter = useCallback(
    (href: string) => {
      return () => {
        router.prefetch(href);
      };
    },
    [router]
  );

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href;
        const MobileIcon = mobileNavIcons[link.id] ?? ArrowRight;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={handleClick(link.href)}
            onMouseEnter={handleMouseEnter(link.href)}
            className={cn(
              "block rounded-sm text-lg font-medium transition-colors duration-150",
              isMobile
                ? cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-3 text-base font-semibold",
                    "border-transparent text-gray-700 transition-all duration-200 hover:border-primaryColor/15 hover:bg-primaryColor/5 hover:text-primaryColor",
                    isActive &&
                      "border-primaryColor/15 bg-primaryColor/10 text-primaryColor shadow-sm",
                    isPending && "opacity-70"
                  )
                : cn(
                    "text-white  underline-active",
                    isActive && "active",
                    isPending && "opacity-100"
                  )
            )}
            prefetch={true}
          >
            {isMobile ? (
              <>
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors",
                    isActive && "bg-primaryColor text-white"
                  )}
                >
                  <MobileIcon className="size-5" />
                </span>
                <span className="flex-1">{link.label}</span>
                <ArrowRight
                  className={cn(
                    "size-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5",
                    isActive && "text-primaryColor"
                  )}
                />
              </>
            ) : (
              link.label
            )}
          </Link>
        );
      })}
    </>
  );
}
