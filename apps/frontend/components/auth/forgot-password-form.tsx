"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postData } from "@/utils/api-utils";
import { ArrowLeftIcon, CheckCircleIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!phoneNumber) {
      toast.error("Phone number required", {
        description: "Please enter your phone number",
      });
      return;
    }

    // Phone number validation (basic format for Bangladesh numbers)
    const phoneRegex = /^\+8801\d{8,9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Invalid phone number", {
        description: "Please enter a valid phone number (e.g., +8801712345678)",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await postData("users/password/reset-request", {
        mobileNumber: phoneNumber,
      });

      setStep(2);
      toast.success("OTP sent", {
        description: "We've sent an OTP to your phone number",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!otp) {
      toast.error("OTP required", {
        description: "Please enter the OTP sent to your phone",
      });
      return;
    }

    if (!newPassword) {
      toast.error("New password required", {
        description: "Please enter your new password",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure your passwords match",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await postData("users/password/reset", {
        mobileNumber: phoneNumber,
        otp: otp,
        newPassword: newPassword,
      });

      setStep(3);
      toast.success("Password reset successful", {
        description: "Your password has been reset successfully",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Something went wrong", {
        description: "Please check your OTP and try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Password Reset Successful</h3>
          <p className="text-muted-foreground">
            Your password has been reset successfully.
          </p>
        </div>
        <Button className="w-full" onClick={onBack}>
          Back to sign in
        </Button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h3 className="text-lg font-semibold">Reset your password</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the OTP sent to {phoneNumber} and your new password.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-2"
            onClick={onBack}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h3 className="text-lg font-semibold">Reset your password</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter your phone number and we`&apos;`ll send you an OTP to reset your
          password.
        </p>
      </div>

      <form onSubmit={handleRequestOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+8801712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send OTP"}
        </Button>
      </form>
    </div>
  );
}
