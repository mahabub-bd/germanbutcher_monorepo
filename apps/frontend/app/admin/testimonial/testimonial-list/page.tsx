import { TestimonialList } from "@/components/admin/testimonial/testimonial-list";

export default async function TestimonialsPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <TestimonialList />
    </div>
  );
}
