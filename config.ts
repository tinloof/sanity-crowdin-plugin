import type { Locale } from "./types";

const baseUrlWithoutProtocol =
  process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_BRANCH_URL;

const baseUrl = baseUrlWithoutProtocol
  ? `https://${baseUrlWithoutProtocol}`
  : "http://localhost:3000";

const config = {
  baseUrl: baseUrl,
  i18n: {
   defaultLocaleId: "en",
   locales: [
     {id: "en", title: "English"},
     {id: "fr", title: "French"},
   ],
 },
  sanity: {
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2023-06-21",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "",
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    revalidateSecret: process.env.SANITY_REVALIDATE_SECRET || "",
    studioUrl: "/cms",
    // Not exposed to the front-end, used solely by the server
    token: process.env.SANITY_API_TOKEN || "",
  },
  siteName: "Base",
};

export const i18nLanguageField = "locale" as const;

export const defaultLocale = config.i18n.locales.find(
 (locale) => locale.id === config.i18n.defaultLocaleId,
) as Locale;

export default config;
