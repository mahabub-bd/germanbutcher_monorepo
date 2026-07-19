"use client";
import { HeadingPrimary } from "@/components/common/heading-primary";
import { contactInfo } from "@/constants";
import { postData } from "@/utils/api-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  Mail,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  mobile: z
    .string()
    .min(11, "Mobile number must be at least 11 digits")
    .max(11, "Mobile number must be less than 11 digits")
    .regex(/^\+?[0-9]+$/, "Please enter a valid mobile number"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be less than 500 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      message: "",
    },
  });

  const messageLength = watch("message")?.length || 0;

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      await postData("contact-messages", data);

      toast.success("Message sent successfully!", {
        description: "We will get back to you within 24 hours.",
        duration: 5000,
      });

      reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again.";

      toast.error("Failed to send message", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen md:py-10 py-5 px-4 sm:px-2">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <HeadingPrimary
            title="Get In Touch"
            subtitle="Have questions about our products or services? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-md border border-gray-200 md:p-6 p-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Contact Information
              </h2>
              <p className="text-gray-600">
                Reach out to us through any of the following methods.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {contactInfo.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={index}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      item.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 mb-1">
                        {item.label}
                      </h3>
                      <p className="text-gray-600 text-sm">{item.value}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-md border border-gray-200  md:p-6 p-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Send us a Message
              </h2>
              <p className="text-gray-600">
                Fill out the form below and we&apos;ll get back to you as soon
                as possible.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register("name")}
                    type="text"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <div className="flex items-center mt-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.name.message}
                  </div>
                )}
              </div>

              {/* Email and Mobile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register("email")}
                      type="email"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="your@email.com"
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.email.message}
                    </div>
                  )}
                </div>

                {/* Mobile Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register("mobile")}
                      type="tel"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                        errors.mobile ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="+8801234567890"
                    />
                  </div>
                  {errors.mobile && (
                    <div className="flex items-center mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.mobile.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    {...register("message")}
                    rows={4}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                      errors.message ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Tell us about your inquiry..."
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  {errors.message ? (
                    <div className="flex items-center text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.message.message}
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <span
                    className={`text-xs ${
                      messageLength > 500 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {messageLength}/500
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  isSubmitting
                    ? "bg-primaryColor cursor-not-allowed"
                    : "bg-primaryColor hover:bg-gray-700 text-white"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
                  We typically respond within 24 hours
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
