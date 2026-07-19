"use client";

import { Button } from "@/components/ui/button";
import { postData } from "@/utils/api-utils";
import { Order } from "@/utils/types";
import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

interface PayNowProps {
  order: Order;
  className?: string;
}

export default function PayNow({ order, className }: PayNowProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    const response = await postData("payment/init", order);

    if (response.data?.redirectUrl) {
      window.location.href = response.data.redirectUrl;
    }
  };
  return (
    <div>
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className={className || "w-full py-0"}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
}
