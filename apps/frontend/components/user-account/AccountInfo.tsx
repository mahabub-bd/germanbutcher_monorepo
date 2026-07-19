"use client";

import { Input } from "@/components/ui/input";
import { patchData } from "@/utils/api-utils";
import { User } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FieldPath, useForm, UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { formatDateTime } from "../../lib/utils";
import { Button } from "../ui/button";

// Enhanced Zod validation schema
const accountSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    contactNumber: z
      .string()
      .min(10, "Contact number must be at least 10 digits")
      .max(15, "Contact number must be less than 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
    email: z.string().email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val === "********" || val.length >= 8, {
          message: "Password must be at least 8 characters if provided"
    }),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.password &&
        data.password !== "********" &&
        data.password !== ""
      ) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      path: ["confirmPassword"],
      message: "Passwords don't match"
    }
  );

type AccountFormData = z.infer<typeof accountSchema>;

// Form field configuration
const FORM_FIELDS = [
  {
    label: "Full Name",
    name: "firstName" as const,
    type: "text",
    icon: UserIcon,
    placeholder: "Enter your full name",
    disabled: false,
  },
  {
    label: "Contact Number",
    name: "contactNumber" as const,
    type: "tel",
    icon: Phone,
    placeholder: "Enter your phone number",
    disabled: true,
  },
  {
    label: "Email Address",
    name: "email" as const,
    type: "email",
    icon: Mail,
    placeholder: "Enter your email address",
    disabled: false,
  },
] as const;

// Enhanced form field component
interface FormFieldProps {
  label: string;
  name: FieldPath<AccountFormData>;
  register: UseFormRegister<AccountFormData>;
  error?: string;
  isEditing: boolean;
  type?: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  disabled?: boolean;
  value?: string;
}

