import { CustomerDetail } from "@/components/admin/customer/CustomerDetail";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Details | Admin Dashboard",
  description: "View detailed information about a customer",
};

export default function CustomerDetailPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <CustomerDetail />
    </div>
  );
}
