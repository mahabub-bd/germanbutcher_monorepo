"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@/utils/types";

import { CreditCard, Mail, Shield } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

import { formatDateTime } from "@/lib/utils";
import { ActivityLog } from "./activity-log";
import { SecuritySettings } from "./security-settings";

interface AdminProfileViewProps {
  user: User;
}

export default function AdminProfileView({ user }: AdminProfileViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user?.mobileNumber || "",
    roles: user?.role,
  });

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("")
      .substring(0, 2);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In a real app, you would call your API here
      // await updateProfile(formData)
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container py-6 space-y-6 ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Member since:</span>
          <span className="font-medium text-foreground">
            {user.createdAt ? formatDateTime(user.createdAt) : "N/A"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-background">
              {user?.profilePhoto?.url ? (
                <AvatarImage
                  src={user?.profilePhoto?.url || "/placeholder.svg"}
                  alt={user.name || "Admin"}
                />
              ) : (
                <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                  {user.name ? getInitials(user.name) : "AD"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle>{user.name || "Admin User"}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium capitalize">
                  {user?.role.rolename}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>ID: {user.id || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>

              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    id="profile-form"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" value={user?.role.rolename} disabled />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    type="submit"
                    form="profile-form"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Update your profile picture</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
                  <Avatar className="h-24 w-24">
                    {user?.profilePhoto?.url ? (
                      <AvatarImage
                        src={user?.profilePhoto?.url || "/placeholder.svg"}
                        alt={user.name || "Admin"}
                      />
                    ) : (
                      <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                        {user.name ? getInitials(user.name) : "AD"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      Upload New Picture
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      Remove Picture
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="pt-4">
              <SecuritySettings />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="pt-4">
              <ActivityLog />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
