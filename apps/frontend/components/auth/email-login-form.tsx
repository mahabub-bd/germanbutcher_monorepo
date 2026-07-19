"use client";

import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error("Missing fields", {
        description: "Please fill in all required fields",
      });
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address",
      });
      setIsLoading(false);
      return;
    }

    // Password validation
    if (password.length < 6) {
      toast.error("Weak password", {
        description: "Password should be at 6 least  characters long",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await login({ email, password });

      if (result.success) {
        toast.success("Success", {
          description: result?.message,
        });

        setTimeout(() => {
          router.push(result.redirect || "/dashboard");
        }, 500);
      } else {
        toast.error("Login failed", {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="h-9 border-gray-200 focus:border-primaryColor focus:ring-primaryColor/20"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Password
          </Label>
          <Link
            className="text-sm text-primaryColor hover:text-primaryColor/80 transition-colors font-medium"
            href="/auth/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9 pr-12 border-gray-200 focus:border-primaryColor focus:ring-primaryColor/20"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-9 bg-primaryColor text-white hover:bg-primaryColor/90 font-medium shadow-lg shadow-primaryColor/20 transition-all"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