function FormField({
  label,
  name,
  register,
  error,
  isEditing,
  type = "text",
  icon: Icon,
  placeholder,
  disabled = false,
  value,
}: FormFieldProps) {
  // If field is disabled, never allow editing
  const canEdit = isEditing && !disabled;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primaryColor/10">
            <Icon className="w-4 h-4 text-primaryColor" />
          </div>
          {label}
          {!disabled && <span className="text-red-500 text-xs">*</span>}
        </label>
      </div>

      {canEdit ? (
        <div className="space-y-3">
          <Input
            type={type}
            {...register(name)}
            placeholder={placeholder}
            className={`h-12 text-base transition-all duration-200 ${
              error
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "focus-visible:border-primaryColor focus-visible:ring-primaryColor/20"
            }`}
          />
          {error && (
            <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-12 flex items-center px-4 py-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-800 font-medium">
            {value || "Not provided"}
          </p>
          {disabled && (
            <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              Cannot be changed
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Password field component with show/hide functionality
interface PasswordFieldProps {
  label: string;
  name: FieldPath<AccountFormData>;
  register: UseFormRegister<AccountFormData>;
  error?: string;
  placeholder: string;
  description?: string;
  isEditing: boolean;
  showToggle?: boolean;
}

function PasswordField({
  label,
  name,
  register,
  error,
  placeholder,
  description,
  isEditing,
  showToggle = true,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            {label}
          </label>
        </div>
        <div className="min-h-12 flex items-center px-4 py-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-800 font-medium">••••••••••••</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primaryColor/10">
            <Lock className="w-4 h-4 text-primaryColor" />
          </div>
          {label}
          {name === "confirmPassword" && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </label>
        {description && (
          <p className="text-xs text-gray-500 ml-7">{description}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            {...register(name)}
            placeholder={placeholder}
            className={`h-12 pr-12 text-base transition-all duration-200 ${
              error
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "focus-visible:border-primaryColor focus-visible:ring-primaryColor/20"
            }`}
          />
          {showToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced action buttons component
interface ActionButtonsProps {
  isEditing: boolean;
  onCancel: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}

function ActionButtons({
  isEditing,
  onCancel,
  onEdit,
  isSubmitting,
  isValid,
}: ActionButtonsProps) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 items-center">
        <Button
          type="button"
          className=" "
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !isValid}>
          <Save className="w-4 h-4" />
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" onClick={onEdit}>
      <Edit3 className="w-4 h-4" />
      Edit
    </Button>
  );
}

interface AccountInfoProps {
  user: User;
}

export default function AccountInfo({ user }: AccountInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      contactNumber: "",
      email: "",
      password: "********",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");
  const showConfirmPassword =
    isEditing &&
    passwordValue &&
    passwordValue !== "********" &&
    passwordValue !== "";

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.name || "",
        contactNumber: user.mobileNumber || "",
        email: user.email || "",
        password: "********",
        confirmPassword: "",
      });
    }
  }, [user, reset]);

  // Handle form submission
  const onSubmit = useCallback(
    async (data: AccountFormData) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const updateData: Partial<{
          name: string;
          mobileNumber: string;
          email: string;
          password: string;
        }> = {
          name: data.firstName,
          mobileNumber: data.contactNumber,
          email: data.email,
        };

        // Only include password if it's being changed
        if (
          data.password &&
          data.password !== "********" &&
          data.password !== ""
        ) {
          updateData.password = data.password;
        }

        const endpoint = `users/${user?.id}`;
        const response = await patchData(endpoint, updateData);

        if (response?.statusCode === 200) {
          setIsEditing(false);
          toast.success(response?.message || "Profile updated successfully");

          reset({
            firstName: data.firstName,
            contactNumber: data.contactNumber,
            email: data.email,
            password: "********",
            confirmPassword: "",
          });
        } else {
          toast.error(response?.message || "Failed to update profile");
        }
      } catch (err) {
        console.error("Update error:", err);
        const errorMessage =
          err && typeof err === "object" && "message" in err
            ? (err as { message?: string }).message
            : undefined;
        toast.error(errorMessage || "An error occurred while updating profile");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, isSubmitting, reset]
  );

  const handleCancel = useCallback(() => {
    if (user) {
      reset({
        firstName: user.name || "",
        contactNumber: user.mobileNumber || "",
        email: user.email || "",
        password: "********",
        confirmPassword: "",
      });
    }
    setIsEditing(false);
  }, [user, reset]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  return (
    <div className="">
      {/* Main Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className=" overflow-hidden">
        {/* Card Header */}
        <div className="px-4 sm:px-0 py-2 border-b">
          <div className="flex  gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Details
                </h2>
              </div>
            </div>
            <ActionButtons
              isEditing={isEditing}
              onCancel={handleCancel}
              onEdit={handleEdit}
              isSubmitting={isSubmitting}
              isValid={isValid}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="py-4">
          <div className="space-y-2">
            <div className=" grid md:grid-cols-3 grid-cols-1 gap-4">
              {FORM_FIELDS.map((field) => (
                <FormField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  register={register}
                  error={errors[field.name]?.message}
                  isEditing={isEditing}
                  type={field.type}
                  icon={field.icon}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  value={watch(field.name)}
                />
              ))}
            </div>

            {/* Security Section */}
            <div className="mt-5">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700 uppercase tracking-wide">
                <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                Security Settings
              </div>

              <div className="mt-5">
                <PasswordField
                  label="Password"
                  name="password"
                  register={register}
                  error={errors.password?.message as string | undefined}
                  placeholder="Leave blank to keep current password"
                  description="Must be at least 8 characters long"
                  isEditing={isEditing}
                />

                {showConfirmPassword && (
                  <PasswordField
                    label="Confirm New Password"
                    name="confirmPassword"
                    register={register}
                    error={errors.confirmPassword?.message}
                    placeholder="Confirm your new password"
                    description="Must match the password above"
                    isEditing={isEditing}
                    showToggle={false}
                  />
                )}
              </div>

              {isEditing && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-amber-800">
                        Password Security Tips
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                        <li>Use at least 8 characters</li>
                        <li>Include uppercase and lowercase letters</li>
                        <li>Add numbers and special characters</li>
                        <li>Avoid using personal information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Status Section */}
          {!isEditing && (
            <div className="mt-8 pt-6 border-t">
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
          )}
        </div>
      </form>
    </div>
  );
}