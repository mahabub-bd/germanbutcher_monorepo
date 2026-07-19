import { sisterConcerns } from "@/constants";
import { SisterConcern } from "@/utils/types";
import SisterConcernCard from "./sisterconcern-card";

const SisterConcernsList: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:py-10 py-5 md:px-4 px-4 mt-10">
      {sisterConcerns.map((concern: SisterConcern) => (
        <SisterConcernCard key={concern.id} concern={concern} />
      ))}
    </div>
  );
};

export default SisterConcernsList;
