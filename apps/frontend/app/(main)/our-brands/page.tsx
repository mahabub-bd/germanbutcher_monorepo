import { HeadingPrimary } from "@/components/common/heading-primary";
import SisterConcernsPage from "@/components/sisterconcern/sisterconcern-list";

export default function OurBrands() {
  return (
    <div className="container mx-auto py-10">
      <HeadingPrimary
        title="Our Sister Concerns"
        subtitle=" Discover our diverse family of restaurants and establishments, each
            offering unique culinary experiences and exceptional service across
            different cuisines and dining styles."
      />
      <SisterConcernsPage />
    </div>
  );
}
