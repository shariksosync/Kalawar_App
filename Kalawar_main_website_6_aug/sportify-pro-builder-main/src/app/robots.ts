import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kalawarsmfi.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/profile/",
        "/cart/",
        "/checkout/",
        "/login/",
        "/register/",
        "/forgot-password/",
        "/api/",
        "/my-certificates/",
        "/my-id-card/",
        "/my-receipts/",
        "/order-confirmation/",
        "/orders/",
        "/receipts/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
