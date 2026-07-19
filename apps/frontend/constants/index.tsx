// constants/index.ts
import {
  FoodSafty,
  GBEXPRESS,
  GermanDeli,
  GermanQuality,
  HACCP,
  HalalImage,
  Pizzerie,
  SteakandSausage,
  Tandoor,
  TokyoKitchen,
} from "@/public/images";
import { FAQItem, SisterConcern } from "@/utils/types";
import { Mail, MapPin, Phone } from "lucide-react";
import { Facebook, Instagram, Youtube } from "@/components/icons/brand-icons";

export type FeatureData = {
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
  iconBgColor?: string;
};

interface NavigationLink {
  id: string;
  href: string;
  label: string;
}

export const links: NavigationLink[] = [
  { id: "home", href: "/", label: "Home" },
  { id: "products", href: "/products", label: "Products" },
  { id: "recipes", href: "/recipes", label: "Recipe" },
  { id: "where-to-buy", href: "/where-to-buy", label: "Where to Buy" },
  // { id: "our-brands", href: "/our-brands", label: "Our Brands" },
];
export const defaultFeaturesData: FeatureData[] = [
  {
    iconSrc: HalalImage.src,
    iconAlt: "Halal Certified",
    title: "100% Halal Certified",
    description:
      "We have been certified by Halal Bangladesh Services Ltd (Certificate No. HBM10010322/221)",
    iconBgColor: "green",
  },
  {
    iconSrc: FoodSafty.src,
    iconAlt: "Food System Management",
    title: "Food System Management System",
    description:
      "Advanced food management system ensuring quality control, traceability, and safety standards throughout our supply chain.",
    iconBgColor: "blue",
  },
  {
    iconSrc: GermanQuality.src,
    iconAlt: "Original German Quality",
    title: "Original German Quality",
    description:
      "Authentic German products with traditional craftsmanship and superior quality standards.",
    iconBgColor: "orange",
  },
  {
    iconSrc: HACCP.src,
    iconAlt: "HACCP Certified",
    title: "HACCP Certified",
    description:
      "Hazard Analysis and Critical Control Points certified ensuring food safety and quality management throughout our production process.",
    iconBgColor: "purple",
  },
];

export const bangladeshData = {
  Dhaka: [
    "Dhaka",
    "Faridpur",
    "Gazipur",
    "Gopalganj",
    "Kishoreganj",
    "Madaripur",
    "Manikganj",
    "Munshiganj",
    "Narayanganj",
    "Narsingdi",
    "Rajbari",
    "Shariatpur",
    "Tangail",
  ],

  Chittagong: [
    "Bandarban",
    "Brahmanbaria",
    "Chandpur",
    "Chittagong",
    "Comilla",
    "Cox's Bazar",
    "Feni",
    "Khagrachhari",
    "Lakshmipur",
    "Noakhali",
    "Rangamati",
  ],

  Khulna: [
    "Bagerhat",
    "Chuadanga",
    "Jessore",
    "Jhenaidah",
    "Khulna",
    "Kushtia",
    "Magura",
    "Meherpur",
    "Narail",
    "Satkhira",
  ],
  Barisal: [
    "Barguna",
    "Barisal",
    "Bhola",
    "Jhalokathi",
    "Patuakhali",
    "Pirojpur",
  ],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  Rajshahi: [
    "Bogra",
    "Joypurhat",
    "Naogaon",
    "Natore",
    "Nawabganj",
    "Pabna",
    "Rajshahi",
    "Sirajganj",
  ],
  Rangpur: [
    "Dinajpur",
    "Gaibandha",
    "Kurigram",
    "Lalmonirhat",
    "Nilphamari",
    "Panchagarh",
    "Rangpur",
    "Thakurgaon",
  ],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
};

export type Division = keyof typeof bangladeshData;
export const divisions = Object.keys(bangladeshData) as Division[];

