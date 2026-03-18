import { API_BASE_URL } from "@/lib/constants";
import { PublicJob } from "@/types/job";

const SERVER_API_BASE_URL = process.env.NEXT_SERVER_API_BASE_URL || API_BASE_URL;

const fallbackJobs: PublicJob[] = [
  {
    id: "1",
    title: "Senior Backend Engineer",
    company: "Ostora Labs",
    city: "Rabat",
    remote: true,
    description: "Design distributed services with NestJS and Kafka.",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Atlas Talent",
    city: "Casablanca",
    remote: false,
    description: "Create high-impact product journeys for hiring teams.",
  },
  {
    id: "3",
    title: "Frontend Platform Engineer",
    company: "Maghreb Tech",
    city: "Marrakech",
    remote: true,
    description: "Build performant UI systems with Next.js and TypeScript.",
  },
];

export async function getPublicJobs(): Promise<PublicJob[]> {
  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/api/v1/jobs/search`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return fallbackJobs;
    }

    const data = (await response.json()) as { data?: PublicJob[] };
    return data.data && data.data.length > 0 ? data.data : fallbackJobs;
  } catch {
    return fallbackJobs;
  }
}

export async function getPublicJobById(id: string): Promise<PublicJob | null> {
  const jobs = await getPublicJobs();
  return jobs.find((job) => job.id === id) || null;
}
