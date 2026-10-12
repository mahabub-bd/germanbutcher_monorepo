"use client";

import { logout } from "@/actions/auth";
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
import { formPostData, patchData, resetAuthTokenCache } from "@/utils/api-utils";
import { User } from "@/utils/types";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Phone,
  Shield,
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

// Read-only display field on the page — label and info share one line
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
    <div className="flex items-center gap-2 min-h-12 px-4 py-3 bg-gray-50 rounded-lg border">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 shrink-0">
        <span className="p-1.5 rounded-lg bg-primaryColor/10">
          <Icon className="w-4 h-4 text-primaryColor" />
        </span>
        {label}
      </label>
      <p className="ml-auto min-w-0 flex-1 truncate text-right text-sm text-gray-800 font-medium">
        {value || "Not provided"}
      </p>
      {locked && (
        <span className="shrink-0 whitespace-nowrap text-xs md:block hidden text-gray-500 bg-gray-200 px-2 py-1 rounded">
          Cannot be changed
        </span>
      )}
    </div>
  );
}

// Profile photo display only — changes happen inside the edit modal
function ProfilePhotoSection({ user }: { user: User }) {
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("")
      .substring(0, 2);
  };

  return (
    <div className="flex items-center gap-4 p-3 md:px-0 rounded-lg border bg-gray-50/50">
      <Avatar className="h-20 w-20 border-2 border-white bg-white shadow-sm">
        {user.profilePhoto?.url ? (
          <AvatarImage
            src={user.profilePhoto.url}
            alt={user.name || "Profile"}
            className="object-contain"
          />
        ) : (
          <AvatarFallback className="text-xl font-semibold bg-primaryColor/10 text-primaryColor">
            {user.name ? getInitials(user.name) : <UserIcon className="w-8 h-8" />}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">Profile Photo</p>
        <p className="text-xs text-gray-500 mt-0.5">
          JPG, PNG or WEBP. Max 5MB. Use Edit to change your photo.
        </p>
      </div>
    </div>
  );
}

// Edit modal — photo is picked here and uploaded together with the details
// on save; contact number stays read-only
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

  // Photo picker state — uploaded only when the modal is saved
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Reset the form each time the modal opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(user.name || "");
      setEmail(user.email || "");
      setError(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setRemovePhoto(false);
    } else if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    onOpenChange(nextOpen);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, WEBP)");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setPhotoFile(selected);
    setRemovePhoto(false);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(selected));
  };

  const clearPickedPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

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
      // Upload the picked photo first, then link it on the user record
      let attachmentId: string | undefined;
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadResult = await formPostData("attachment", formData);
        attachmentId = uploadResult?.data?.id;
        if (!attachmentId) {
          throw new Error("Image upload failed");
        }
      }

      const response = await patchData(`users/${user.id}`, {
        name: trimmedName,
        email: trimmedEmail,
        // undefined = keep current photo, null = remove it
        profilePhotoId: photoFile
          ? String(attachmentId)
          : removePhoto
            ? null
            : undefined,
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

  const previewPhoto = photoPreview
    ? photoPreview
    : !removePhoto
      ? user.profilePhoto?.url
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Personal Details</DialogTitle>
          <DialogDescription>
            Update your photo, name and email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Photo picker */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900">
              Profile Photo
            </p>
            <div className="flex items-center gap-3">
              {previewPhoto ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewPhoto}
                    alt="Profile photo preview"
                    className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      photoPreview ? clearPickedPhoto() : setRemovePhoto(true)
                    }
                    disabled={saving}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                    aria-label={
                      photoPreview ? "Clear selected photo" : "Remove photo"
                    }
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={saving}
                  className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-primaryColor hover:text-primaryColor"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-[10px]">Add photo</span>
                </button>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
                disabled={saving}
              />
              <div className="text-xs text-muted-foreground">
                <p>JPG, PNG or WEBP. Max 5MB.</p>
                {removePhoto && (
                  <button
                    type="button"
                    onClick={() => setRemovePhoto(false)}
                    className="mt-1 text-xs text-primaryColor hover:underline"
                  >
                    Undo remove — keep current photo
                  </button>
                )}
              </div>
            </div>
          </div>

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
            <div className="min-h-12 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border">
              <p className="min-w-0 flex-1 truncate text-sm text-gray-800 font-medium">
                {user.mobileNumber || "Not provided"}
              </p>

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

// Password input with an eye toggle to show/hide the value
function PasswordField({
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 text-sm pr-10"
        disabled={disabled}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Change password modal — verifies the current password server-side
function ChangePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (saving) return;

    if (!currentPassword) {
      setError("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await patchData("users/password/change", {
        currentPassword,
        newPassword,
      });

      if (response?.statusCode === 200) {
        toast.success("Password changed successfully — please sign in again");
        // All sessions/endpoints are tied to the old credentials, so sign the
        // user out and send them to the login page.
        try {
          await logout();
        } catch (logoutErr) {
          console.error("Logout after password change failed:", logoutErr);
        }
        resetAuthTokenCache();
        onOpenChange(false);
        router.push("/auth/sign-in");
        router.refresh();
      } else {
        setError(response?.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Change password error:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? (err as { message?: string }).message
          : undefined;
      setError(errorMessage || "An error occurred while changing password");
    } finally {
      setSaving(false);
    }
  };

  const showMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Verify your current password, then choose a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Current Password
            </label>
            <PasswordField
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter your current password"
              disabled={saving}
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              New Password
            </label>
            <PasswordField
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 8 characters"
              disabled={saving}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Confirm New Password
            </label>
            <PasswordField
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your new password"
              disabled={saving}
              autoComplete="new-password"
            />
            {showMismatch && (
              <p className="text-xs text-red-600">
                Passwords do not match
              </p>
            )}
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
            onClick={() => handleOpenChange(false)}
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
              "Change Password"
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
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Refresh server data after an edit or photo change
  const handleSaved = useCallback(() => {
    router.refresh();
  }, []);

  return (
    <div className="space-y-4">
      {/* Profile Photo Section */}
      <ProfilePhotoSection user={user} />

      {/* Personal Details Card */}
      <div className="overflow-hidden">
        <div className="pb-2">
          <AccountPageHeader
            title="Personal Details"
            action={
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordOpen(true)}
                >
                  <Shield className="w-4 h-4" />
                  Change Password
                </Button>
                <Button type="button" onClick={() => setEditOpen(true)}>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              </div>
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

          {/* Account Status Section — label and value on one line */}
          <div className="pt-6 border-t">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="p-2 rounded-lg bg-green-100 shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </span>
                <p className="text-sm font-medium text-gray-900 shrink-0">
                  Account Status
                </p>
                <p className="ml-auto text-sm text-green-600 font-medium truncate text-right">
                  {user.isVerified ? "Verified" : "Pending Verification"}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="p-2 rounded-lg bg-blue-100 shrink-0">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </span>
                <p className="text-sm font-medium text-gray-900 shrink-0">
                  Member Since
                </p>
                <p className="ml-auto text-sm text-gray-600 truncate text-right">
                  {formatDateTime(user.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg sm:col-span-2 lg:col-span-1">
                <span className="p-2 rounded-lg bg-purple-100 shrink-0">
                  <Shield className="w-4 h-4 text-purple-600" />
                </span>
                <p className="text-sm font-medium text-gray-900 shrink-0">
                  Last Updated
                </p>
                <p className="ml-auto text-sm text-gray-600 truncate text-right">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </p>
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </div>
  );
}
