import { fetchPublicData } from "@/utils/api-utils";
import { Testimonial } from "@/utils/types";
import { TestimonialSectionClient } from "./testimonial-section-client";

export async function TestimonialSection() {
  try {
    const testimonials: Testimonial[] = await fetchPublicData(
      "testimonials?isPublish=true"
    );

    return <TestimonialSectionClient testimonials={testimonials} />;
  } catch (err) {
    console.error("Error fetching testimonials:", err);
    return <TestimonialSectionClient testimonials={[]} />;
  }
}
