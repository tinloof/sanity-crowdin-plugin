"use client";

import {defaultLocale} from "@/config";
import {getLocale} from "@/utils/locale";
import {useParams} from "next/navigation";

export function useLocale() {
  const {locale} = useParams<{locale: string}>();

  if (!locale)
    throw new Error("Only use this hook under the `[locale]` routes");

  const contextLocale = getLocale(locale);

  const isDefault = contextLocale.id === defaultLocale.id;

  return {isDefault, locale: contextLocale};
}
