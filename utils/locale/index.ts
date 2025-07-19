import config, {defaultLocale} from "@/config";
import {localizePathname as localizePathnameInternal} from "@tinloof/sanity-web";

export function getLocale(locale: string) {
  const locales = config.i18n.locales;
  return locales.find((l) => l.id === locale) || locales[0];
}

export function localizePathname(pathname: string, locale: string) {
  const isDefault = locale === defaultLocale.id;
  return localizePathnameInternal({isDefault, localeId: locale, pathname});
}
