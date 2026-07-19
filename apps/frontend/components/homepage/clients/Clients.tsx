import { Marquee } from "@/components/ui/marquee";
import { fetchPublicData } from "@/utils/api-utils";
import { Client } from "@/utils/types";
import Image from "next/image";
import type React from "react";

interface ClientMarqueeProps {
  children?: React.ReactNode;
}

async function getClients(): Promise<Client[]> {
  try {
    const response = await fetchPublicData("clients");
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

export default async function ClientMarquee({ children }: ClientMarqueeProps) {
  const clients = await getClients();

  const midPoint = Math.ceil(clients.length / 2);
  const firstRowClients = clients.slice(0, midPoint);
  const secondRowClients = clients.slice(midPoint);

  if (clients.length === 0) {
    return (
      <div className="w-full py-8 md:py-12">
        {children}
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">
            <p>No client logos available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 md:py-12 ">
      {children}
      <div className="container mx-auto px-4">
        <Marquee pauseOnHover className="[--duration:40s] mb-4 md:mb-6">
          {firstRowClients.map((client) => (
            <div
              key={`top-${client.Id}`}
              className="flex h-12 w-20 items-center justify-center sm:h-16 sm:w-28 md:h-20 md:w-32 lg:h-24 lg:w-36 mx-4 md:mx-6 lg:mx-8"
            >
              <Image
                src={client.Image?.url || "/placeholder.svg"}
                alt={`${client.name} logo`}
                title={`${client.name} logo`}
                width={144}
                height={96}
                className="h-full w-full object-contain transition-opacity duration-300 hover:opacity-100 dark:brightness-0 dark:invert"
              />
            </div>
          ))}
        </Marquee>

        <Marquee reverse pauseOnHover className="[--duration:40s]">
          {secondRowClients.map((client) => (
            <div
              key={`bottom-${client.Id}`}
              className="flex h-12 w-20 items-center justify-center sm:h-16 sm:w-28 md:h-20 md:w-32 lg:h-24 lg:w-36 mx-4 md:mx-6 lg:mx-8"
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
        </Marquee>
      </div>
    </div>
  );
}