export const sisterConcerns: SisterConcern[] = [
  {
    id: 1,
    name: "Tokyo Kitchen",
    imageUrl: TokyoKitchen.src,
    description:
      "Authentic Japanese cuisine featuring fresh sushi, ramen, and traditional dishes prepared by skilled chefs using premium ingredients.",
    details: {
      established: 2014,
      concept: "Japanese-inspired restaurant under the German Butcher brand",
      location: "Bangladesh",
      specialties: ["Sushi", "Ramen", "Contemporary Japanese dishes"],
      atmosphere: "Cozy yet vibrant",
      keyFeatures: [
        "Blends traditional culinary techniques with modern dining",
        "Quality ingredients with attention to detail",
        "Flavorful, well-balanced meals",
        "Over a decade of consistent service",
      ],
    },
  },
  {
    id: 2,
    name: "Steak and Sausage",
    imageUrl: SteakandSausage.src,
    description:
      "Premium steakhouse and grill specializing in high-quality cuts of meat, artisanal sausages, and hearty comfort food.",
    details: {
      specialties: ["Premium steaks", "Artisanal sausages", "Comfort food"],
      diningExperience: "Casual premium",
      keyFeatures: [
        "High-quality meat cuts",
        "Handcrafted sausage selection",
        "Hearty portions",
        "Grill-focused menu",
      ],
    },
  },
  {
    id: 3,
    name: "Pizzerie",
    imageUrl: Pizzerie.src,
    description:
      "Traditional Italian pizzeria serving wood-fired pizzas, pasta dishes, and classic Italian cuisine in a cozy atmosphere.",
    details: {
      cuisineType: "Traditional Italian",
      specialties: ["Wood-fired pizzas", "Pasta dishes"],
      atmosphere: "Friendly and relaxed",
      service: "Quick and efficient",
      keyFeatures: [
        "Quality ingredients",
        "Handcrafted pizzas",
        "Authentic Italian flavors",
        "Casual dining experience",
      ],
    },
  },
  {
    id: 4,
    name: "German Deli",
    imageUrl: GermanDeli.src,
    description:
      "Authentic German delicatessen offering traditional sausages, breads, imported cheeses, and European specialty foods.",
    details: {
      concept: "Modern coffee shop and lifestyle café",
      specialties: ["German sausages", "European specialty foods", "Coffee"],
      atmosphere: "Calm and welcoming",
      keyFeatures: [
        "Designed for comfort and conversation",
        "Perfect for relaxation",
        "Quality and consistency",
        "Blends café culture with deli offerings",
      ],
    },
  },
  {
    id: 5,
    name: "GB Express",
    imageUrl: GBEXPRESS.src,
    description:
      "Fast-casual dining experience providing quick, quality meals and convenient takeout options for busy customers.",
    details: {
      concept: "Everyday affordable dining",
      businessModel: "Franchise by German Butcher",
      specialties: ["Quick meals", "Budget-friendly options"],
      keyFeatures: [
        "Efficient service",
        "Consistent quality across outlets",
        "Accessible pricing",
        "Welcoming atmosphere",
        "Designed for daily dining needs",
      ],
    },
  },
  {
    id: 6,
    name: "Tandoor",
    imageUrl: Tandoor.src,
    description:
      "Authentic Indian restaurant featuring traditional tandoor-cooked dishes, aromatic curries, naan bread, and flavorful spices.",
    details: {
      cuisine: "Authentic Indian",
      specialties: [
        "Tandoori dishes",
        "Flame-grilled kababs",
        "Fresh naan",
        "Aromatic curries",
      ],
      cookingMethods: ["Traditional tandoor cooking", "Indian spice blends"],
      keyFeatures: [
        "Bold and vibrant flavors",
        "Traditional cooking techniques",
        "Comforting dining experience",
        "Commitment to quality and consistency",
      ],
    },
  },
];

