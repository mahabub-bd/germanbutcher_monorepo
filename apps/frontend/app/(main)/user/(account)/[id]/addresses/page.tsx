import MyAddress from "@/components/user-account/MyAddress";
import { fetchProtectedData } from "@/utils/api-utils";
import { Address } from "@/utils/types"; // Assuming you have an Address type

export default async function AddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const endpoint = `addresses/user/${id}`;

  const userAddresses: Address[] = await fetchProtectedData(endpoint);

  return (
    <div>
      <MyAddress addresses={userAddresses} userId={id} />
    </div>
  );
}
