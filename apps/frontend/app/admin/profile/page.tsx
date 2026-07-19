import { getUser } from "@/actions/auth";
import AdminProfileView from "@/components/admin/profile/admin-profile-view";
import { fetchProtectedData } from "@/utils/api-utils";
import { User } from "@/utils/types";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Admin Profile | Dashboard",
  description: "Manage your admin profile and account settings",
};

export default async function AdminProfilePage() {
  const user = await getUser();
  const userdata = await fetchProtectedData<User>(`users/${user?.id}`);

  if (!user || !user.isAdmin) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      <AdminProfileView user={userdata} />
    </div>
  );
}
