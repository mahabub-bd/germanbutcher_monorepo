"use client";

import { TestimonialForm } from "@/components/admin/testimonial/testimonial-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddTestimonialPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.back();
  };
  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Add New Testimonial"
        description="Create a new customer testimonial. Fill in all the required information."
        backHref="/admin/testimonial/testimonial-list"
        backLabel="Back to Testimonials"
      />
      <div>
        <TestimonialForm mode="create" onSuccess={handleSuccess} />
      </div>
    </AdminPageContainer>
  );
}
