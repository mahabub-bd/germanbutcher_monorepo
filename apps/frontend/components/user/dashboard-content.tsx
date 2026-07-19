"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "sonner";
import { logout } from "@/actions/auth";
import { UserTypes } from "@/utils/types";

interface DashboardContentProps {
  user: UserTypes;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/auth");
    } catch (error) {
      toast.error("Failed to log out");
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "User"}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {user?.name || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {user?.mobileNumber || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Account Type</p>
                <p className="text-sm text-muted-foreground">
                  {user?.isAdmin ? "Admin" : "User"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/profile")}
            >
              Edit Profile
            </Button>
          </CardFooter>
        </Card>

        {/* Add more cards for dashboard functionality */}
      </div>

      <div className="flex justify-end">
        <Button variant="destructive" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
