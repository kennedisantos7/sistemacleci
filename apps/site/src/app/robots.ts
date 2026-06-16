import type { MetadataRoute } from "next";

const BASE = process.env.SITE_URL ?? "https://clecipersonalizados.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
