"use client";

import type {LinkProps} from "next/link";

import config from "@/config";
import {useLocale} from "@/hooks/use-locale";
import {localizePathname} from "@/utils/locale";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  className?: string;
  href: string;
} & Omit<LinkProps, "href">;

export default function LocalizedLink({...props}: Props) {
  const {locale} = useLocale();

  // Check if the href is an external URL
  const isExternalLink =
    props.href.startsWith("http://") || props.href.startsWith("https://");

  // Check if the href is a relative path or has a hash link
  const isRelativeOrHashLink =
    !props.href.startsWith("/") || props.href.startsWith("#");

  // Check if already localized
  const isAlreadyLocalized = config.i18n.locales.some((loc) =>
    props.href.startsWith(`/${loc.id}/`),
  );

  // Only localize the pathname if it matches one of the above conditions
  const shouldLocalize =
    !isExternalLink && !isRelativeOrHashLink && !isAlreadyLocalized;

  const localizedPathname = shouldLocalize
    ? localizePathname(props.href, locale.id)
    : props.href;

  return <Link {...props} href={localizedPathname} />;
}
