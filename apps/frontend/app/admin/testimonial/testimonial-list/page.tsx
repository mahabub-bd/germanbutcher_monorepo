import { TestimonialList } from "@/components/admin/testimonial/testimonial-list";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default async function TestimonialsPage() {
  return (
    <AdminPageContainer>
      <TestimonialList />
    </AdminPageContainer>
  );
}
