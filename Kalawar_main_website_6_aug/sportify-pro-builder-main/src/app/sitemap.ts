import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kalawarsmfi.com";

  // Important public static routes
  const routes = [
    "",
    "/about",
    "/affiliation",
    "/belt-exams",
    "/certificates",
    "/certified-belts-candidates",
    "/championship",
    "/clubs",
    "/coaches",
    "/contact",
    "/dan-grading",
    "/district-association",
    "/downloads",
    "/events",
    "/gallery",
    "/news",
    "/ranking",
    "/referees",
    "/results",
    "/rules",
    "/shop",
    "/state-association",
    "/verify",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
