"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { TestimonialForm } from "@/components/admin/testimonial/testimonial-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Testimonial } from "@/utils/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const testimonialId = params.id as string;
  const handleSuccess = () => {
    router.back();
  };

  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTestimonial = async () => {
    try {
      const response = await fetchData<Testimonial>(
        `testimonials/${testimonialId}`
      );
      setTestimonial(response);
    } catch (error) {
      console.error("Error fetching testimonial:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonial();
  }, [testimonialId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Testimonial" />;
  }

  if (!testimonial) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Testimonial not found</p>
      </div>
    );
  }

  return (
    <AdminPageContainer>
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Testimonial</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/testimonial">Back to Testimonials</Link>
          </Button>
        </div>

      <TestimonialForm
        mode="edit"
        testimonial={testimonial}
        onSuccess={handleSuccess}
      />
    </AdminPageContainer>
  );
}
