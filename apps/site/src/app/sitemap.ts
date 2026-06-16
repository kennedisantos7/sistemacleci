import type { MetadataRoute } from "next";
import { ALL_PRODUCTS } from "@/lib/catalog";

const BASE = process.env.SITE_URL ?? "https://cleci.com.br";

const STATIC_ROUTES = [
  "",
  "/produtos",
  "/tapetes",
  "/grafica",
  "/sacolas",
  "/playground",
  "/mesas-e-freezers",
  "/seguranca",
  "/comunicacao-visual",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = ALL_PRODUCTS.map((p) => ({
    url: `${BASE}/produto/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries];
}
