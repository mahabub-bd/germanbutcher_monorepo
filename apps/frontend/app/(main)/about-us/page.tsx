import { HeadingPrimary } from "@/components/common/heading-primary";
import { Chairman } from "@/public/images";
import { Award, Heart, Star } from "lucide-react";
import Image from "next/image";
import React from "react";

const AboutUsComponent: React.FC = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        {/* Header */}
        <HeadingPrimary
          title="About German Butcher"
          subtitle="Over 29 years of authentic German craftsmanship since 1991"
        />

        {/* Founder Story */}
        <div className="bg-gray-50 rounded-lg md:p-8 p-4 md:my-10 py-5">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Founder Photo */}
            <div className="flex-shrink-0 text-center">
              <div className="w-40 h-50 rounded-md bg-primaryColor/10 border-2 border-primaryColor/30 flex items-center justify-center overflow-hidden mx-auto mb-4">
                <Image
                  src={Chairman}
                  alt="Ferenz Georgy - Founder of German Butcher"
                  width={400}
                  height={500}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-primaryColor">Ferenz Georgy</h3>
              <p className="text-gray-600 text-sm">Founder (1991)</p>
            </div>

            {/* Story */}
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed mb-4">
                In 1991,{" "}
                <span className="font-semibold text-primaryColor">
                  Ferenz Georgy
                </span>{" "}
                started German Butcher in Bangladesh with a love for sausages,
                noticing the unavailability of such products in our country.
                Since then, German Butcher has become the{" "}
                <span className="font-semibold text-primaryColor">
                  pioneer of authentic German Sausages in Bangladesh
                </span>{" "}
                and the icon of premium quality gourmet meat products.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We specialize in authentic German sausages, cold cuts, ham,
                bacon, meatloaf, salami, pepperoni and many other premium
                meat-based products.
              </p>
            </div>
          </div>
        </div>

        {/* Our Philosophy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Our Philosophy
          </h2>
          <div className="space-y-6">
            <div className="border-l-4 border-primaryColor pl-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Authentic Flavor
              </h3>
              <p className="text-gray-700 leading-relaxed">
                When you bite into our sausage you can taste the unique blend of
                savory spices and seasonings we have worked so many years to
                perfect. Real, authentic flavor can only come from real,
                authentic ingredients.
              </p>
            </div>

            <div className="border-l-4 border-primaryColor pl-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Uncompromising Quality
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We never compromise on quality and use only the finest
                ingredients and freshest meats in all our specialties, sourced
                from selected suppliers under stringent hygiene regulations and
                expert supervision.
              </p>
            </div>

            <div className="border-l-4 border-primaryColor pl-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Customer First
              </h3>
              <p className="text-gray-700 leading-relaxed">
                When we make our sausages, we make it keeping you in mind. We
                want you to relish every bite, and we want you to want more! We
                provide affordable, mouthwatering products that meet high
                standards of quality, freshness and taste.
              </p>
            </div>
          </div>
        </div>

        {/* Our Commitment */}
        <div className="bg-primaryColor/5 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Our Commitment
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primaryColor/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primaryColor" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Premium Quality
              </h3>
              <p className="text-gray-700 text-sm">
                Only the finest ingredients and freshest meats
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primaryColor/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primaryColor" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Authentic Taste
              </h3>
              <p className="text-gray-700 text-sm">
                Traditional German recipes and methods
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primaryColor/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primaryColor" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Customer Satisfaction
              </h3>
              <p className="text-gray-700 text-sm">
                Made with you in mind, every single time
              </p>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            29 Years of Excellence
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            With more than 29 years of experience in the sausage industry, we
            have cemented our reputation as the best quality sausage
            manufacturers in Bangladesh. We pride ourselves in giving you
            unique, exceptional experiences that match your food interests,
            palates, needs and prices.
          </p>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 font-medium italic">
              &quot;We don&quot;t believe in making exaggerated claims, we
              believe in results. Try any of our products and we can promise you
              that it will be a class apart from others.&quot;
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-primaryColor rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Eat Tasty, Eat Healthy, Eat Right
          </h2>
          <p className="text-lg opacity-90">
            Experience the authentic taste of Germany with German Butcher
          </p>
          {/* Trade Licence */}
          <div className="text-sm text-white/80 mt-4">
            Trade Licence No: <span className="font-semibold">TRAD/DNCC/076380/2022</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsComponent;
