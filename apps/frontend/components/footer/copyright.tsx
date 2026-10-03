import Link from "next/link";

const Copyright = () => {
  const currentYear = new Date().getFullYear();

  return (
    // Dark bottom bar; nearly black so it blends with the footer image's
    // dark lower edge when rendered right after <Footer />. pb-20 on mobile
    // keeps the text clear of the fixed mobile bottom navigation.
    <div className="bg-[#1a0202] border-t-2 border-[#deb149]/70 text-white pb-20 md:pb-0">
      <div className="container mx-auto px-4 md:px-6">
        <div className="py-4 sm:py-5 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-3">
          <p className="text-sm font-medium text-white/90">
            © {currentYear} German Butcher. All rights reserved.
          </p>
          <Link
            target="_blank"
            href="https://mahabub.me"
            className="text-gray-400 text-xs md:text-sm hover:text-[#deb149] transition-colors"
          >
            Designed &amp; Developed with ❤️ by Mahabub Hossain
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Copyright;
