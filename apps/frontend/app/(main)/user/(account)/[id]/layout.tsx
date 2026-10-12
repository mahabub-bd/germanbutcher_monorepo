import React from "react";

import { getUser } from "@/actions/auth";
import MobileSidebar from "@/components/common/MobileSidebar";

import Sidebar from "@/components/common/Sidebar";
import ProfileBreadcrumb from "@/components/user-account/profile-breadcrumb";
import {
  Bell,
  Headphones,
  Heart,
  LifeBuoy,
  MapPin,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";

interface UserProfileLayoutProps {
  children: React.ReactNode;
}

const UserProfileLayout: React.FC<UserProfileLayoutProps> = async ({
  children,
}) => {
  const user = await getUser();
  const navItems = [
    {
      icon: <User className="w-5 h-5" />,
      label: "Profile",
      href: `/user/${user.id}/profile`,
      description: "Manage your personal information",
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: "Orders",
      href: `/user/${user.id}/orders`,
      description: "Track and manage your orders",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Addresses",
      href: `/user/${user.id}/addresses`,
      description: "Manage shipping addresses",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: "Wishlist",
      href: `/user/${user.id}/wishlist`,
      description: "Your saved items",
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: "Reviews",
      href: `/user/${user.id}/reviews`,
      description: "Reviews you've written",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      href: `/user/${user.id}/notifications`,
      description: "Your notifications",
    },
    {
      icon: <LifeBuoy className="w-5 h-5" />,
      label: "Support",
      href: `/user/${user.id}/support`,
      description: "Your support requests",
    },
  ];

  return (
    <div className="min-h-screen py-4 ">
      <ProfileBreadcrumb navItems={navItems} />

      <div className="container mx-auto md:px-0 px-4 mt-4">
        <div className="grid grid-cols-12 md:gap-8 gap-4">
          {/* Desktop Sidebar */}
          <div className="col-span-12">
            <div className="hidden lg:block sticky top-8">
              <div className=" shadow-md rounded-md  overflow-hidden">
                {/* User Profile Header */}
                <div className="bg-gradient-to-br from-primaryColor via-[#6d0000] to-primaryColor p-4 text-white">
                  <div className="flex items-center space-x-3">
                    {user?.profilePhoto?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profilePhoto.url}
                        alt={user?.name || "Profile"}
                        className="w-12 h-12 shrink-0 rounded-full border border-white/40 object-contain bg-white"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">
                        {user?.name || "User"}
                      </h3>
                      <p className="text-white/80 text-sm">Account Settings</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="p-0">
                  <Sidebar navItems={navItems} />
                </div>
              </div>
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden mb-4">
              <div className="bg-white rounded-md shadow-md overflow-hidden">
                <div className="flex items-center gap-2.5 p-3 pb-1">
                  {user?.profilePhoto?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePhoto.url}
                      alt={user?.name || "Profile"}
                      className="w-9 h-9 shrink-0 rounded-full border border-gray-100 object-contain bg-white"
                    />
                  ) : (
                    <div className="w-9 h-9 shrink-0 bg-primaryColor rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {user?.name || "User"}
                    </h3>
                    <p className="text-gray-500 text-xs">Account Settings</p>
                  </div>
                </div>
                <MobileSidebar navItems={navItems} />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12">
            <div className="shadow-md rounded-md  min-h-[600px]">
              <main className="md:p-4 p-2">{children}</main>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Floating Button (Mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button className="bg-gradient-to-r from-primaryColor to-red-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <Headphones className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UserProfileLayout;
