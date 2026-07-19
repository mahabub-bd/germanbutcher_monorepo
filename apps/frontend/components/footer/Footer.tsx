import { contactInfo, footerMenuData, socialPlatforms } from "@/constants";
import { BgFooter, GermanbutcherLogo } from "@/public/images";
import Image from "next/image";
import Link from "next/link";

const SocialLinks = () => {
  return (
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
};

// Menu Link Component
interface MenuLinkProps {
  href: string;
  children: React.ReactNode;
}

interface MenuSectionProps {
  title: string;
  links: { text: string; href: string }[];
}

const MenuLink = ({ href, children }: MenuLinkProps) => (
  <div className="group">
    <Link
      href={href}
      className="inline-flex items-center space-x-0 md:space-x-3 
                 text-white/80 hover:text-white 
                 transition-all duration-300 group-hover:md:translate-x-2 
                 focus:outline-none focus:text-white
                 py-1 text-sm sm:text-base font-semibold"
    >
      <div
        className="hidden md:block w-2 h-2 bg-white/60 rounded-full 
                   group-hover:bg-white transition-colors duration-300 flex-shrink-0"
      />
      <span className="font-medium whitespace-nowrap">{children}</span>
    </Link>
  </div>
);

const MenuSection = ({ title, links }: MenuSectionProps) => (
  <div className="space-y-3 sm:space-y-4">
    <p className="font-semibold text-base sm:text-lg text-white/90 mb-3 sm:mb-4  md:text-left">
      {title}
    </p>
    {/* Mobile: flex-wrap horizontal layout, Desktop: vertical */}
    <div className="flex flex-wrap justify-start md:flex-col gap-x-4 md:gap-x-0 gap-y-2 md:gap-y-3">
      {links.map((link) => (
        <MenuLink key={link.text} href={link.href}>
          {link.text}
        </MenuLink>
      ))}
    </div>
  </div>
);

// Contact Info Item Component
interface ContactItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}

const ContactItem = ({ icon: Icon, label, value, href }: ContactItemProps) => (
  <div className="flex items-start space-x-3 sm:space-x-4">
    <div className="p-2 bg-white/20 rounded-lg flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">
        {label}
      </p>
      {href ? (
        <Link
          href={href}
          prefetch={true}
          className="text-white font-medium text-sm sm:text-base 
                     hover:text-white/80 transition-colors duration-300
                     focus:outline-none focus:text-white/80"
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

// Main Footer Component
export default function Footer() {
  return (
    <footer
      className="relative text-white overflow-hidden 
                      bg-gradient-to-br from-primaryColor via-[#6d0000] to-primaryColor"
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: `url(${BgFooter.src})`,
          backgroundPosition: "50% 50%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="container mx-auto relative z-10 py-8  px-4 sm:px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8  lg:gap-8">
          {/* Logo Section - Mobile: full width, Desktop: 20% */}
          <div
            className="col-span-1 lg:col-span-2 
    flex flex-row md:flex-col
    items-center lg:items-start
    justify-center
    space-y-0 md:space-y-4
    order-1"
          >
            {/* Logo Container */}
            <div className="p-2 sm:p-2">
              <Image
                src={GermanbutcherLogo || "/placeholder.svg"}
                alt="German Butcher Logo"
                title="German Butcher Logo"
                width={100}
                height={100}
                className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] object-contain"
                priority
              />
            </div>

            {/* Social Media Icons */}
            <SocialLinks />
          </div>

          {/* Menu Section - Mobile: full width, Desktop: 50% */}
          <div className="col-span-1 lg:col-span-6 order-3 lg:order-2">
            {/* Menu Grid - 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
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
          </div>

          {/* Contact Section - Mobile: full width, Desktop: 30% */}
          <div
            className="col-span-1 lg:col-span-4 flex flex-col items-center lg:items-start 
                         space-y-4 sm:space-y-6 order-2 lg:order-3"
          >
            {/* Contact Information */}
            <div className="space-y-4 sm:space-y-6 w-full max-w-sm lg:max-w-none">
              {contactInfo.map((info) => (
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
      </div>
    </footer>
  );
}
