import {defineQuery, groq} from "next-sanity";

export const IMAGE_QUERY = groq`{
  ...,
  "alt": asset->altText,
  "caption": asset->caption,
}`;

export const MODULAR_PAGE_QUERY = defineQuery(`
  *[pathname.current == $pathname && _type == "modular.page" && locale == $locale][0]`);

export const HOME_QUERY = defineQuery(`
  *[_type == "home" && locale == $locale][0]`);

export const GLOBAL_QUERY = defineQuery(`
  {
    "fallbackOGImage": *[_type == "settings"][0].fallbackOgImage,
  }`);

export const ROUTE_QUERY = defineQuery(`
  *[pathname.current == $pathname][0] {
    'routeData': {
      ...,
      'pathname': pathname.current,
    },
  }`);

export const SITEMAP_QUERY = defineQuery(`
  *[((pathname.current != null || _type == "home") && indexable && locale == $defaultLocale)] {
    pathname,
    "lastModified": _updatedAt,
    locale,
    _type,
    "translations": *[_type == "translation.metadata" && references(^._id)].translations[].value->{
      "pathname": pathname.current,
      locale
    },
  }`);

export const REDIRECT_QUERY = defineQuery(`
  *[_type == "settings"][0].redirects[@.source in $paths][0]`);

export const STATIC_PATHS_QUERY = defineQuery(`
  *[pathname.current != null && indexable && _type in ["modular.page"]] {
    locale,
    "pathname": pathname.current,
  }`);

export const NOT_FOUND_QUERY = defineQuery(`
  *[_type == "notFound" && locale == $locale][0]`);
