import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ViewAllButtonProps {
  href: string;
  children?: React.ReactNode;
}

function ViewAllButton({ href, children = "View All" }: ViewAllButtonProps) {
  return (
    <div className="flex justify-center mt-8">
      <Link href={href}>
        <Button className="group flex gap-5 cursor-pointer  rounded-full bg-gradient-to-r from-primaryColor  to-secondaryColor p-1 hover:text-white focus:ring-3 focus:outline-hidden">
          {children}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export default ViewAllButton;
