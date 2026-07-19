"use client";

import type React from "react";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { postData } from "@/utils/api-utils";

export function Subscription() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();

    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await postData("subscribers", { email });
      if (result.statusCode === 409) {
        toast.error("Subscription failed", {
          description: "This email is already subscribed.",
        });
        setError("This email is already subscribed.");
        return;
      }
      toast.success("Subscription successful!", {
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    } catch (error) {
      toast.error("Subscription failed", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubscribe}
      className="flex w-full  items-center  justify-end space-x-2"
    >
      <div className=" relative w-full md:w-[70%] ">
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className={`${
            error ? "border-red-500" : ""
          } border-primaryColor border w-full  md:text-base lg:text-lg font-medium  rounded-full py-2  px-2 md:py-4 md:px-4 focus:outline-none bg-[#FDFBF4] focus:border-blackColor`}
          disabled={isSubmitting}
          placeholder="Enter your email"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-secondaryColor py-2 cursor-pointer md:py-3 lg:py-3 md:text-lg lg:text-xl font-medium px-5 md:px-6 lg:px-8 rounded-full text-whiteColor text-sm absolute right-1 top-1/2 -translate-y-1/2  flex items-center justify-center transition-colors duration-30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
    </form>
  );
}
