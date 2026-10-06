import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://batting-coach-ob41fmhxt-arnav-ch.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/coach"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/coach"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
