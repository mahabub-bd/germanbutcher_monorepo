"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { postData } from "@/utils/api-utils";

// Step 1 schema: Phone number validation
const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+8801\d{8,9}$/,
      "Please enter a valid phone number (e.g., +8801712345678)"
    ),
});

// Step 2 schema: OTP and password validation
const resetSchema = z
  .object({
    otp: z.string().min(1, "OTP is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match"
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: "+880",
    },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleRequestOtp = async (values: PhoneFormValues) => {
    setIsSubmitting(true);

    try {
      await postData("users/password/reset-request", {
        mobileNumber: values.phoneNumber,
      });

      setPhoneNumber(values.phoneNumber);
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

  const handleResetPassword = async (values: ResetFormValues) => {
    setIsSubmitting(true);

    try {
      await postData("users/password/reset", {
        mobileNumber: phoneNumber,
        otp: values.otp,
        newPassword: values.newPassword,
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

  return (
    <div className="w-full max-w-lg mx-auto p-6 shadow-lg rounded-lg bg-white">
      <h1 className="text-2xl font-bold text-center mb-4">Reset Password</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        {step === 1
          ? "Enter your phone number to receive a reset code"
          : step === 2
            ? "Enter the verification code and your new password"
            : "Your password has been reset successfully"}
      </p>

      {step === 3 ? (
        <div className="space-y-6 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-xl font-semibold">Password Reset Successful</h3>
          <p className="text-muted-foreground">
            Your password has been reset successfully.
          </p>
          <Button className="w-full" asChild>
            <Link href="/auth/sign-in">Back to sign in</Link>
          </Button>
        </div>
      ) : step === 2 ? (
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h3 className="text-lg font-semibold">Verify and reset</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the OTP sent to {phoneNumber} and your new password.
          </p>

          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(handleResetPassword)}
              className="space-y-4"
            >
              <FormField
                control={resetForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter OTP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </div>
      ) : (
        <div className="space-y-4">
          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(handleRequestOtp)}
              className="space-y-4"
            >
              <FormField
                control={phoneForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+8801712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-primaryColor"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
