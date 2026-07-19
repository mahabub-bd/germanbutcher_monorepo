import { OnlinePayment } from "@/public/images";
import Image from "next/image";
import Link from "next/link";

const Copyright = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="border-t-4 border-[#deb149] bg-gradient-to-r from-black/95 via-gray-900/95 to-black/95 backdrop-blur-sm text-white md:pb-10 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Content Section */}
        <div className="py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12  items-center h-full">
            {/* Payment Methods - 50% width */}
            <div className="col-span-1 md:col-span-12 flex flex-col items-center space-y-4">
              <p className="font-semibold text-2xl gradient-text ">
                Online Payment
              </p>
              <div className="w-full ">
                <Image
                  src={OnlinePayment}
                  alt="Online Payment Methods"
                  title="Online Payment Methods"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Legal Links - 25% width */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 py-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-5">
            <div className="col-span-1 md:col-span-3 text-center gradient-text md:text-left flex justify-center items-center">
              <p className="  text-sm  font-medium">
                © {currentYear} German Butcher All rights reserved.
              </p>
            </div>
            <Link
              target="_blank"
              href="https://mahabub.me"
              className="text-gray-400 text-xs md:text-sm"
            >
              Designed & Developed with ❤️ by Mahabub Hossain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Copyright;
