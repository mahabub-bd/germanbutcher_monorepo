"use client";

import type React from "react";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type OtpVerificationResponse = {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    [key: string]: unknown;
  };
};

type OtpVerificationModalProps = {
  isOpen: boolean;
  phoneNumber: string;
  onClose: () => void;
  onSuccess: (userId: string) => void;
  onResendOtp: (phoneNumber: string) => Promise<OtpVerificationResponse>;
  onVerifyOtp: (params: {
    mobileNumber: string;
    otp: string;
  }) => Promise<OtpVerificationResponse>;
  otpLength?: number;
  resendCooldown?: number;
};

export const OtpVerificationModal = ({
  isOpen,
  phoneNumber,
  onClose,
  onSuccess,
  onResendOtp,
  onVerifyOtp,
  otpLength = 6,
  resendCooldown = 180,
}: OtpVerificationModalProps) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(resendCooldown);
  const [error, setError] = useState<string | null>(null);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
    if (value.length <= otpLength) {
      setOtp(value);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== otpLength) {
      setError(`Please enter a ${otpLength}-digit code`);
      return;
    }

    setIsVerifying(true);
    try {
      const response = await onVerifyOtp({
        mobileNumber: phoneNumber,
        otp,
      });

      if (response.success) {
        const userId = response.data?.userId || "user-id";
        onSuccess(userId);
        onClose();
        toast.success(response.message || "Phone number verified successfully");
      } else {
        setError(response.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const response = await onResendOtp(phoneNumber);
      if (response.success) {
        toast.success(response.message || "OTP resent successfully");
        setTimeLeft(resendCooldown);
      } else {
        toast.error(response.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("OTP resend error:", err);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(resendCooldown);
      setOtp("");
      setError(null);
      return;
    }

    const timerId =
      timeLeft > 0 &&
      setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timeLeft, isOpen, resendCooldown]);

  if (!isOpen) return null;

  const canResend = timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md animate-in fade-in-90 zoom-in-90">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Verify Phone Number</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close verification modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            We have sent a {otpLength}-digit verification code to{" "}
            <span className="font-medium">{phoneNumber}</span>
          </p>

          <div className="space-y-2">
            <Label htmlFor="otp-input">Verification Code</Label>
            <Input
              id="otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={otpLength}
              placeholder={`Enter ${otpLength}-digit code`}
              value={otp}
              onChange={handleOtpChange}
              autoFocus
              className="text-center tracking-widest text-lg h-12"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            {canResend ? (
              <Button
                variant="link"
                size="sm"
                onClick={handleResendOtp}
                disabled={isResending}
                className="h-auto p-0 text-sm"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Resend code in {timeLeft}s
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== otpLength}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
