"use client";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

function ProductCount() {
  const [productCount, setProductCount] = useState(1);
  return (
    <div>
      <div className="flex justify-center items-center gap-2 ">
        <button
          onClick={() => setProductCount(Math.max(1, productCount - 1))}
          className=" bg-white cursor-pointer w-6 h-6 flex shadow justify-center items-center rounded-sm border "
        >
          <Minus size={16} />
        </button>
        <span className="font-semibold text-lg ">{productCount}</span>
        <button
          onClick={() => setProductCount(productCount + 1)}
          className=" bg-white cursor-pointer w-6 h-6 flex shadow justify-center items-center rounded-sm border"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default ProductCount;
