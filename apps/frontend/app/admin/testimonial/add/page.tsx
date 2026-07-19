"use client";

import { TestimonialForm } from "@/components/admin/testimonial/testimonial-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddTestimonialPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.back();
  };
  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Testimonial</CardTitle>
            <CardDescription>
              Create a new customer testimonial. Fill in all the required
              information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/testimonial/testimonial-list">
              Back to Testimonials
            </Link>
          </Button>
        </div>
      </div>
      <div>
        <TestimonialForm mode="create" onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