export const faqData: FAQItem[] = [
  // Products & Quality
  {
    id: 1,
    question: "Are your products 100% Halal certified?",
    answer:
      "Yes, all our products are 100% Halal certified by Halal Bangladesh Services Ltd (Certificate No. HBM10010322/221). We strictly follow Islamic dietary laws in our production process.",
    category: "Products & Quality",
  },
  {
    id: 2,
    question: "What makes German Butcher products authentic?",
    answer:
      "We use traditional German recipes and methods that have been perfected over 29+ years. Our founder Ferenz Georgy started the company in 1991 with authentic German techniques, using only the finest ingredients and freshest meats.",
    category: "Products & Quality",
  },
  {
    id: 3,
    question: "Do you have HACCP certification?",
    answer:
      "Yes, we are HACCP (Hazard Analysis and Critical Control Points) certified, ensuring food safety and quality management throughout our production process.",
    category: "Products & Quality",
  },
  {
    id: 4,
    question: "What types of products do you offer?",
    answer:
      "We specialize in authentic German sausages, cold cuts, ham, bacon, meatloaf, salami, pepperoni, and various other premium meat-based products. All made with traditional German craftsmanship.",
    category: "Products & Quality",
  },
  {
    id: 5,
    question: "How long do your products stay fresh?",
    answer:
      "Our products have different shelf lives depending on the type. Fresh sausages typically last 3-5 days refrigerated, while cured products like salami can last 2-3 weeks. All products come with clear expiration dates.",
    category: "Products & Quality",
  },

  // Orders & Shopping
  {
    id: 6,
    question: "How do I place an order?",
    answer:
      "You can place an order through our website germanbutcherbd.com, by calling us at +8809666791991, or by visiting our physical stores. Simply add items to your cart and proceed to checkout.",
    category: "Orders & Shopping",
  },
  {
    id: 7,
    question: "What is the minimum order amount?",
    answer:
      "There is no minimum order amount for delivery within Dhaka city. However, for areas outside Dhaka, we have a minimum order requirement of BDT 1,000.",
    category: "Orders & Shopping",
  },
  {
    id: 8,
    question: "Can I modify or cancel my order?",
    answer:
      "You can modify or cancel your order within 30 minutes of placing it. After that, please contact our customer service team, and we'll do our best to accommodate your request if the order hasn't been processed.",
    category: "Orders & Shopping",
  },
  {
    id: 9,
    question: "Do you offer bulk orders for events?",
    answer:
      "Yes, we offer special pricing for bulk orders and catering services. Please contact us at least 48 hours in advance for large orders, and we'll provide you with a customized quote.",
    category: "Orders & Shopping",
  },

  // Delivery & Shipping
  {
    id: 10,
    question: "What are your delivery areas?",
    answer:
      "We deliver throughout Dhaka city and selected areas outside Dhaka. You can check if we deliver to your area by entering your postal code during checkout or calling our customer service.",
    category: "Delivery & Shipping",
  },
  {
    id: 11,
    question: "How fast is your delivery?",
    answer:
      "We offer same-day delivery within Dhaka city for orders placed before 2:00 PM. For areas outside Dhaka, delivery typically takes 1-2 business days.",
    category: "Delivery & Shipping",
  },
  {
    id: 12,
    question: "What are the delivery charges?",
    answer:
      "Delivery is free for orders above BDT 1,500 within Dhaka city. For orders below this amount, delivery charges are BDT 80. Outside Dhaka delivery charges vary by location.",
    category: "Delivery & Shipping",
  },
  {
    id: 13,
    question: "How do you ensure products stay fresh during delivery?",
    answer:
      "We use insulated bags and ice packs to maintain proper temperature during delivery. Our delivery team is trained to handle perishable items properly to ensure freshness upon arrival.",
    category: "Delivery & Shipping",
  },

  // Payment & Pricing
  {
    id: 14,
    question: "What payment methods do you accept?",
    answer:
      "We accept cash on delivery, credit/debit cards, mobile banking (bKash, Nagad, Rocket), and bank transfers. All online payments are processed through secure payment gateways.",
    category: "Payment & Pricing",
  },
  {
    id: 15,
    question: "Are your prices competitive?",
    answer:
      "We offer premium quality products at competitive prices. While we focus on quality over cost-cutting, we ensure our prices are affordable and provide excellent value for authentic German products.",
    category: "Payment & Pricing",
  },
  {
    id: 16,
    question: "Do you offer any discounts or promotions?",
    answer:
      "Yes, we regularly offer promotions, seasonal discounts, and special deals for bulk orders. Follow us on social media or subscribe to our newsletter to stay updated on current offers.",
    category: "Payment & Pricing",
  },

  // Returns & Support
  {
    id: 17,
    question: "What is your return policy?",
    answer:
      "We accept returns within 24 hours for perishable items and 7 days for non-perishable items. Items must be in original condition. We offer full refunds for defective products or wrong items delivered.",
    category: "Returns & Support",
  },
  {
    id: 18,
    question: "How do I contact customer support?",
    answer:
      "You can reach our customer support team at +8809666791991, email us at support@germanbutcherbd.com, or use the contact form on our website. Our support hours are Sunday-Thursday, 9:00 AM - 6:00 PM.",
    category: "Returns & Support",
  },
  {
    id: 19,
    question: "What if I receive a damaged product?",
    answer:
      "If you receive a damaged product, please contact us immediately with photos of the item. We will arrange for a replacement or full refund within 24 hours of reporting the issue.",
    category: "Returns & Support",
  },
  {
    id: 20,
    question: "Do you have physical stores?",
    answer:
      "Yes, we have multiple physical stores across Bangladesh. You can find our store locations on our website or contact us for the nearest store location to you.",
    category: "Returns & Support",
  },
];

export const contactInfo = [
  {
    icon: Phone,
    label: "Call Us",
    value: "+8809666791991",
    href: "tel:+8809666791991",
  },
  {
    icon: Mail,
    label: "Email Us",
    value: "support@germanbutcherbd.com",
    href: "mailto:support@germanbutcherb.com",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "House 56/B, Road 132, Gulshan 1, Dhaka",
    href: "https://maps.app.goo.gl/rP9kUCDczKa94otX7",
  },
];

export const footerMenuData = {
  company: {
    title: "Company",
    links: [
      { text: "Our Story", href: "/about-us" },
      { text: "Our Clients", href: "/clients" },
      { text: "Certification", href: "/certification" },
      { text: "Our Brands", href: "/our-brands" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { text: "Contact Us", href: "/contact-us" },
      { text: "FAQ", href: "/faqs" },
      { text: "Recipes", href: "/recipes" },
      { text: "How To Order", href: "/how-to-order" },
    ],
  },
  policy: {
    title: "Policy",
    links: [
      { text: "Terms and Conditions", href: "/terms-and-conditions" },
      { text: "Return and Refund", href: "/return-refund-policy" },
      { text: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
};

export const socialPlatforms = [
  {
    Icon: Facebook,
    bg: "bg-[#1877f2]",
    name: "Facebook",
    href: "https://www.facebook.com/germanbutcherbd",
  },
  {
    Icon: Instagram,
    bg: "bg-gradient-to-r from-purple-500 to-pink-500",
    name: "Instagram",
    href: "https://www.instagram.com/germanbutcherbd",
  },
  { Icon: Youtube, bg: "bg-[#ff0000]", name: "YouTube", href: "#" },
];
