import {
  footerMenuData,
  footerTagline,
  socialPlatforms,
} from "@/constants";
import { FooterBg, OnlinePayment } from "@/public/images";
import type { BusinessSettings } from "@/utils/types";
import { ChevronRight, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SocialLinks = () => (
  <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
    {socialPlatforms.map(({ Icon, bg, name, href }) => (
      <Link
        key={name}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`p-1 sm:p-3 ${bg} rounded-full cursor-pointer
                   transition-all duration-300 hover:scale-110 shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-white/50`}
        aria-label={`Follow us on ${name}`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </Link>
    ))}
  </div>
);

// Column heading with the gold accent bar underneath.
const MenuSectionTitle = ({ title }: { title: string }) => (
  <p className="font-semibold text-base sm:text-lg text-white uppercase tracking-wide">
    {title}
    <span className="block w-9 h-0.5 mt-2 bg-[#deb149] rounded-full" />
  </p>
);

interface MenuLinkProps {
  href: string;
  children: React.ReactNode;
}

const MenuLink = ({ href, children }: MenuLinkProps) => (
  <Link
    href={href}
    className="group inline-flex items-center gap-2 text-white/80 hover:text-white
               transition-all duration-300 focus:outline-none focus:text-white
               py-1 text-sm sm:text-base font-medium"
  >
    <ChevronRight
      className="w-3.5 h-3.5 text-[#deb149] shrink-0
                 transition-transform duration-300 group-hover:translate-x-1"
    />
    <span className="whitespace-nowrap">{children}</span>
  </Link>
);

interface MenuSectionProps {
  title: string;
  links: { text: string; href: string }[];
}

const MenuSection = ({ title, links }: MenuSectionProps) => (
  <div className="space-y-3 sm:space-y-4">
    <MenuSectionTitle title={title} />
    <div className="flex flex-col gap-y-2.5 sm:gap-y-3">
      {links.map((link) => (
        <MenuLink key={link.text} href={link.href}>
          {link.text}
        </MenuLink>
      ))}
    </div>
  </div>
);

// Round gold-outlined contact icon, matching the mockup.
const ContactItem = ({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) => (
  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-[#deb149]/60 bg-white/5 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#deb149]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white/70 text-xs sm:text-sm font-medium">{label}</p>
      {href ? (
        <Link
          href={href}
          prefetch={true}
          className="text-white font-medium text-sm sm:text-base
                     hover:text-[#deb149] transition-colors duration-300
                     focus:outline-none focus:text-[#deb149]"
        >
          {value}
        </Link>
      ) : (
        <span className="text-white font-medium text-sm sm:text-base leading-relaxed block">
          {value}
        </span>
      )}
    </div>
  </div>
);

// Secure payment panel shown at the bottom of the footer.
const SecurePaymentPanel = () => (
  <div className="relative z-10 mt-10 lg:mt-14 rounded-2xl bg-black/40 border border-[#deb149]/30 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
    {/* Header */}
    <div className="flex items-center justify-center gap-3">
      <span className="hidden sm:block h-px flex-1 max-w-40 bg-gradient-to-r from-transparent to-[#deb149]/60" />
      <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#deb149] shrink-0" />
      <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f5d78e] via-[#deb149] to-[#c9a227] whitespace-nowrap">
        Secure Online Payment
      </h3>
      <span className="hidden sm:block h-px flex-1 max-w-40 bg-gradient-to-l from-transparent to-[#deb149]/60" />
    </div>
    <p className="text-center text-white/70 text-xs sm:text-sm mt-2">
      Pay with your preferred method. 100% secure &amp; trusted.
    </p>

    {/* Payment methods card */}
    <div className="mt-5 sm:mt-6 bg-white rounded-xl overflow-hidden">
      <Image
        src={OnlinePayment}
        alt="Online Payment Methods"
        title="Online Payment Methods"
        className="w-full h-auto"
      />
    </div>
  </div>
);

// Main Footer Component
export default function Footer({
  settings,
}: {
  settings?: BusinessSettings | null;
}) {
  // Only configured values are rendered — no hardcoded fallbacks.
  const contactItems = [
    settings?.phone && {
      icon: Phone,
      label: "Call Us",
      value: settings.phone,
      href: `tel:${settings.phone}`,
    },
    settings?.email && {
      icon: Mail,
      label: "Email Us",
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    settings?.address && {
      icon: MapPin,
      label: "Visit Us",
      value: settings.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`,
    },
  ].filter(Boolean) as {
    icon: React.ElementType;
    label: string;
    value: string;
    href: string;
  }[];

  return (
    <footer className="relative text-white overflow-hidden bg-[#3d0303]">
      {/* Full-bleed background image */}
      <Image
        src={FooterBg}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Slight dark veil so links stay readable over the image */}
      <div className="absolute inset-0 bg-black/20" aria-hidden />

      {/* Content */}
      <div className="container mx-auto relative z-10 py-10 sm:py-12 lg:py-16 px-4 sm:px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-3 flex flex-col items-center lg:items-start gap-4 order-1">
            {settings?.logo?.url && (
              <Image
                src={settings.logo.url}
                alt={`${settings.businessName || "Business"} Logo`}
                title={`${settings.businessName || "Business"} Logo`}
                width={110}
                height={110}
                className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] object-contain drop-shadow-lg"
                priority
              />
            )}
            <p className="text-white/80 text-sm sm:text-base text-center lg:text-left leading-relaxed max-w-xs">
              {footerTagline}
            </p>
            <SocialLinks />
          </div>

          {/* Menu Sections */}
          <div className="col-span-1 lg:col-span-6 order-3 lg:order-2 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            <MenuSection
              title={footerMenuData.company.title}
              links={footerMenuData.company.links}
            />
            <MenuSection
              title={footerMenuData.support.title}
              links={footerMenuData.support.links}
            />
            <MenuSection
              title={footerMenuData.policy.title}
              links={footerMenuData.policy.links}
            />
          </div>

          {/* Contact Section */}
          <div className="col-span-1 lg:col-span-3 flex flex-col items-center lg:items-start gap-5 sm:gap-6 order-2 lg:order-3">
            <MenuSectionTitle title="Contact Us" />
            <div className="space-y-4 sm:space-y-5 w-full max-w-sm lg:max-w-none">
              {contactItems.map((info) => (
                <ContactItem
                  key={info.label}
                  icon={info.icon}
                  label={info.label}
                  value={info.value}
                  href={info.href}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Secure Online Payment */}
        <SecurePaymentPanel />
      </div>
    </footer>
  );
}
