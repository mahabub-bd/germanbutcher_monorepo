"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { formPostData, patchData } from "@/utils/api-utils";
import { User } from "@/utils/types";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Shield,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "../../lib/utils";
import { Button } from "../ui/button";

interface AccountInfoProps {
  user: User;
}

// Read-only display field on the page
function DisplayField({
  label,
  icon: Icon,
  value,
  locked = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
  locked?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primaryColor/10">
          <Icon className="w-4 h-4 text-primaryColor" />
        </div>
        {label}
      </label>
      <div className="min-h-12 flex items-center px-4 py-3 bg-gray-50 rounded-lg border">
        <p className="text-sm text-gray-800 font-medium truncate">
          {value || "Not provided"}
        </p>
        {locked && (
          <span className="ml-auto shrink-0 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            Cannot be changed
          </span>
        )}
      </div>
    </div>
  );
}

// Profile photo upload section — uploads instantly, independent of the edit modal
function ProfilePhotoSection({
  user,
  onPhotoChange,
}: {
  user: User;
  onPhotoChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    user.profilePhoto?.url || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("")
      .substring(0, 2);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file after a cancelled pick
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload the image, then link it as the user's profile photo
      const uploadResult = await formPostData("attachment", formData);
      const attachmentId = uploadResult?.data?.id;
      if (!attachmentId) {
        throw new Error("Image upload failed");
      }

      const response = await patchData(`users/${user.id}`, {
        profilePhotoId: String(attachmentId),
      });

      if (response?.statusCode === 200) {
        setPhotoUrl(response?.data?.profilePhoto?.url || null);
        onPhotoChange();
        toast.success("Profile photo updated successfully");
      } else {
        toast.error(response?.message || "Failed to update profile photo");
      }
    } catch (err) {
      console.error("Profile photo upload error:", err);
      toast.error("An error occurred while uploading the image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const response = await patchData(`users/${user.id}`, {
        profilePhotoId: null,
      });

      if (response?.statusCode === 200) {
        setPhotoUrl(null);
        onPhotoChange();
        toast.success("Profile photo removed");
      } else {
        toast.error(response?.message || "Failed to remove photo");
      }
    } catch (err) {
      console.error("Profile photo remove error:", err);
      toast.error("An error occurred while removing the photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50/50">
      <div className="relative">
        <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
          {photoUrl ? (
            <AvatarImage src={photoUrl} alt={user.name || "Profile"} />
          ) : (
            <AvatarFallback className="text-xl font-semibold bg-primaryColor/10 text-primaryColor">
              {user.name ? getInitials(user.name) : <UserIcon className="w-8 h-8" />}
            </AvatarFallback>
          )}
        </Avatar>
        <label
          className={`absolute -bottom-1 -right-1 p-2 rounded-full bg-primaryColor text-white shadow-md transition-opacity ${
            uploading ? "opacity-50" : "hover:opacity-90 cursor-pointer"
          }`}
          title="Upload profile photo"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">Profile Photo</p>
        <p className="text-xs text-gray-500 mt-0.5">
          JPG, PNG or WEBP. Max 5MB.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-4 h-4 mr-1" />
            {photoUrl ? "Change Photo" : "Upload Photo"}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              disabled={uploading}
              onClick={handleRemove}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit modal — contact number stays read-only
function EditDetailsModal({
  user,
  open,
  onOpenChange,
  onSaved,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (saving) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Name must be between 2 and 50 characters");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      setError("Name can only contain letters and spaces");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await patchData(`users/${user.id}`, {
        name: trimmedName,
        email: trimmedEmail,
      });

      if (response?.statusCode === 200) {
        toast.success(response?.message || "Profile updated successfully");
        onOpenChange(false);
        onSaved();
      } else {
        setError(response?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update error:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? (err as { message?: string }).message
          : undefined;
      setError(errorMessage || "An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Personal Details</DialogTitle>
          <DialogDescription>
            Update your name and email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primaryColor/10">
                <UserIcon className="w-4 h-4 text-primaryColor" />
              </div>
              Full Name
              <span className="text-red-500 text-xs">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-12 text-base"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primaryColor/10">
                <Phone className="w-4 h-4 text-primaryColor" />
              </div>
              Contact Number
            </label>
            <div className="min-h-12 flex items-center px-4 py-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-800 font-medium">
                {user.mobileNumber || "Not provided"}
              </p>
              <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Cannot be changed
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primaryColor/10">
                <Mail className="w-4 h-4 text-primaryColor" />
              </div>
              Email Address
              <span className="text-red-500 text-xs">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="h-12 text-base"
              disabled={saving}
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountInfo({ user }: AccountInfoProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  // Refresh server data after an edit or photo change
  const handleSaved = useCallback(() => {
    router.refresh();
  }, []);

  return (
    <div className="space-y-4">
      {/* Profile Photo Section */}
      <ProfilePhotoSection user={user} onPhotoChange={handleSaved} />

      {/* Personal Details Card */}
      <div className="overflow-hidden">
        <div className="pb-2">
          <AccountPageHeader
            title="Personal Details"
            action={
              <Button type="button" onClick={() => setEditOpen(true)}>
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            }
          />
        </div>

        <div className="py-4 space-y-6">
          {/* Details Grid */}
          <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
            <DisplayField label="Full Name" icon={UserIcon} value={user.name} />
            <DisplayField
              label="Contact Number"
              icon={Phone}
              value={user.mobileNumber}
              locked
            />
            <DisplayField label="Email Address" icon={Mail} value={user.email} />
          </div>

          {/* Account Status Section */}
          <div className="pt-6 border-t">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Account Status
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    {user.isVerified ? "Verified" : "Pending Verification"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 rounded-lg bg-blue-100">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Member Since
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg sm:col-span-2 lg:col-span-1">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditDetailsModal
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}
