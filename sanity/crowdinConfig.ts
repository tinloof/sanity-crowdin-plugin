import config, { i18nLanguageField } from "@/config";
import { documentInternationalizationAdapter } from "./plugins/crowdin-sanity/adapters";

export const i18nAdapter = documentInternationalizationAdapter({
  languageField: i18nLanguageField,
  pathnameField: "pathname",
});

export const supportedTargetLangs = config.i18n.locales
  .filter((locale) => locale.id !== config.i18n.defaultLocaleId)
  .map((locale) => locale.id);
