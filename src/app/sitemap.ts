import type { MetadataRoute } from "next";
import { SITE_URL, INDIA_STATES, slugify } from "@/lib/constants";
import {
  getLatestDate,
  getTopCommoditiesByCount,
  getTopMandisByCount,
} from "@/lib/queries";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];

  const date = await getLatestDate().catch(() => null);
  if (!date) return base;

  const [commodities, mandis] = await Promise.all([
    getTopCommoditiesByCount(date, 200).catch(() => []),
    getTopMandisByCount(date, 200).catch(() => []),
  ]);

  return [
    ...base,
    ...INDIA_STATES.map((s) => ({
      url: `${SITE_URL}/s/${slugify(s)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...commodities.map((c) => ({
      url: `${SITE_URL}/c/${slugify(c)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...mandis.map((m) => ({
      url: `${SITE_URL}/m/${slugify(m)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
