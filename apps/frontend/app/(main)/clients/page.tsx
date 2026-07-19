import { HeadingPrimary } from "@/components/common/heading-primary";
import { fetchData } from "@/utils/api-utils";
import { Client } from "@/utils/types";
import Image from "next/image";

async function getClients(): Promise<Client[]> {
  try {
    const response = await fetchData("clients");
    if (Array.isArray(response)) {
      return response as Client[];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export default async function ClientList() {
  const clients = await getClients();

  if (clients.length === 0) {
    return (
      <div className="w-full py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">
            <p>No client logos available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-5 md:py-10">
      <div className="container mx-auto px-4">
        <HeadingPrimary title="Our Clients" subtitle="Our Prominets Clients" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8 py-5 md:py-10">
          {clients.map((client) => (
            <div
              key={client.Id}
              className="flex   w-full items-center justify-center sm:h-16 md:h-20 lg:h-24 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Image
                src={client.Image?.url || "/placeholder.svg"}
                alt={`${client.name} logo`}
                width={144}
                height={96}
                className="h-full w-full object-contain transition-opacity duration-300 hover:opacity-100 dark:brightness-0 dark:invert"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
