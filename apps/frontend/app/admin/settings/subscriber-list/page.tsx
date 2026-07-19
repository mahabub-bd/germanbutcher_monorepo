import { SubscriberList } from "@/components/subscribers/subscriber-list";

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const page =
    typeof resolvedParams.page === "string"
      ? Number.parseInt(resolvedParams.page)
      : 1;
  const limit =
    typeof resolvedParams.limit === "string"
      ? Number.parseInt(resolvedParams.limit)
      : 10;

  return (
    <div className=" space-y-6 border rounded-sm">
      <SubscriberList initialPage={page} initialLimit={limit} />
    </div>
  );
}
