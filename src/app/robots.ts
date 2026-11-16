import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Versões de teste da Vercel (Preview) não devem aparecer no Google.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Páginas pessoais, do painel e de compra não têm o que indexar.
      disallow: ["/admin", "/api/", "/account", "/checkout", "/cart", "/wishlist", "/login", "/register"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
