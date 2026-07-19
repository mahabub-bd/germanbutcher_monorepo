"use client";

import { logout } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { authResponse, UserTypes } from "@/utils/types";
import { LayoutDashboard, Loader2, LogOut, Shield, User, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface MobileAuthProps {
  user: UserTypes;
  onClose?: () => void;
  className?: string;
}

const generateInitials = (name: string): string => {
  if (!name?.trim()) return "US";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
};

const UserProfileSection: React.FC<{
  user: UserTypes;
  isLoading: boolean;
  onLogout: () => void;
  onClose?: () => void;
}> = ({ user, isLoading, onLogout, onClose }) => {
  const initials = useMemo(() => generateInitials(user.name), [user.name]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                {user?.profilePhoto?.url && (
                  <AvatarImage
                    src={user.profilePhoto.url}
                    alt={`${user.name || "User"}'s avatar`}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <AvatarFallback className="font-medium text-sm bg-gradient-to-br from-primaryColor to-secondaryColor text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Online status indicator */}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 truncate text-sm">
                  {user.name || "Anonymous User"}
                </h4>
                {user.isAdmin && (
                  <Shield className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                )}
              </div>
              {user.email && (
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" side="top">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || "Anonymous User"}
            </p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/user/${user.id}/profile`}
            className="cursor-pointer"
            onClick={onClose}
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={user.isAdmin ? "/admin/dashboard" : "/user/dashboard"}
            className="cursor-pointer"
            onClick={onClose}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>{user.isAdmin ? "Admin Dashboard" : "Dashboard"}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          disabled={isLoading}
          className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950 dark:focus:text-red-400 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{isLoading ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LoginSection: React.FC<{
  onSignIn: () => void;
  onClose?: () => void;
}> = ({ onSignIn, onClose }) => (
  <div className="flex items-center gap-2">
    <Button
      onClick={() => {
        onSignIn();
        onClose?.();
      }}
      className="h-10 flex-1 items-center justify-center gap-2 bg-primaryColor hover:bg-primaryColor/90 text-white rounded-lg font-medium transition-all duration-200"
    >
      <User className="h-4 w-4" />
      <span>Sign In</span>
    </Button>

    <Link
      href="/auth/sign-up"
      onClick={onClose}
      className="flex h-10 flex-1 items-center justify-center rounded-lg border border-primaryColor px-3 text-sm font-medium text-primaryColor transition-colors hover:bg-primaryColor/5"
    >
      Sign Up
    </Link>
  </div>
);

const MobileAuth: React.FC<MobileAuthProps> = ({
  user,
  onClose,
  className,
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
      const result: authResponse = await logout();

      if (result.statusCode === 200) {
        toast.success("Logged out successfully");
        onClose?.();
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
  }, [isLoggingOut, router, onClose]);

  if (!user) {
    return (
      <div className={cn("w-full", className)}>
        <LoginSection onSignIn={handleSignIn} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <UserProfileSection
        user={user}
        isLoading={isLoggingOut}
        onLogout={handleLogout}
        onClose={onClose}
      />
    </div>
  );
};

export default MobileAuth;
