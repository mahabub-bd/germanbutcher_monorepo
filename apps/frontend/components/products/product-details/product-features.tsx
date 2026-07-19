import { Award, Clock, Shield, Truck } from "lucide-react";

export function ProductFeatures() {
  const features = [
    {
      icon: Truck,
      label: "Free Delivery",
      desc: "On orders over ৳1500",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Shield,
      label: "Quality Assured",
      desc: "100% fresh guarantee",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Clock,
      label: "Fresh Daily",
      desc: "Delivered within 24hrs",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Award,
      label: "Premium Quality",
      desc: "Certified suppliers",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {features.map(({ icon: Icon, label, desc, color, bgColor }) => (
        <div
          key={label}
          className="group bg-white rounded-lg md:p-6 p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primaryColor/20 transition-all duration-300 hover:-translate-y-1"
        >
          <div
            className={`${bgColor} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <h4 className="font-semibold text-sm md:text-base text-gray-900 text-center mb-1">
            {label}
          </h4>
          <p className="text-xs md:text-sm text-gray-500 text-center leading-relaxed">
            {desc}
          </p>
        </div>
      ))}
    </div>
  );
}
