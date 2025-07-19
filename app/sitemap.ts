import type {SITEMAP_QUERYResult} from "@/types/sanity.generated";
import type {MetadataRoute} from "next";

import config from "@/config";

import {SITEMAP_QUERY} from "@/data/sanity/queries";
import {pathToAbsUrl} from "@tinloof/sanity-web";
import {client} from "@/data/sanity/client";

const sanityClient = client.withConfig({
  perspective: "published",
  stega: false,
  token: config.sanity.token,
  useCdn: true,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const defaultLocale = config.i18n.defaultLocaleId;
  // Fetch all public routes with default locale
  const publicSanityRoutes =
    await sanityClient.fetch<SITEMAP_QUERYResult | null>(
      SITEMAP_QUERY,
      {
        defaultLocale,
      },
      {
        next: {
          revalidate: 0,
        },
      },
    );

  const sitemap = generate(publicSanityRoutes) ?? [];

  sitemap.map((item) => {
    console.log(item.alternates);
  });

  // For some reason the alternates languages are not working
  // see this comment => https://github.com/vercel/next.js/discussions/53540#discussioncomment-8868709
  return sitemap;
}

function generate(routes: SITEMAP_QUERYResult | null) {
  return routes?.map((route) => {
    const alternatesLanguages: Record<string, string> = {};
    const isHomePage = route._type === "home";
    const baseUrl = config.baseUrl;

    let url =
      pathToAbsUrl({
        baseUrl,
        path: route.pathname?.current ?? "",
      }) || "";

    if (isHomePage) {
      url = pathToAbsUrl({baseUrl, path: "/"}) || "";
    }

    for (const translation of route.translations) {
      // Add locale slug if it's not the default locale
      if (translation?.locale) {
        alternatesLanguages[translation.locale] = isHomePage
          ? pathToAbsUrl({baseUrl, path: "/" + translation.locale}) || ""
          : pathToAbsUrl({
              baseUrl,
              path: translation.locale + "/" + translation.pathname,
            }) || "";
      }
    }

    return {
      alternates: {
        languages: alternatesLanguages,
      },
      lastModified: route.lastModified || undefined,
      url,
    };
  });
}
