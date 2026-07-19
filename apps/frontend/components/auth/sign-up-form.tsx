"use client";

import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SignUpForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength requirements
  const passwordRequirements = [
    {
      label: "At least 8 characters",
      test: (pass: string) => pass.length >= 8,
    },
    {
      label: "At least one uppercase letter",
      test: (pass: string) => /[A-Z]/.test(pass),
    },
    {
      label: "At least one lowercase letter",
      test: (pass: string) => /[a-z]/.test(pass),
    },
    {
      label: "At least one number",
      test: (pass: string) => /[0-9]/.test(pass),
    },
    {
      label: "At least one special character",
      test: (pass: string) => /[^A-Za-z0-9]/.test(pass),
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Special handling for phone number to only allow digits
    if (name === "mobileNumber") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        mobileNumber: `+880${formData.mobileNumber}`,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const result = await register(registrationData);

      if (result.success) {
        toast.success(result.message);
        router.push(result.redirect || "/auth/sign-in");
      } else {
        if (result.errors) {
          // Handle field-specific errors
          Object.entries(result.errors as Record<string, string[]>).forEach(
            ([field, messages]) => {
              if (messages && Array.isArray(messages) && messages.length > 0) {
                toast.error(`Invalid ${field}`, {
                  description: messages.join(", "),
                });
              }
            }
          );
        } else {
          toast.error(result.message || "Registration failed");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Your full name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Mobile Number</Label>
        <div className="flex">
          <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-md">
            +880
          </div>
          <Input
            id="phoneNumber"
            name="mobileNumber"
            type="tel"
            placeholder="1XXXXXXXXX"
            className="rounded-l-none"
            value={formData.mobileNumber}
            onChange={handleChange}
            maxLength={10}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your 10-digit mobile number without the country code
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className="pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>

        {/* Password strength indicators */}
        <div className="space-y-1 mt-2">
          <p className="text-xs font-medium">Password must contain:</p>
          <ul className="space-y-1">
            {passwordRequirements.map((req, index) => (
              <li key={index} className="text-xs flex items-center gap-1.5">
                {req.test(formData.password) ? (
                  <CheckIcon className="h-3 w-3 text-green-500" />
                ) : (
                  <XIcon className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    req.test(formData.password)
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }
                >
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showConfirmPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
        {formData.password &&
          formData.confirmPassword &&
          formData.password !== formData.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">
              Passwords don&apos;t match
            </p>
          )}
      </div>

      <Button
        type="submit"
        className="w-full mt-6 bg-primaryColor text-white"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
