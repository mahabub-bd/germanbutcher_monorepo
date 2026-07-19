"use client";

import { logout } from "@/actions/auth";
import { clearLocalCart, clearLocalCoupon } from "@/utils/cart-storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { authResponse, UserTypes } from "@/utils/types";
import {
  Heart,
  Loader2,
  LogOut,
  Settings,
  Shield,
  User,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface AuthBtnProps {
  user: UserTypes | null;
  compact?: boolean;
  className?: string;
  showWishlist?: boolean;
}

interface MenuItemConfig {
  href: string;
  icon: React.ReactNode;
  label: string;
  condition?: boolean;
}

// Constants
const AVATAR_SIZES = {
  compact: "h-8 w-8",
  default: "h-9 w-9",
} as const;

const BUTTON_SIZES = {
  compact: "h-8 w-8",
  default: "h-9 w-9",
} as const;

/**
 * Utility function to generate user initials from name
 */
const generateInitials = (name: string): string => {
  if (!name?.trim()) return "US";

  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
};

/**
 * Login Button Component - shown when user is not authenticated
 */
const LoginButton: React.FC<{
  compact: boolean;
  className?: string;
  onSignIn: () => void;
}> = ({ compact, className, onSignIn }) => (
  <Button
    className={cn(
      "flex items-center justify-center cursor-pointer rounded-full transition-all duration-200",
      compact
        ? "h-8 w-8 p-0"
        : "gap-2 border border-amber-50 bg-primaryColor hover:bg-primaryColor hover:opacity-90",
      className
    )}
    onClick={onSignIn}
    aria-label="Sign in to your account"
  >
    <User className={cn("lg:h-6 w-5 h-5 lg:w-6")} />
    {!compact && <span className="hidden sm:inline text-lg">Login</span>}
  </Button>
);

/**
 * User Avatar Component - displays user avatar with online indicator
 */
const UserAvatar: React.FC<{
  user: UserTypes;
  compact: boolean;
  isLoading: boolean;
}> = ({ user, compact, isLoading }) => {
  const initials = useMemo(() => generateInitials(user.name), [user.name]);
  const avatarSize = compact ? AVATAR_SIZES.compact : AVATAR_SIZES.default;

  return (
    <div className="relative">
      <Avatar className={cn(avatarSize)}>
        {user?.profilePhoto?.url && (
          <AvatarImage
            src={user.profilePhoto.url}
            alt={`${user.name || "User"}'s avatar`}
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <AvatarFallback
          className={cn(
            "font-medium ring-2 ring-white bg-gradient-to-br from-primaryColor to-secondaryColor text-white",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Online status indicator */}
      <span
        className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"
        aria-label="User is online"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
          <Loader2 className="h-3 w-3 animate-spin text-white" />
        </div>
      )}
    </div>
  );
};

/**
 * User Info Header Component - displays user name and email in dropdown
 */
const UserInfoHeader: React.FC<{ user: UserTypes }> = ({ user }) => (
  <DropdownMenuLabel className="font-normal">
    <div className="flex flex-col space-y-1">
      <p className="text-sm font-medium leading-none truncate">
        {user.name || "Anonymous User"}
      </p>
      {user.email && (
        <p className="text-xs leading-none text-muted-foreground truncate">
          {user.email}
        </p>
      )}
      {user.isAdmin && (
        <div className="flex items-center gap-1 mt-1">
          <Shield className="h-3 w-3 text-amber-500" />
          <span className="text-xs text-amber-600 font-medium">Admin</span>
        </div>
      )}
    </div>
  </DropdownMenuLabel>
);

/**
 * Menu Item Component - reusable dropdown menu item
 */
const MenuItem: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}> = ({ href, icon, label, className }) => (
  <DropdownMenuItem asChild>
    <Link
      href={href}
      className={cn(
        "flex cursor-pointer items-center transition-colors",
        className
      )}
      prefetch={false}
    >
      {icon}
      <span>{label}</span>
    </Link>
  </DropdownMenuItem>
);

/**
 * Main AuthBtn Component
 */
const AuthBtn: React.FC<AuthBtnProps> = ({
  user,
  compact = false,
  className,
  showWishlist = true,
}) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignIn = useCallback(() => {
    router.push("/auth/sign-in");
  }, [router]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      // Clear local storage cart and coupon
      clearLocalCart();
      clearLocalCoupon();

      const result: authResponse = await logout();

      if (result.statusCode === 200) {
        toast.success("Logged out successfully");
        router.push("/auth/sign-in");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to log out");
      }
    } catch (error) {
      toast.error("An error occurred while logging out");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  // Menu items configuration
  const menuItems: MenuItemConfig[] = useMemo(
    () => [
      {
        href: `/user/${user?.id}/profile`,
        icon: <UserCircle className="mr-2 h-4 w-4" />,
        label: "Profile",
      },
      {
        href: user?.isAdmin ? "/admin/dashboard" : "/user/dashboard",
        icon: <Settings className="mr-2 h-4 w-4" />,
        label: user?.isAdmin ? "Admin Dashboard" : "Dashboard",
        condition: !!user?.isAdmin,
      },
      {
        href: "/wishlist",
        icon: <Heart className="mr-2 h-4 w-4" />,
        label: "Wishlist",
        condition: compact && showWishlist,
      },
    ],
    [user?.id, user?.isAdmin, compact, showWishlist]
  );

  // Show login button if user is not authenticated
  if (!user) {
    return (
      <LoginButton
        compact={compact}
        className={className}
        onSignIn={handleSignIn}
      />
    );
  }

  const buttonSize = compact ? BUTTON_SIZES.compact : BUTTON_SIZES.default;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative rounded-full border border-primaryColor/20 p-0 hover:bg-primaryColor/5 transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-primaryColor focus-visible:ring-offset-2",
            "text-primaryColor disabled:opacity-50",
            buttonSize,
            className
          )}
          disabled={isLoggingOut}
          aria-label={`User menu for ${user.name || "user"}`}
        >
          <UserAvatar user={user} compact={compact} isLoading={isLoggingOut} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 animate-in slide-in-from-top-2"
        align="end"
        sideOffset={5}
        forceMount
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <UserInfoHeader user={user} />

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {menuItems.map((item) => {
            if (item.condition === false) return null;

            return (
              <MenuItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
              />
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "text-red-600 cursor-pointer transition-colors",
            "focus:bg-red-50 focus:text-red-600",
            "dark:focus:bg-red-950 dark:focus:text-red-400",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthBtn;
