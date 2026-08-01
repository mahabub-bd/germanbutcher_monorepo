"use client";

import type React from "react";

import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type OtpVerificationResponse = {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    user?: {
      id: number | string;
      name?: string;
      email?: string;
      mobileNumber?: string;
      roles?: string;
    };
    [key: string]: unknown;
  };
};

type OtpVerificationModalProps = {
  isOpen: boolean;
  phoneNumber: string;
  onClose: () => void;
  onSuccess: (data: OtpVerificationResponse["data"]) => void;
  onResendOtp: (phoneNumber: string) => Promise<OtpVerificationResponse>;
  onVerifyOtp: (params: {
    mobileNumber: string;
    otp: string;
    name?: string;
  }) => Promise<OtpVerificationResponse>;
  otpLength?: number;
  resendCooldown?: number;
  showNameInput?: boolean;
  isNewUser?: boolean;
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
  showNameInput = false,
  isNewUser = false,
}: OtpVerificationModalProps) => {
  const [otp, setOtp] = useState<string>("");
  const [name, setName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(resendCooldown);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const otpDigits = Array.from({ length: otpLength }).map((_, i) => otp[i] || "");

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.dataset.index);
    const value = e.target.value.replace(/\D/g, "").slice(0, 1); // single digit
    const newOtpArr = otp.split("");
    newOtpArr[index] = value;
    const newOtp = newOtpArr.join("");
    setOtp(newOtp);
    setError(null);

    // move focus
    if (value && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const index = Number((e.target as HTMLInputElement).dataset.index);
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const prev = inputsRef.current[index - 1];
        prev?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, otpLength);
    if (!paste) return;
    const newOtp = paste.padEnd(otpLength, "").slice(0, otpLength);
    setOtp(newOtp);
    const nextIndex = Math.min(paste.length, otpLength - 1);
    inputsRef.current[nextIndex]?.focus();
    e.preventDefault();
  };

  const handleVerify = async () => {
    if (otp.replace(/\s/g, "").length !== otpLength) {
      setError(`Please enter a ${otpLength}-digit code`);
      return;
    }

    if (showNameInput && isNewUser && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsVerifying(true);
    try {
      const nameToSend = showNameInput && isNewUser ? name.trim() : undefined;

      const response = await onVerifyOtp({
        mobileNumber: phoneNumber,
        otp,
        name: nameToSend,
      });

      if (response.success) {
        onSuccess(response.data || { userId: "user-id" });
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
      setName("");
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
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close verification modal">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            We sent a {otpLength}-digit code to <span className="font-medium">{phoneNumber}</span>.
          </p>

          {showNameInput && isNewUser && (
            <div className="space-y-2">
              <Label htmlFor="name-input">Your Name</Label>
              <Input
                id="name-input"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Please provide your name for account creation</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Verification Code</Label>
            <div className="flex gap-2 justify-center">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  data-index={idx}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={handleOtpChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center rounded-md border bg-input text-lg font-medium"
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-destructive mt-2" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-auto p-0 text-sm">
                Edit number
              </Button>
              <span className="text-sm text-muted-foreground">|</span>
              {canResend ? (
                <Button variant="link" size="sm" onClick={handleResendOtp} disabled={isResending} className="h-auto p-0 text-sm">
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
                <span className="text-sm text-muted-foreground">Resend code in {timeLeft}s</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleVerify} disabled={isVerifying || otp.replace(/\s/g, "").length !== otpLength}>
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
