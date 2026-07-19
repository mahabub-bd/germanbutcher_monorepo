import { Testimonial } from "@/utils/types";
import { Quote, Star } from "lucide-react";
import Image from "next/image";

interface TestimonialProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialProps) {
  return (
    <div className="group relative">
      <div className="bg-white rounded-xl shadow-lg md:p-6 p-2 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Quote icon */}
          <div className="mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Quote className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Rating */}
          <div className="flex mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < testimonial.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Testimonial text */}
          <p className="text-gray-700 mb-8 flex-grow text-base leading-relaxed font-medium">
            &quot;{testimonial.text}&quot;
          </p>

          {/* Customer info */}
          <div className="flex items-center mt-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden mr-4 shadow-lg relative">
                <Image
                  src={testimonial.attachment.url || "/placeholder.svg"}
                  alt={testimonial.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>
              {/* Online indicator */}
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">
                {testimonial.name}
              </h1>
              {/* <p className="text-gray-500 font-medium">{testimonial.role}</p> */}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-red-100 to-yellow-100 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-yellow-100 to-red-100 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
      </div>
    </div>
  );
}
