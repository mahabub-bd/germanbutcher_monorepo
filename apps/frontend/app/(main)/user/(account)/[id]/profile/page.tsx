import AccountInfo from "@/components/user-account/AccountInfo";
import { fetchProtectedData } from "@/utils/api-utils";
import { User } from "@/utils/types";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const endpoint = `users/${id}`;

  const userData: User = await fetchProtectedData(endpoint);

  return (
    <div className="md:p-4 p-0 ">
      <AccountInfo user={userData} />
    </div>
  );
}
