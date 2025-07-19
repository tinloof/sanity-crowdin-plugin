import type {PageProps} from "@/types";
import type {ResolvingMetadata} from "next";

import ModularPage from "@/components/templates/page/modular-page";
import {loadHome} from "@/data/sanity";
import {resolveSanityRouteMetadata} from "@/data/sanity/resolve-sanity-route-metadata";
import {notFound} from "next/navigation";

export type DefaultRouteProps = {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>;
};

type IndexRouteProps = PageProps<"...path" | "locale", any>;

export async function generateMetadata(
  props: IndexRouteProps,
  parent: ResolvingMetadata,
) {
  const locale = (await props.params).locale;

  const initialData = await loadHome({locale, stega: false});

  if (!initialData) {
    return notFound();
  }

  return resolveSanityRouteMetadata(
    {
      indexable: initialData.indexable,
      pathname: initialData.pathname,
      seo: initialData?.seo,
    },
    parent,
  );
}

export default async function IndexRoute(props: IndexRouteProps) {
  const locale = (await props.params).locale;

  const data = await loadHome({
    locale,
  });

  if (data?._type !== "home") return notFound();

  return <ModularPage data={data} />;
}
